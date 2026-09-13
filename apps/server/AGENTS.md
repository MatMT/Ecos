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
│   └── prisma.service.ts
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
  throw `NotFoundException`.
- Add a global exception filter (`common/filters/prisma-exception.filter.ts`) that catches
  `Prisma.PrismaClientKnownRequestError` and maps known codes to HTTP errors (`P2025` → 404,
  `P2002` → 409, etc.), so a missing row on `update`/`delete` doesn't surface as an unhandled 500
  with a raw Prisma stack trace.
- Keep one consistent JSON error envelope across the whole API (`statusCode`, `message`, `path`,
  `timestamp`).
- Per root AGENTS.md: the `message` shown to API consumers must be formal, impersonal Spanish.
  Internal `Logger` output (stack traces, debug context) stays in English/technical form — these are
  two different audiences, don't conflate them.

## 6. Security

This server holds health data (biometrics, clinical notes, emotional journals, panic alerts) — treat
security as a first-class requirement, not a later pass:

- Every route beyond the public health check must sit behind an auth guard once authentication
  exists. The `Role` enum (`student`, `psychologist`, `administrator`) already models the access
  tiers the schema needs — a `RolesGuard` + `@Roles()` decorator should enforce them before any
  clinical or biometric endpoint ships.
- Never hardcode tunable security parameters (bcrypt salt rounds, token TTLs) — read them from
  `ConfigService`.
- Add `helmet()` and an explicit CORS allowlist in `main.ts` before this API is exposed beyond
  localhost.
- Add rate limiting (`@nestjs/throttler`) on write endpoints and anything auth-related.
- Never log `passwordHash` or raw health-record content. Redact sensitive fields in any logging
  interceptor.

## 7. Config

- Validate environment variables at boot (Joi or Zod schema passed to `ConfigModule.forRoot({
  validate })`) so a missing/malformed `DATABASE_URL` fails fast on startup, not on the first
  request.
- Access config through `ConfigService` (or a typed config factory), not `process.env` scattered
  across files. `main.ts` (`process.env.PORT`) and `prisma.service.ts`
  (`process.env.DATABASE_URL`) currently read `process.env` directly — route both through
  `ConfigService` once the validated config module is in place.

## 8. Prisma & database

- All Prisma access stays inside services (already respected) — never inject `PrismaService` into a
  controller.
- Schema changes always go through `prisma migrate` — never hand-edit the database or generated
  client.
- Add `@@index` on foreign-key columns that are queried or joined on often (`studentId`, `doctorId`,
  `deviceId`, `biometricRecordId`, etc.) — Postgres does not auto-index FK columns, and this schema
  has several one-to-many relations that will be queried by parent id.
- Wrap multi-step writes that must succeed or fail together (e.g. creating an `Appointment` and its
  `ClinicalNote`) in `prisma.$transaction(...)`.
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

## 11. Definition of done for a new endpoint

- [ ] DTOs validated with `class-validator` and documented with `@ApiProperty`
- [ ] Controller documented with `@ApiTags`/`@ApiOperation`/`@ApiResponse`
- [ ] Business logic in the service, not the controller
- [ ] Not-found / conflict cases throw the correct `HttpException`
- [ ] No raw Prisma entity leaks sensitive fields in the response
- [ ] Auth/role guard applied if the resource isn't public
- [ ] Unit test(s) for the service, covering the failure path
- [ ] `pnpm lint` and `pnpm format` clean
