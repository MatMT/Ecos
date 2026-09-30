# Backend debt for frontend

## Current authenticated user

Status: Resolved by an existing backend contract

`GET /api/v1/auth/me` does not exist, but it is not required for `admin-web`. `POST /api/v1/auth/refresh` returns the authoritative GoTrue `user.id` while rotating tokens, and authenticated `GET /api/v1/users/:id` returns that user's `fullName`, `email`, `role` and `institutionId`.

The RLS policy for `remote_users` explicitly allows `id = auth.uid()`, so this sequence reconstructs the caller's identity without JWT decoding, client-side role inference or unrelated resource queries.

A dedicated `auth/me` endpoint could reduce the round trips in the future, but no backend change blocks the current portal authentication flow.

## Clinical read separation

Status: Resolved by RLS migration `20260930120000_restrict_administrative_clinical_reads`

The local portal matrix denies `alerts.view` and `biometrics.view` to
`administrator`. RLS now matches that policy: `remote_alerts`,
`remote_band_devices` and `remote_biometric_records` are visible only to the
student owner or currently assigned psychologist through
`can_access_clinical_data`. Administrators retain institution-scoped patient
management and operational appointments, but cannot obtain those clinical
resources directly. The frontend does not perform institution or patient-ID
checks as a substitute for this enforcement.

## Institution display name

Status: Requires backend contract extension

The current authenticated profile contract exposes `institutionId`, but no
displayable institution name or summary. The dashboard shell therefore omits
institution text instead of exposing an internal identifier. A future profile
contract may return an authorized institution display name for presentation.

## Patient list pagination and filters

Status: Blocks complete server-side pagination and filter UX in Phase 2

`GET /api/v1/students` accepts only `skip` and `take` (maximum 100) and returns
an array of `StudentResponseDto` without `total`, page metadata or a cursor.
It does not accept `search`, patient status, therapist or institution filters.
The frontend can request a bounded offset slice, but cannot render trustworthy
page totals, last-page controls or global search with `DataTable`.

Expected contract: a list response with stable metadata (`total` plus the
effective pagination values) and only the server-side filters that product
approves. This is a backend contract change; the frontend must not infer totals
or filter only its currently loaded slice.

Phase 2.2 presents the bounded slice as patient cards but deliberately does not
add `searchParams`, a client-side filter, a page-size selector or pagination
controls. Those capabilities remain dependent on this contract extension.

## Patient list display summary

Status: Non-blocking for a basic list; blocks fidelity to the current mockup

`StudentResponseDto` provides the student identifier/code, primary diagnosis,
assigned therapist identifier and basic user identity. It does not include a
therapist display name, next appointment, patient status, device state, recent
biometrics, image or AI summary. The frontend will not issue one appointment,
therapist or biometric request per row.

Expected contract: a dedicated list projection if these summaries are required
in the list, with all data scoped by the server in one request.

## Patient administrative form contract

Status: Non-blocking limitations in Phase 2.3

`PATCH /api/v1/students/:id` accepts optional `studentCode` and
`primaryDiagnosis`, but does not define `null` as a way to clear an existing
code. The administrative form omits an empty code instead of sending an
ambiguous empty string, so code removal remains unavailable.

The Nest error shape contains only general messages and validation strings, not
typed field identifiers. The frontend therefore presents 400, 409 and 422
errors as a general form error unless a future endpoint documents stable,
field-level error codes. Identity, email and password are not updated through
the student endpoint; diagnosis and therapist reassignment are deliberately
excluded from the administrative form.

## Patient overview for administrators

Status: Blocks the clinical overview for administrators in Phase 2.4

`GET /api/v1/students/:studentId/overview` is guarded for `psychologist` only.
Administrators can use `GET /api/v1/students/:id` for a non-clinical patient
header, but cannot receive the aggregate clinical overview. The agreed frontend
behavior is an administrative detail view without clinical summary until backend
defines an authorized administrator overview contract.

## Patient overview presentation gaps

Status: Resolved by the secure overview contract

`GET /api/v1/students/:studentId/overview` now projects the activity title,
origin, status, assignment and due-date metadata explicitly. It returns a
purpose-specific summary instead of full clinical-note, activity or
shared-content DTOs. Clinical bodies, including observations, AI analysis,
plan notes, activity responses and shared-content bodies, are not selected or
returned.

## Overview timezone and follow-up metadata

Status: Resolved by the secure overview contract

The overview provides `institutionTimezone`, resolved from the patient's
institution with an `America/El_Salvador` fallback. `admin-web` formats the
appointment and overview dates in that authorized institutional timezone.

`recentFollowUps` replaces `recentClinicalNotes` and returns the metadata
needed by the summary: date, linked appointment, appointment type and status,
and therapist identity. It intentionally remains a follow-up summary rather
than a session record or a clinical-note body.
