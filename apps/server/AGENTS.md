# server — NestJS Guidelines

This file defines how the `server` app (NestJS + Prisma 7 + Supabase self-hosted Postgres + Scalar
API docs) must be structured and written. It extends, and does not replace, the root
[AGENTS.md](../../AGENTS.md) directives — Spanish end-user text, strict typing, no `any`, English
identifiers, service-layer-only Prisma access, etc. all still apply here.

The project also ships two reference skills worth reading for deeper rationale and code samples:
`.agents/skills/nestjs-best-practices` (40 rules, prioritized) and `.agents/skills/nestjs-patterns`
(structure + snippets). This document is the project-specific contract; those skills are the
general-purpose backing reference.

## 1. Project structure

Keep feature code as top-level folders under `src/<feature>` (current layout) — do **not** move
everything under `src/modules/`, that would be pure churn for no behavioral gain. Instead, add the
two folders every non-trivial Nest app needs and that we're currently missing:

```text
src/
├── main.ts
├── app.module.ts
├── common/                # cross-cutting, reusable across features
│   ├── filters/           # exception filters (e.g. PrismaExceptionFilter)
│   ├── guards/            # AuthGuard, RolesGuard
│   ├── interceptors/
│   ├── decorators/        # e.g. @Roles(), @CurrentUser()
│   └── pipes/
├── config/
│   ├── configuration.ts   # typed config factory
│   └── validation.ts      # Joi/Zod schema, validated at boot
├── prisma/
│   ├── prisma.module.ts   # @Global, exports PrismaService
│   └── prisma.service.ts  # connects as `authenticator`; owns withRls() — see §12
├── auth/                  # GoTrue-backed login/refresh/admin-provisioning (see §12)
└── <feature>/              # one folder per domain feature (users, appointments, ...)
    ├── dto/
    │   ├── create-<feature>.dto.ts
    │   └── update-<feature>.dto.ts
    ├── <feature>.controller.ts
    ├── <feature>.service.ts
    └── <feature>.module.ts
```

Rules:

- A feature module owns its controller, service, and DTOs. Business logic lives in the service —
  controllers only parse HTTP input, delegate, and return a value.
- `PrismaModule` is `@Global()`. **Never** re-list `PrismaService` in a feature module's
  `providers` array — just inject it via constructor. Re-providing it creates a second instance
  (and a second DB pool) instead of reusing the shared one.
- Only export providers other modules genuinely need. Most feature services should not be exported
  unless another module actually consumes them.

## 2. Naming conventions

- All identifiers (files, classes, variables, DTO fields, Prisma fields) in English, camelCase for
  TS members, PascalCase for classes, kebab-case for filenames — per root AGENTS.md.
- **DTO fields must match the domain's camelCase convention.** Do not mix `snake_case` request
  fields (e.g. `full_name`) with a `camelCase` Prisma model (`fullName`). If the API truly needs to
  accept `snake_case` over the wire, do it explicitly and consistently via a naming strategy/
  transform — not ad hoc per field, and not by hand-mapping every field in the service.
- Controller route paths: plural nouns, kebab-case for multi-word resources (`/clinical-notes`, not
  `/clinicalNotes`).
- Suffix classes by role: `*Controller`, `*Service`, `*Module`, `*Dto`, `*Guard`, `*Filter`,
  `*Interceptor`.

## 3. Controllers

- Keep controllers thin: validate via DTO + pipes, call one service method, return its result (or a
  response DTO). No business logic, no direct Prisma access (already enforced by root AGENTS.md).
- Use the correct built-in pipe for every path/query param (`ParseIntPipe`, `ParseUUIDPipe`, etc.).
- Every route must actually do what its handler name says. A method named `findAll` must map to a
  route that lists a collection; a single-resource lookup must be named `findOne`/`getById`. Wire up
  every service method that's meant to be reachable — don't leave `findAll()` implemented and
  unrouted while a different handler quietly shadows the same path.
- **Document every route for Scalar/Swagger**: `@ApiTags(...)` on the controller, `@ApiOperation`
  and at least the success/error `@ApiResponse` on each handler. Undocumented endpoints are not
  done.
- **Versioning**: prefix all resource routes with `/api/v1` (either via
  `app.setGlobalPrefix('api')` + Nest URI versioning, or explicitly in `@Controller('v1/users')`).
  Pick one approach before adding more endpoints — right now `/` and `/users` are unprefixed while
  the docs live at `/api/docs`, which is already an inconsistent namespace.

## 4. DTOs & validation

- Every request DTO is validated with `class-validator` decorators — no exceptions. The global
  `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true, transform: true`) is already
  correctly configured in `main.ts`; keep it that way for every future route.
