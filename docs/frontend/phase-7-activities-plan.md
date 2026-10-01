# ECOS — Phase 7 Therapeutic Activities Plan

## 1. Scope

Phase 7 delivers an institutional therapeutic-activity catalog and manual
assignment by the patient's current psychologist. Phases 7.0 and 7.1 are
implemented: the API is hardened and administrators can maintain their own
catalog through Admin Web. Patient assignment UI remains deferred.

The active workflow is:

```text
Administrator -> institutional Activity catalog
Psychologist -> active catalog Activity -> assigned patient -> StudentActivity
```

The server, not a client, derives `StudentActivity.therapistId` from the
authenticated psychologist and sets `origin` to `psychologist`.

## 2. Current Real Architecture

`Activity` is the reusable catalog entry. Its real fields are `id`, nullable
`institutionId`, `title`, nullable `description`, nullable `instructions`,
`active`, `createdAt`, and `updatedAt`. It has no category or duration field.

An activity with `institutionId = null` is a global ECOS catalog entry. A
non-null value identifies an institution-owned entry. The database RLS policy
allows psychologists and administrators to read their institution's entries
and global entries. Only an administrator may create or update an entry, and
RLS requires writes to use the caller's own non-null institution.

`StudentActivity` is the real assignment model, not a separate
`ActivityAssignment` model. Its fields are `id`, `studentId`, `activityId`,
nullable `therapistId`, `origin`, `assignedAt`, nullable `dueAt`, `status`,
nullable `response`, nullable `completedAt`, `createdAt`, and `updatedAt`.
It belongs to one patient and one catalog activity, and optionally references
the assigning therapist. One `Activity` can have many `StudentActivity` rows.

The schema stores strings rather than Prisma enums. The current assignment
creation path stores `origin = "psychologist"`; `ecos` remains a reserved,
deferred value. Known status values are `pending`, `in_progress`, and
`completed`, although Phase 7.0 exposes no client transition endpoint.

Assignments retain only an `activityId` reference. They do not snapshot the
title, description, or instructions, so a later catalog edit affects the
activity content obtained through that reference. This is documented risk,
not a Phase 7.0 schema change.

## 3. Explicitly Deferred

- AI recommendations, automatic assignments, and any active `origin = ecos`
  workflow.
- Biometric or alert-triggered activity assignment.
- Mobile activity list, detail, response, completion, synchronization, and
  notifications.
- Push, WebSocket, SSE, browser, email, or SMS activity notifications.
- Catalog snapshots, assignment deletion/cancellation semantics, and
  assignment-specific audit events.
- Patient activity pages, assignment form/detail UI, Patient Overview changes,
  and Session Detail integration.

## 4. Backend APIs

All paths are prefixed with `/api/v1`.

