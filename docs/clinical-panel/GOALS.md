# Clinical Panel — Goals & Roadmap

**Status:** Draft — Phase 0 not yet started
**Owner:** `server` team (this branch: `server/expand-endpoints-and-db-refactor`)
**Source:** [`technical-guide.md`](./technical-guide.md) — proposal received 2026-09-16 (in
Spanish) from the `mobile` app's lead, written to prepare the backend for a therapist/administrator
web panel (`therapist-web`, `admin-web`). An English translation, with the corrections from §4
below already applied, lives at [`technical-guide.en.md`](./technical-guide.en.md) — read that one
day-to-day; the Spanish original stays untouched as the record of what was actually proposed.

## 1. Purpose

This document is the single place that says **what** we're building toward and **why**, so that
implementing it can be split into small, reviewable phases instead of one massive schema
refactor. It does not contain step-by-step implementation instructions — each phase gets its own
plan (see [§7](#7-process--how-a-phase-goes-from-here-to-merged)), written right before that phase
starts, once the previous phase has landed and the ground truth (schema, endpoints) has moved.

Audience: anyone working on `apps/server`, and anyone on `therapist-web`/`admin-web` who needs to
know what the API will look like before it exists.

## 2. Why this exists

The `server` app currently exposes a general "remote ecosystem" for the mobile app (institutions,
users, student profiles, band devices, biometrics, alerts, a private emotional journal,
appointments, one clinical note per appointment). It has no concept of: a therapist's schedule, a
patient's longitudinal clinical record, treatment continuity, an alert lifecycle, or an audit trail
— all of which a clinical panel for psychologists and administrators needs. `technical-guide.md` is
a full proposal for closing that gap **additively**, without renaming or breaking what the mobile
app already depends on.

## 3. Guiding principles (non-negotiable across every phase)

These come from `technical-guide.md` §1–2 and from the existing [`AGENTS.md`](../../AGENTS.md) /
[`apps/server/AGENTS.md`](../../apps/server/AGENTS.md) — restated here because every phase plan must
respect them without re-justifying them each time:

1. **Additive only.** No renaming `StudentProfile` → `PatientProfile`, no dropping columns, no
   breaking the mobile app's existing contract. "Patient" is a UI/vocabulary choice, not a schema
   change — see `technical-guide.md` §2.1.
2. **New tables only for concepts with their own lifecycle/history** (e.g. `TherapistAssignment`,
   `ClinicalRecord`). If a capability fits as a field on an existing model, extend the model instead
   of inventing a new one.
3. **RLS is mandatory on every new table**, not just an app-level guard — follow the checklist in
   `apps/server/AGENTS.md` §11 exactly (`ENABLE`/`FORCE ROW LEVEL SECURITY`, grants before policies,
   `app_private` helper functions, `(SELECT auth.uid())` wrapping, an index on every FK). A table
   holding clinical data with only an app-layer guard is not "done" — it's the same mistake the
   `remote_band_devices` incident in that file already describes.
4. **Authorization = role + institution + relationship**, never role alone. A `psychologist` must
   have an active assignment (or explicit authorization) to touch a given patient's data —
   `technical-guide.md` §6, "Regla crítica."
5. **Multi-step writes are one transaction.** Reassigning a therapist, creating an appointment,
   completing a session — each is one atomic unit (`technical-guide.md` §8.1), using
   `PrismaService.withRls(tx => ...)`, never two separate calls.
6. **No physical deletes on clinical records.** `ClinicalNote` and similar entities get
   `voidedAt`/`voidedBy`/`voidReason` (or equivalent), never `DELETE` — `technical-guide.md` §7.6.
7. **`EmotionalJournal` stays mobile-only.** The panel never reads it directly; only
   `SharedPatientContent` (an explicit, patient-initiated snapshot) is panel-visible.
8. **Biometrics stay aggregated.** The panel consumes summarized/processed `BiometricRecord` rows,
   never raw high-frequency band signal — that stays an edge/mobile concern.
9. **Every endpoint ships documented** — DTOs with `@ApiProperty`, controllers with
   `@ApiTags`/`@ApiOperation`/`@ApiResponse`, per `apps/server/AGENTS.md` §3–4 and §12's "Definition
   of done." This was already the rule; **Phase 0** (below) exists because the rule wasn't followed
   retroactively for what already shipped.

## 4. Corrections applied to the source proposal

`technical-guide.md` is preserved verbatim as received. It predates (or didn't account for) the
Supabase Auth migration that changed `User.id` from an auto-incrementing integer to a
Supabase-issued UUID string (`String @db.Uuid`). Every field in the guide's Prisma snippets that
references a **therapist/user** must therefore be corrected from `Int` to `String @db.Uuid` when
actually implemented. `studentId`-style fields are unaffected — `StudentProfile.id` is still `Int`.

| Model (per guide) | Field | Guide's type | Actual type to implement |
|---|---|---|---|
| `TherapistAssignment` | `therapistId` | `Int` | `String @db.Uuid` |
| `TherapistAssignment` | `assignedById` | `Int?` | `String? @db.Uuid` |
| `PsychologistProfile` | `userId` | `Int @unique` | `String @unique @db.Uuid` |
| `TherapistSchedule` | `therapistId` | `Int` | `String @db.Uuid` |
| `TherapistScheduleException` | `therapistId` | `Int` | `String @db.Uuid` |
| `Appointment` (extension) | `createdById` | `Int?` | `String? @db.Uuid` |
| `TreatmentPlan` | `therapistId` | `Int` | `String @db.Uuid` |
| `StudentActivity` | `therapistId` | `Int?` | `String? @db.Uuid` |
| `Alert` (extension) | `reviewedById` | `Int?` | `String? @db.Uuid` |
| `AlertAction` | `therapistId` | `Int` | `String @db.Uuid` |
| `SharedPatientContent` | `therapistId` | `Int?` | `String? @db.Uuid` |
| `AuditLog` | `userId` | `Int` | `String @db.Uuid` |

No other structural corrections are needed — the rest of the proposal (naming, additive approach,
RLS awareness, transaction boundaries) already matches this codebase's conventions.

## 5. Explicitly deferred / out of scope

- **Actually delivering notifications** (email/WebSocket/push for the events in
  `technical-guide.md` §10). Every phase that emits a relevant domain event just needs a clear
  extension point (e.g. a Nest `EventEmitter2` call) — wiring an actual delivery channel is its own
  future initiative.
- **A standalone `Session` model.** The source guide itself rules this out for now —
  `Appointment` + `ClinicalNote` remain the unit of a clinical session.
- **Enums for fast-moving catalogs** (`AlertAction.actionType`, `Appointment.modality`). Start as a
  `class-validator`-checked string union in the DTO; promote to a Prisma `enum` later once the
  catalog is stable — a Postgres enum is cheap to extend but annoying to rename/remove values from,
  and these two are the ones still most likely to change during Phases 2 and 5.

## 6. Phases

Phase 0 is new — added at Javier's request, ahead of Phase 1, because it's pure infrastructure
(no schema change) and because every subsequent phase produces new endpoints that need to land
already documented, not retrofitted later.

| Phase | Deliverable | New tables | Status |
|---|---|---|---|
| **0 · API foundation (docs & versioning)** | Scalar/Swagger actually documents every existing route and model; every route moves under `/api/v1` (see §6.1) | none | Not started |
| **1 · Operational base** | `TherapistAssignment`, `PsychologistProfile`; institution/assignment-scoped authorization; patient & therapist endpoints | `TherapistAssignment`, `PsychologistProfile` | Not started |
| **2 · Scheduling & agenda** | `TherapistSchedule` + exceptions, availability engine, `Appointment` extensions, reschedule/conflict handling | `TherapistSchedule`, `TherapistScheduleException` | Not started |
| **3 · Clinical record** | `ClinicalRecord`, extended `ClinicalNote`, edit restrictions, clinical audit events | `ClinicalRecord` | Not started |
| **4 · Therapeutic continuity** | `TreatmentPlan`, `TreatmentGoal`, `Activity`, `StudentActivity` | `TreatmentPlan`, `TreatmentGoal`, `Activity`, `StudentActivity` | Not started |
| **5 · Alerts & biometrics** | `Alert` lifecycle (priority/status), `AlertAction`, biometric summaries/trends | `AlertAction` | Not started |
| **6 · Shared content** | `SharedPatientContent` and panel access rules | `SharedPatientContent` | Not started |
| **7 · Dashboards** | `/students/:id/overview`, clinical timeline, `/dashboard/psychologist`, `/dashboard/administrator` | none (query-only) | Not started |
| **8 · Hardening** | Authorization tests (allowed + denied case per table), FK index audit, audit-log review, idempotency, full OpenAPI pass | none | Not started |

Consent/TrustedContact/AuditLog (guide §3.11–3.12) aren't pinned to a single phase above — `AuditLog`
is threaded through Phases 3, 5 and 6 (each phase adds the audit events relevant to what it ships,
per `technical-guide.md` §12), and `Consent`/`TrustedContact` will be scheduled once a phase actually
needs them (nothing in Phases 0–8 currently blocks on them).

### 6.1 Phase 0 in detail

Two independent pieces of infrastructure, bundled into one phase because neither touches the schema
and both should land before 15+ new modules start adding routes on top of them.

#### 6.1.1 Why Scalar's "Models" are empty, and how endpoint docs work

**Root cause of the empty Models tab:** none of the existing DTOs use `@ApiProperty()` /
`@ApiPropertyOptional()` (checked `CreateUserDto`, `LoginDto`, etc.), so `SwaggerModule` has no field
metadata to generate a schema from — Scalar renders an empty object. No controller uses
`@ApiTags`/`@ApiOperation`/`@ApiResponse` either, and `nest-cli.json` doesn't enable the
`@nestjs/swagger` CLI plugin, so nothing is auto-inferred at build time.

**Yes, endpoint descriptions and use-case notes are absolutely supported.** Concretely:

1. **Enable the CLI plugin** in `apps/server/nest-cli.json`:
   ```json
   "compilerOptions": {
     "plugins": [{ "name": "@nestjs/swagger", "options": { "introspectComments": true } }]
   }
   ```
   This auto-generates `@ApiProperty` for most DTO fields from their TS type + `class-validator`
   decorators (no manual annotation needed for the common cases), and — with
   `introspectComments: true` — pulls a JSDoc comment above a DTO property or a controller method
   straight into its Scalar description. A short `/** ... */` above a handler becomes both code
   documentation and the text a therapist-web/admin-web developer reads in Scalar.
2. **Annotate every existing DTO explicitly** wherever the plugin's inference isn't enough
   (enums, examples, nested/array shapes): `CreateUserDto`, `UpdateUserDto`, `LoginDto`,
   `RefreshTokenDto`, `ForgotPasswordDto`, `UpdatePasswordDto`.
3. **Add response DTOs** for everything a controller currently returns as a raw Prisma entity (this
   is also required by `apps/server/AGENTS.md` §4, independent of Scalar) — at minimum a
   `UserResponseDto` and an `AuthResponseDto`, wired via `@ApiResponse({ type: ... })` — so Scalar
   shows real response schemas, not just request bodies.
4. **Document every existing controller**: `@ApiTags` on `AppController`, `UsersController`,
   `AuthController`; `@ApiOperation({ summary, description })` and at least the success + one error
   `@ApiResponse` per handler.
5. Result: this becomes the baseline every phase from here on is held to (it's already in
   `apps/server/AGENTS.md` §12's definition of done — Phase 0 just makes the existing debt current).

#### 6.1.2 `/api/v1` prefix

`apps/server/AGENTS.md` §3 already flagged this as an open gap — `/` and `/users` are unprefixed
while docs live at `/api/docs`. Originally deferred here as unrelated risk, but revisited at
Javier's call: worth doing now, while only two controllers (`auth`, `users`) exist, rather than
after Phases 1–7 add a dozen more that would all need the same edit later.

**Approach:** global prefix + URI versioning, not per-controller paths — one line in `main.ts`
covers every current and future controller instead of editing each `@Controller(...)` decorator:

```ts
app.setGlobalPrefix('api');
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
```

This turns `/users` into `/api/v1/users` and `/auth/login` into `/api/v1/auth/login` for every
route, including the `@Public()` ones — the prefix/version applies before guards run. The
manually-mounted `apiReference` middleware at `/api/docs` is plain Express `app.use`, outside Nest's
routing layer, so it is unaffected either way.

**This breaks `mobile`'s already-shipped auth client** — it currently calls unprefixed paths per
`docs/AUTH_INTEGRATION.md`. Phase 0 is not done until both sides move together:

- Update `docs/AUTH_INTEGRATION.md` (the cross-app contract, root `AGENTS.md` §6) — base URL table
  and every example path get the `/api/v1` prefix.
- Coordinate with the `mobile` lead to bump `apps/mobile/src/config/env.ts` /
  `apps/mobile/src/services/api/auth-client.ts` (wherever the base path is joined to `/auth/...`,
  `/users`) in the same window Phase 0 ships — not before (nothing to point at yet) and not long
  after (mobile's login breaks silently against a moved server otherwise).
- Same applies the moment `therapist-web`/`admin-web` start consuming the API — they should never
  see an unprefixed path to begin with.

## 7. Process — how a phase goes from here to merged

1. Before starting a phase, write `docs/clinical-panel/phase-N-<slug>.md` — the concrete
   implementation plan (schema diff, services, endpoints, RLS policies, tests) for **that phase
   only**, grounded in whatever the schema/codebase actually looks like at that point (not
   re-derived from this document blindly — check `schema.prisma` and `apps/server/AGENTS.md` first,
   since earlier phases will have changed both).
2. Implement against that plan, following `apps/server/AGENTS.md` §12's definition of done
   (RLS policies, tests, Scalar docs, lint) for every endpoint the phase adds.
3. Update the phase's row in the table in §6 to `Done` once merged, and note anything the plan
   didn't anticipate (a schema correction, a policy that needed a helper function, etc.) back into
   this file if it changes a principle in §3–5 for later phases.

## 8. Success criteria for the initiative as a whole

Adapted from `technical-guide.md` §14 — these are the project-level outcomes, not a single phase's:

- An administrator can create therapists and patients only within their own institution.
- Reassigning a therapist preserves history and updates `assignedDoctorId` without ever leaving two
  active primary assignments.
- The frontend gets available slots from the API — it never computes schedules itself.
- The server rejects an appointment outside configured hours or overlapping another.
- A therapist cannot query patients from another institution, or unassigned patients, without
  explicit authorization.
- Clinical records and notes are never physically deleted; they keep a trace of corrections.
- Alerts carry a priority, a lifecycle status, and an action history.
- The panel reads biometrics as processed summaries — never raw high-frequency data.
- The panel has no access path to the private emotional journal.
- Patient-shared content is queryable, differentiated from private content, and audited.
- Dashboards/overview use aggregated queries, not dozens of sequential frontend requests.
- Scalar/OpenAPI reflects real DTOs, response shapes, roles, and error cases for every route added.