- Annotate every DTO property with `@ApiProperty()` (or `@ApiPropertyOptional()`), so Scalar renders
  real request/response schemas instead of empty objects.
- **Never return a raw Prisma entity from a controller.** Define a response DTO (or a
  `@Exclude()`-annotated entity class + global `ClassSerializerInterceptor`) for anything that comes
  back from a query, especially `User`. Relying only on a per-query `omit: { passwordHash: true }`
  is fragile — it's exactly the kind of thing that gets forgotten once (see `remove()` in
  `users.service.ts`, which currently returns the deleted user's `passwordHash`).
- Use `PartialType(CreateXDto)` for update DTOs (already done for `UpdateUserDto`) — don't
  hand-redeclare optional fields.

## 5. Error handling

- Throw Nest's built-in `HttpException` subclasses (`NotFoundException`, `ConflictException`,
  `BadRequestException`, ...) from services for expected failure cases. Do not let a `null` from
  `findUnique` flow back to the controller as an HTTP 200 with an empty body — check for it and
  throw `NotFoundException`. (Note: with RLS in place, a `null` also correctly means "exists but you
  can't see it" — a 404 either way is the right thing to leak, not a bug.)
- `common/filters/prisma-exception.filter.ts` (global, wired in `main.ts`) catches
  `Prisma.PrismaClientKnownRequestError` and maps known codes to HTTP errors: `P2025` → 404,
  `P2002` → 409, `P2003` → 400. It also unwraps the `@prisma/adapter-pg` driver-adapter error shape
  (`exception.meta.driverAdapterError.cause.code`) to recognize raw Postgres errors that Prisma
  itself only reports as a generic `P2039` — in particular `P0001` (a `RAISE EXCEPTION` from an
  application trigger, e.g. `protect_privileged_columns`) → 403, since that's an authorization
  refusal, not a server bug. Extend this switch, don't bypass it, when a new trigger/constraint
  needs its own HTTP mapping.
- Keep one consistent JSON error envelope across the whole API (`statusCode`, `message`, `path`,
  `timestamp`).
- Per root AGENTS.md: the `message` shown to API consumers must be formal, impersonal Spanish.
  Internal `Logger` output (stack traces, debug context) stays in English/technical form — these are
  two different audiences, don't conflate them.

## 6. Security

This server holds health data (biometrics, clinical notes, emotional journals, panic alerts) —
security is enforced in two independent layers, and both matter:

- **App layer**: `JwtAuthGuard` is registered globally (`APP_GUARD`) — every route requires a valid
  Supabase Auth (GoTrue) JWT unless explicitly marked `@Public()` (see `common/decorators/
  public.decorator.ts`; currently only the health check and `/auth/login`/`/auth/refresh`). Add
  `@UseGuards(RolesGuard)` + `@Roles(Role.xxx)` on any handler that should be restricted beyond
  "any authenticated user" — see `UsersController.create`/`remove` for the pattern.
- **DB layer**: Row Level Security (see §12) independently enforces the same access rules at the
  Postgres level. Never treat the app-layer guard as sufficient on its own for a new sensitive
  table — add both.
- Never hardcode tunable security parameters (bcrypt salt rounds, token TTLs) — read them from
  `ConfigService`. (There is no bcrypt in this app anymore — GoTrue owns password storage entirely;
  don't reintroduce local password hashing.)
- Add `helmet()` and an explicit CORS allowlist in `main.ts` before this API is exposed beyond
  localhost. Not done yet — still a gap.
- Add rate limiting (`@nestjs/throttler`) on write endpoints and anything auth-related. Not done
  yet — still a gap.
- Never log `passwordHash` (doesn't exist anymore) or raw health-record content. Redact sensitive
  fields in any logging interceptor.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely and must never reach a client. It is used in
  exactly one place (`AuthService.adminCreateUser`/`adminUpdatePassword`) — do not thread it into
  any other code path without a specific reason.

## 7. Config

- `src/config/configuration.ts` + `src/config/validation.ts`, wired into `ConfigModule.forRoot({
  load: [configuration], validate })` in `app.module.ts`. `validate` fails fast at boot if any
  required env var is missing (see the list there) rather than failing on the first request that
  happens to touch it.
- Access config through `ConfigService` — `main.ts` and `PrismaService` both do this already. Don't
  reintroduce direct `process.env.X` reads in application code; add the var to `configuration.ts`
  instead (a one-off script like `prisma/seed.ts`, which runs outside Nest's DI, is the one
  legitimate exception).

## 8. Prisma & database

- All Prisma access stays inside services (already respected) — never inject `PrismaService` into a
  controller.
- **Every query against an RLS-protected table MUST go through `this.prisma.withRls(tx => ...)`**,
  never `this.prisma.user.findMany()` directly. See §12 — a bare call runs as the `authenticator`
  role with no privileges switched in and will simply fail (not silently bypass RLS).
- Schema changes always go through `prisma migrate` — never hand-edit the database or generated
  client. RLS policies/functions/triggers are the one exception: they're plain SQL inside a
  migration file (`prisma migrate dev --create-only` then hand-write the SQL, since they aren't
  representable in `schema.prisma`) — see §12.
- Add `@@index` on foreign-key columns that are queried or joined on often (`studentId`, `doctorId`,
  `deviceId`, `biometricRecordId`, etc.) — Postgres does not auto-index FK columns, and this schema
  has several one-to-many relations that will be queried by parent id.
- Wrap multi-step writes that must succeed or fail together (e.g. creating an `Appointment` and its
  `ClinicalNote`) in `prisma.$transaction(...)` — note `withRls` already gives you an open
  transaction (the `tx` parameter); do multi-step writes inside one `withRls` call, don't nest
  another `$transaction` inside it.
- Avoid N+1 queries — use `include`/`select` to fetch related data in one round trip instead of
  looping and querying per record.
- Any list endpoint (`findAll`) must paginate (`skip`/`take` with a sane default and an enforced
  max) — never return an unbounded table scan.

## 9. Testing

- Every service gets unit tests (`*.service.spec.ts`) with `PrismaService` mocked via Nest's
  `Test.createTestingModule` — assert both the happy path and the not-found/conflict paths.
- Every controller gets either unit tests with the service mocked, or e2e tests
  (`test/*.e2e-spec.ts`) via `supertest` that exercise real HTTP validation (bad payload → 400,
  missing resource → 404).
- Reuse the same global pipes/filters in tests as in `main.ts` — a test that skips
  `ValidationPipe` isn't testing the real behavior.
- A new endpoint is not "done" without at least one test proving the failure path (not just the
  happy path).

## 10. Docs & lint hygiene

- `apps/server/README.md` is still the unmodified Nest CLI starter template — replace it with real
  project docs (env vars, how to run migrations, how to reach `/api/docs`) as part of any PR that
  touches setup/config.
- Run `pnpm lint` and `pnpm format` before committing — the repo already enforces
  `no-explicit-any`, `no-floating-promises`, and Prettier via ESLint; several existing files
  (`users.controller.ts`, `users.service.ts`) currently have formatting inconsistent with those
  rules and should be cleaned up next time they're touched.

## 12. Row Level Security (RLS) & Supabase Auth

Compliance requires DB-level enforcement, not just app-level guards — a superuser connection
bypasses RLS unconditionally, so this only works because the app connects as a **non-superuser**
role. This section is the load-bearing one; read it before touching auth, `PrismaService`, or any
new RLS-protected table.

**Identity & auth.** Users authenticate via self-hosted **Supabase Auth (GoTrue)**, not a local
password table — `remote_users.id` is a foreign key into `auth.users(id)` (`ON DELETE CASCADE`),
and there is no `passwordHash` column anymore. `AuthService` proxies GoTrue's password grant
(`/auth/login`, `/auth/refresh`) and provisions accounts via GoTrue's **Admin API**
(`adminCreateUser`/`adminUpdatePassword`, using the server-only `SUPABASE_SERVICE_ROLE_KEY`) —
registration is admin-provisioned, not public self-signup. `JwtAuthGuard` verifies the GoTrue-issued
JWT locally (`SUPABASE_JWT_SECRET`, HS256) and resolves the caller's ECOS profile
(`role`/`institutionId`) via one explicitly-scoped self-lookup (see below). A brand new environment
has no administrator to provision the first one through the API — `prisma/seed.ts` bootstraps
exactly one, connecting directly as `postgres` + calling the GoTrue Admin API itself. Re-run it (or
adapt it) whenever a fresh environment needs its first admin.

**How RLS is bridged through Prisma.** Prisma has no built-in RLS support, and — this was tried and
verified not to work — a transparent `$extends({ query: { $allOperations } })` client extension
**cannot** redirect the wrapped query into a separately-opened `$transaction`; the `query(args)`
callback Prisma hands you always executes against the original client. The only verifiably-correct
approach is `PrismaService.withRls(fn)` (`src/prisma/prisma.service.ts`): it opens a real interactive
transaction (`$transaction(async (tx) => ...)`, which *does* guarantee same-connection execution for
everything called via `tx`), and inside that one connection runs, in order:
1. `SELECT set_config('request.jwt.claims', '<json sub/role>', true)` — the same session variable
   PostgREST sets per-request, so `auth.uid()`/`auth.role()` work exactly as in any Supabase doc.
2. `SET LOCAL ROLE <anon|authenticated|service_role>` — the actual privilege switch. `authenticator`
   (what `APP_DATABASE_URL` connects as) is `NOBYPASSRLS`/`NOINHERIT` and has no table grants of its
   own; it can only *become* one of `anon`/`authenticated`/`service_role` via `SET ROLE`, mirroring
   what PostgREST does per-request. This is why a bare `this.prisma.user.findMany()` fails outright
   instead of silently working unscoped — there is no privilege to fall back to.

The identity for step 1/2 comes from `AsyncLocalStorage` (`common/context/rls-context.ts`),
populated by the global `RlsContextInterceptor` from `request.user` — which `JwtAuthGuard` sets.
**Ordering matters and is easy to get wrong**: Nest runs Guards *before* Interceptors, so at the
point `JwtAuthGuard` runs, the ALS context doesn't exist yet. That's why `JwtAuthGuard`'s own
self-lookup calls `withRls(fn, { userId, role: 'authenticated' })` with an **explicit override**
instead of relying on ALS — it's the one call site that has to bootstrap its own identity. Every
other call, in any service, should call `withRls(fn)` with no override and let ALS supply it.

**Writing new policies — the pattern from `remote_users`/`remote_student_profiles`/
`remote_biometric_records`** (migration `20260913120500_rls_policies`):
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; ... FORCE ROW LEVEL SECURITY;` — `FORCE` matters even
   though the app doesn't connect as the table owner; add it anyway, it's what makes intent explicit
   and protects against a future owner-switch.
2. `GRANT SELECT/INSERT/UPDATE/DELETE ... TO authenticated` (+ `GRANT USAGE ON SEQUENCE ...` for any
   serial PK) **before** writing policies. Policies only restrict rows on an operation the role is
   already allowed to attempt — no grant means the operation fails regardless of any policy, and
   this is the single easiest thing to forget.
3. **Never let a policy directly query another RLS-protected table that might query back into this
   one** — that's an infinite-recursion trap Postgres will happily let you create (hit and fixed
   live in this session: `remote_student_profiles`'s policy queried `remote_users`, whose own policy
   queried `remote_student_profiles`). Route any cross-table lookup through a `SECURITY DEFINER
   STABLE` SQL function instead (`current_user_role()`, `current_user_institution_id()`,
   `institution_id_for_user()`, `can_access_student_profile()` in the migration) — created by a
   migration (runs as `postgres`), so it executes with the superuser's RLS-bypass, breaking the
   cycle at the source. Always add `set search_path = ''` and fully-qualify names in these
   functions (hardening against search_path hijacking).
4. **RLS is row-level only.** If any column on the row must be off-limits to a non-privileged
   caller who otherwise passes the row-level check (e.g. a user updating their own row shouldn't be
   able to change their own `role`), RLS cannot express that — add a `BEFORE UPDATE` trigger that
   rejects the change (see `protect_privileged_columns`).
5. Update `PrismaExceptionFilter` if the new trigger's raised message needs specific HTTP-status
   handling beyond the generic 403 the `P0001` case already gives you.

**Known follow-up, not yet solved**: automated device ingestion (a band device pushing biometric
readings with no logged-in clinician present) has no `auth.uid()` to check against — that path
needs its own decision (likely a `service_role`-authenticated ingestion endpoint), not the
`authenticated`-role policy used for interactive access.

**Extending RLS to the remaining tables** (`remote_alerts`, `remote_appointments`,
`remote_clinical_notes`, `remote_band_devices`, `remote_emotional_journal`,
`remote_institutions`) — same checklist every time:
- [ ] `ENABLE`/`FORCE ROW LEVEL SECURITY`
- [ ] `GRANT`s for `authenticated` (table + any sequence)
- [ ] select/insert/update/delete policies, reusing `current_user_role()`/
      `current_user_institution_id()`/`can_access_student_profile()` — add a new `SECURITY DEFINER`
      helper only for a genuinely new cross-table lookup, and check it can't recurse
- [ ] A trigger if any column needs to be off-limits beyond what row-level access already implies
- [ ] A test proving both the allowed and the denied case (see §9)

## 13. Definition of done for a new endpoint

- [ ] DTOs validated with `class-validator` and documented with `@ApiProperty`
- [ ] Controller documented with `@ApiTags`/`@ApiOperation`/`@ApiResponse`
- [ ] Business logic in the service, not the controller
- [ ] Not-found / conflict cases throw the correct `HttpException`
- [ ] No raw Prisma entity leaks sensitive fields in the response
- [ ] Auth/role guard applied if the resource isn't public
- [ ] If the table holds sensitive data: RLS enabled + policies written (§12), not just an app guard
- [ ] All Prisma calls in the service go through `this.prisma.withRls(...)`, not a bare call
- [ ] Unit test(s) for the service, covering the failure path
- [ ] `pnpm lint` and `pnpm format` clean