| Method  | Path                              | Contract                                                                      | Access and behavior                                                                                                                                                                                  |
| ------- | --------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/activities`                     | `CreateActivityDto`: `title`, optional `description`, optional `instructions` | Administrator only. The server assigns the caller's institution.                                                                                                                                     |
| `GET`   | `/activities`                     | `search`, `skip`, `take`, optional `active`; returns `{ data, meta }`         | Administrator or psychologist. Title search is case-insensitive. RLS restricts institution visibility. Psychologists are forced to active entries; administrators may request either activity state. |
| `GET`   | `/activities/:id`                 | `ActivityResponseDto`                                                         | Administrator or psychologist. Psychologists can retrieve active entries only.                                                                                                                       |
| `PATCH` | `/activities/:id`                 | Partial catalog fields plus optional `active`                                 | Administrator only. `active: false` retires an entry without deletion.                                                                                                                               |
| `POST`  | `/students/:studentId/activities` | `CreateStudentActivityDto`: `activityId`, optional ISO `dueAt`                | Psychologist only. RLS requires the current therapist-patient relationship. The server sets therapist and origin, and rejects inactive activities with `409`.                                        |
| `GET`   | `/students/:studentId/activities` | `skip`, `take`; array of `StudentActivityResponseDto`                         | Authenticated callers are constrained by assignment RLS; only the current assigned therapist can access these clinical assignments. Ordered by most recently assigned first.                         |
| `GET`   | `/student-activities/:id`         | `StudentActivityResponseDto`                                                  | Authenticated callers are constrained by assignment RLS; only the current assigned therapist can access the row.                                                                                     |

`skip` defaults to `0`; `take` defaults to `20` and cannot exceed `100`.
`meta` returns `skip`, `take`, `total`, and `totalPages`. Catalog title search
is case-insensitive and limited to 255 characters. Assignment status/date
filters remain deliberately deferred.

`PATCH /student-activities/:id` was removed in Phase 7.0. A psychologist may
not write patient response, completion, or status on the patient's behalf.
This intentional breaking change remains until a patient-owned mobile contract
is designed and implemented.

## 5. Permissions and Scope

The application layer uses role guards for catalog reads and writes. Database
RLS remains the authority for tenancy and clinical relationship scope.

- Administrators curate only their institution's catalog entries; they do not
  receive patient activity-assignment access.
- Psychologists may browse only active visible catalog entries and assign an
  active entry only to a patient currently assigned to them.
- Activity assignments use `app_private.can_access_clinical_data(student_id)`;
  an identifier alone cannot grant a psychologist access to another patient's
  assignments.
- Requests containing `origin` or `therapistId` are rejected by the global
  whitelist validation because neither belongs to `CreateStudentActivityDto`.
- `dueAt` is optional and must be an ISO date-time when supplied. It may be
  null; Phase 7.0 adds no additional due-date policy.

## 6. Status, Response, and Completion

The fields `status`, `response`, and `completedAt` are retained for the future
patient workflow. There is currently no supported API action that changes
them. Admin-web must not show controls that claim a patient responded or
completed an activity. If data exists from another future authorized path, it
is read-only clinical data and belongs in an assignment detail view, not a
general list.

## 7. Proposed Frontend Architecture

The institutional catalog and patient assignments remain separate domains.

- `/activities`: future administrator catalog route; it must not be nested in a
  patient workspace.
- `/patients/[id]/activities`: future psychologist-only assignment history in
  the Patient Workspace.
- `/patients/[id]/activities/[assignmentId]`: future protected assignment
  detail route.

Future React Query keys:

```ts
activityCatalogKeys.all;
activityCatalogKeys.list(filters);
activityCatalogKeys.active();
activityAssignmentKeys.all;
activityAssignmentKeys.byPatient(patientId);
activityAssignmentKeys.list(patientId, filters);
activityAssignmentKeys.detail(patientId, assignmentId);
```

The Patient Overview may later present the server-provided pending-activity
summary. Session Detail may link to an independent assignment action after a
session; it must not embed an activity assignment in a clinical-note payload.
No `clinicalNoteId` or session relationship is currently present on
`StudentActivity`.

## 8. Phase Breakdown

- **7.1 (complete):** Administrator-only catalog list, create, edit, search,
  active/inactive filter, pagination, and reversible retirement UI at
  `/activities`. Global entries are visible as read-only references. The server
  records append-only `ACTIVITY_CREATED`, `ACTIVITY_UPDATED`,
  `ACTIVITY_ACTIVATED`, and `ACTIVITY_DEACTIVATED` audit events with actor,
  institution, entity ID, action, and changed field names only. No delete
  endpoint exists.
- **7.2:** Patient Workspace assignment history using the protected list API.
- **7.3:** Psychologist manual assignment form using active catalog entries and
  optional due date.
- **7.4:** Protected assignment detail, including read-only real response and
  completion data when available.
- **7.5:** Useful Patient Overview and Session Detail links without coupling
  assignments to clinical-note writes.
- **7.6:** End-to-end QA for permissions, RLS, responsiveness, dark mode,
  cache behavior, and API contracts.

## 9. Risks and Open Decisions

- A future mobile contract must define patient authentication, allowed status
  transitions, response ownership, and completion timestamp rules before any
  update endpoint is restored.
- Historical rendering may require an activity-content snapshot if catalog
  edits must not alter the presentation of prior assignments.
- Catalog audit entries intentionally omit title, description, and instruction
  values. Assignment audit actions remain deferred until there is another
  authorized assignment write flow.
- Notifications and any unattended `origin = ecos` write require separate
  authorization architecture and are not implied by this module.
