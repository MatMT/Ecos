# Backend debt for frontend

## Current authenticated user

Status: Resolved by an existing backend contract

`GET /api/v1/auth/me` does not exist, but it is not required for `admin-web`. `POST /api/v1/auth/refresh` returns the authoritative GoTrue `user.id` while rotating tokens, and authenticated `GET /api/v1/users/:id` returns that user's `fullName`, `email`, `role` and `institutionId`.

The RLS policy for `remote_users` explicitly allows `id = auth.uid()`, so this sequence reconstructs the caller's identity without JWT decoding, client-side role inference or unrelated resource queries.

A dedicated `auth/me` endpoint could reduce the round trips in the future, but no backend change blocks the current portal authentication flow.

## Clinical read separation

Status: Requires backend confirmation

The local portal matrix intentionally denies `alerts.view` and `biometrics.view` to `administrator`. However, the current alerts and biometrics read paths rely on RLS using `can_access_student_profile`, which includes an administrator from the same institution. Nest should confirm whether those clinical reads are intentionally administrative or narrow the backend policy if the clinical separation is mandatory. The frontend does not attempt to compensate for this with institution or patient-ID checks.

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
