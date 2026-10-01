# Activity Assignments

## Purpose

`StudentActivity` is the persisted assignment instance of a catalog `Activity`.
The psychologist-only route `/patients/[id]/activities` presents its history
within Patient Workspace and permits the current therapist to assign an active
catalog activity. It does not modify, complete, or respond to assignments.

## Model and API

The real assignment fields are `id`, `studentId`, `activityId`, nullable
`therapistId`, `origin`, `assignedAt`, nullable `dueAt`, `status`, nullable
`response`, nullable `completedAt`, `createdAt`, and `updatedAt`.

`GET /api/v1/students/:studentId/activities` accepts `skip`, `take`, and an
optional `status` of `pending`, `in_progress`, or `completed`. It returns
newest assignments first as `{ data, meta }`, where `meta` contains pagination
and `institutionTimezone`.

Each list item contains a compact `activity: { id, title }`, nullable
`therapist: { id, fullName }`, origin, status, assigned/due/completion dates,
and `hasResponse`. It intentionally excludes response text, instructions,
catalog descriptions, and repeated patient data.

## Access and history

The endpoint is psychologist-only. RLS enforces the current
therapist-to-patient and institution scope. Administrators have catalog access
but cannot read patient activity history. A missing or RLS-hidden patient
returns `404`.

`psychologist` is the only active assignment origin. Historical `ecos` values
can be displayed as neutral metadata but do not imply AI, automated assignment,
biometric triggers, or alert triggers.

Catalog activities remain live references, not snapshots. A deactivated
catalog activity remains visible through its historical assignment, and a later
catalog edit can change the content reached through that reference.

## Frontend behavior

The URL owns `page`, `take`, and `status`; status changes reset to page one.
The feature uses `activityAssignmentKeys` and
`usePatientActivityAssignments(patientId, params)` with cancellation support
and previous-data retention. It renders status and origin labels as text in
addition to badge color, shows due dates only when present, and never renders
the response body.

## Assign activity

Users with `patient-activities.manage` receive an **Asignar actividad** action
in the page header and an **Asignar primera actividad** action in the
unfiltered empty state. The action opens an accessible dialog; it does not add
a separate route or patient selector.

The dialog searches `GET /api/v1/activities` with `active=true`, a debounced
title search, and bounded pagination. The server forces active catalog entries
for psychologists, and RLS restricts the result to the institution plus global
entries. The selected entry displays its title, description, and instructions
as read-only content. A therapist cannot create or edit a catalog entry from
this flow.

The editable request DTO is only `{ activityId: number; dueAt?: string }`.
`dueAt` is an optional institution-local date and time from a native
`datetime-local` control. The client maps it to an ISO instant using the
institution timezone before sending it. The current API has no past-deadline
rule, so the form does not invent one.

The server derives `therapistId`, `origin: "psychologist"`, initial
`status: "pending"`, `assignedAt`, and `createdAt`. It validates role, RLS
patient access, activity visibility, and current activity activation. The
global validation whitelist rejects attempted `origin`, `therapistId`,
`status`, `response`, or `completedAt` fields.

Successful assignment invalidates only the patient's activity-history family
and patient overview, then closes and resets the dialog with formal feedback.
It does not invalidate the catalog. A `409` keeps the deadline input, clears
an activity that is no longer available, and refetches the active catalog.
Other errors preserve form values for correction or retry.

Every successful manual assignment writes an append-only `ACTIVITY_ASSIGNED`
audit event with actor/institution columns and only patient/activity identifiers
in metadata. Therapeutic content and response text are never audited.

## Assignment detail

`/patients/[id]/activities/[assignmentId]` is a psychologist-only, read-only
detail route. It uses `GET /api/v1/students/:studentId/activities/:assignmentId`,
which qualifies the assignment by its patient identifier inside the existing
RLS transaction. Missing, unrelated, cross-institution, and RLS-hidden
resources all resolve as `404`; administrators are denied by the role guard.

The detail response supplies minimal Patient Workspace context and institution
timezone, the assigning therapist, origin, status, all relevant assignment
dates, and response text only when it exists. It also returns the current
`Activity` title, description, and instructions. It intentionally does not
filter the nested activity by `active`: retired catalog activities remain
available through historical assignments.

This is a live catalog reference, not a content snapshot. Subsequent catalog
edits can therefore change activity content shown for a historical assignment.
The detail page has no response, completion, status, cancellation, reassignment,
or catalog-management action. It produces no audit event on read.

## Patient Overview integration

Patient Overview consumes its single overview query's `activitiesSummary`:
backend-computed total and incomplete counts plus at most three recent
incomplete assignments. It exposes only assignment title, status, origin,
assigned date, and optional deadline; response text and instructions are not
part of this summary. It offers navigation to history and assignment detail,
not assignment mutations.

## Session Detail integration

An authorized current therapist can open the same `AssignActivityDialog` from
Session Detail while it is in read mode. The dialog reuses the Phase 7.3 active
catalog search, optional institution-timezone deadline mapping, validation,
availability handling, and `ACTIVITY_ASSIGNED` audit behavior. On success it
closes with feedback and remains on Session Detail.

Opening this dialog from a session is only a contextual entry point. It does
not create an `ActivityAssignment` to `ClinicalNote` relationship, add a
`clinicalNoteId`, alter session DTOs, or couple either write in a transaction.
The existing mutation invalidates only the patient's assignment-history family
and overview key; it does not invalidate the session detail.

## Explicit limitations

Mobile currently cannot list, respond to, or complete activities. A manual
assignment does not notify the patient. There are no automatic patient
notifications, activity-specific mobile completion actions, AI recommendations,
automated ECOS assignments, or an active `ecos` assignment flow.
