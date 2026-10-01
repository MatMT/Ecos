# ECOS — Phase 5 Clinical Record & Sessions Plan

## 1. Scope

Phase 5 builds the clinical workspace in `admin-web` in subsequent subphases. Phases 5.0–5.5 are implemented: audited API foundations, longitudinal clinical-record route, paginated session history, manual session registration, appointment handoff, and session detail/edit. Phase 5.6 remains integration verification only.

The visual reference is the untouched prototype at `apps/therapist-web/src/views/ClinicalNotes.tsx`. It is mock-data-only and is not an API contract or a component to import into `admin-web`.

## 2. Clinical Record vs Clinical Note

`ClinicalRecord` is the longitudinal document for one patient. It contains the opening reason, psychological and psychiatric history, relevant family history, prior treatments, current medication, and general observations.

`ClinicalNote` documents one discrete therapeutic session. It contains session snapshots (date, type, duration and modality), the session diagnosis, observed emotional state, session summary, observations, clinical impression, interventions, agreements and follow-up plan. AI analysis remains a separate `aiAssistantAnalysis` field and must never be merged into professional note fields.

## 3. Existing session mockup

The reference is `apps/therapist-web/src/views/ClinicalNotes.tsx`, mounted by `apps/therapist-web/src/app/(dashboard)/clinical-notes/page.tsx`. It uses local React state and `src/data/mockData.ts` for patient selection, recent records, monthly statistics, and AI interpretation.

Its visual sections are patient selection, session metadata, observed emotional state, notes and observations, an AI information block, save actions, and a recent-records sidebar. The functional form fields are patient, session type, duration, session date, diagnosis, emotional state, session notes, and clinical observations. Its "Guardar borrador" action and success state are visual-only; Phase 5 does not implement drafts or autosave. The AI block is contextual-only and is not submitted as clinical content.

## 4. Current backend models

`ClinicalRecord` has a unique `studentId`, so there is at most one record per patient. It has `openedAt`, `createdAt`, and `updatedAt`; it relates to `StudentProfile` through `studentId`.

`ClinicalNote.appointmentId` is optional and unique when present, preserving `Appointment 1 → 0..1 ClinicalNote`. Every note stores a clinical session snapshot: `sessionDate`, `sessionType`, `durationMinutes` and `modality`. Appointment-backed notes derive these snapshots, patient and author from the verified appointment; manual notes derive patient and author from the RLS-visible route and authenticated user. `createdAt` is never substituted as a clinical date.

No Prisma schema or migration is required for the Phase 5.0 relationship work.

## 5. Clinical Record API

| Method | Path | Request | Result and access |
| --- | --- | --- | --- |
| `POST` | `/students/:studentId/clinical-record` | `CreateClinicalRecordDto` | Creates the first record; returns `409` when one already exists. Blank client fields are omitted. Psychologist-only and RLS-limited to the assigned patient. |
| `GET` | `/students/:studentId/clinical-record` | None | Returns the record or `404` when absent or inaccessible. Viewing is audited. |
| `PATCH` | `/students/:studentId/clinical-record` | `UpdateClinicalRecordDto` | Updates the existing record or returns `404`. Optional fields accept `null` to explicitly clear content. |

The contract remains explicit create followed by patch. Create and update are audited as `CLINICAL_RECORD_CREATED` and `CLINICAL_RECORD_UPDATED` without recording clinical text. No upsert is planned.

## 6. Clinical Notes API

| Method | Path | Request | Result and access |
| --- | --- | --- | --- |
| `POST` | `/clinical-notes` | `CreateClinicalNoteDto` with `appointmentId` and clinical content | Psychologist-only. The server derives patient and therapist, rejects unauthorized or terminal appointments, and creates the note atomically with completion. |
| `POST` | `/students/:studentId/clinical-notes` | `CreateManualClinicalNoteDto` with manual session metadata and clinical content | Psychologist-only and RLS-limited to the currently assigned patient. Rejects future dates, derives author, and never changes appointments. |
| `GET` | `/students/:studentId/clinical-notes?skip=0&take=20` | Validated offset pagination, `take` 1–100 | Psychologist-only, currently assigned therapist only. Returns `{ data, meta }`, newest clinical session first, without clinical-note bodies. |
| `GET` | `/clinical-notes/:id` | None | Returns full detail only to a psychologist allowed by RLS. |
| `GET` | `/students/:studentId/clinical-notes/:id` | None | Patient-qualified detail for the portal. It verifies the note/patient relation and returns the authorized workspace projection, author, appointment snapshot, clinical fields and timestamps. |
| `PATCH` | `/clinical-notes/:id` | Explicit nullable professional-content DTO | Original author only; voided notes cannot be edited. Identity, appointment, session snapshots and AI analysis are immutable. |
| `PATCH` | `/clinical-notes/:id/void` | Optional void reason | Soft void only; no ordinary physical delete exists. |

The list item includes identity, canonical clinical session date, optional appointment metadata, session snapshots, therapist summary, observed emotional state, void state, and timestamps. The response metadata includes exact pagination and the patient institution timezone. It intentionally excludes observations, summaries, diagnosis, AI analysis, impressions, interventions, agreements, follow-up text, and void reason.

## 7. Appointment integration

Appointments use `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`, and `no_show`. A note is unique per appointment through `ClinicalNote.appointmentId`.

Phase 5.0 retires `PATCH /appointments/:id/complete`. The normal completion path is now `POST /clinical-notes`: an authorized psychologist records the note for a confirmed appointment and the server changes that appointment to `completed` in the same RLS transaction. Existing completed appointments without a note remain compatible with one authorized legacy-note creation, without an additional transition.

## 8. Appointment → Session handoff

```text
Confirmed appointment
  → psychologist opens the session form with appointment context
  → POST /clinical-notes
  → create ClinicalNote + set Appointment.status = completed atomically
  → invalidate session, overview, and appointment queries
```

Phase 5.4 is implemented. Agenda carries only `appointmentId` as navigation
context; the form reloads the appointment through its existing detail query,
verifies the patient route, current therapist, compatible status and absence
of a note before enabling submission. Appointment responses expose the
non-clinical `hasClinicalNote` flag so the list and calendar can show the
action or “Sesión registrada” without fetching note bodies.

## 9. Session form field mapping

| Reference UI field | Future frontend field | API/model source |
| --- | --- | --- |
| Patient | Read-only workspace context | Verified route/RLS scope |
| Session type | Editable for manual sessions; snapshot for appointment sessions | `ClinicalNote.sessionType` |
| Duration | Editable for manual sessions; snapshot for appointment sessions | `ClinicalNote.durationMinutes` |
| Session date | Editable past/present for manual sessions; snapshot for appointment sessions | `ClinicalNote.sessionDate` |
| Registered diagnosis | `sessionDiagnosis` | `ClinicalNote.sessionDiagnosis` |
| Emotional state | `observedEmotionalState` | `ClinicalNote.observedEmotionalState` (`calm`, `anxious`, `sad`, `euphoric`, `other`) |
| Session notes | `sessionSummary` | `ClinicalNote.sessionSummary` |
| Clinical observations | `observations` | `ClinicalNote.observations` |
| Clinical impression | `clinicalImpression` | `ClinicalNote.clinicalImpression` |
| Interventions | `interventions` | `ClinicalNote.interventions` |
| Agreements | `agreements` | `ClinicalNote.agreements` |
| Follow-up plan | `followUpPlan` | `ClinicalNote.followUpPlan` |

## 10. Permissions

The client exposes `clinical-record.view`, `clinical-record.manage`, `clinical-notes.view`, and `clinical-notes.manage`; only the psychologist role receives them.

Server guards require `Role.psychologist` for clinical-record endpoints and all clinical-note endpoints. RLS independently scopes records to the currently assigned psychologist. Clinical-note reads allow the author or the current assigned psychologist; updates and voids are restricted to the author. Administrators can manage appointments but cannot read or mutate clinical records or notes.

## 11. Patient workspace routes

The existing patient navigation reserves these routes. The clinical-record route and session history are enabled for psychologists; the remaining session routes stay unavailable until their corresponding subphase:

- `/patients/[id]/clinical-record`
- `/patients/[id]/sessions`
- `/patients/[id]/sessions/new`
- `/patients/[id]/sessions/[noteId]`

All future pages reuse `PatientWorkspace`, `PatientHeader`, and `PatientSectionNav`; no second patient shell is created.

## 12. Query keys / invalidations

Clinical-record keys now follow existing TanStack Query conventions:

```ts
clinicalRecordKeys.all
clinicalRecordKeys.details()
clinicalRecordKeys.byPatient(studentId)
```

Create and update invalidate only `clinicalRecordKeys.byPatient(studentId)`: the patient overview does not consume clinical-record data.

Session-history keys now follow the same conventions:

```ts
sessionKeys.all
sessionKeys.lists()
sessionKeys.byPatient(patientId)
sessionKeys.list(patientId, { skip, take })
sessionKeys.details()
sessionKeys.detail(patientId, noteId)
```

Manual creation invalidates `sessionKeys.byPatient(patientId)` and `patientKeys.overview(patientId)`. It does not invalidate appointments. Appointment-backed creation also invalidates its affected appointment queries. Both creation paths navigate to the new detail route after success. Updates invalidate detail, history and overview only.

## 13. Backend changes required

Phase 5.0 implements the following foundations:

- atomically create a note and complete a confirmed appointment;
- retain compatibility for completed legacy appointments that have no note;
- explicitly reject a duplicate appointment note before the database unique constraint is reached;
- require a psychologist guard for every clinical-note route;
- validate `skip` and `take` and return privacy-minimized session list items;
- enforce original-author ownership in the service as well as RLS;
- remove the standalone appointment-completion endpoint and client helper;
- update Swagger response metadata for the list and create contracts.

## 14. Architecture

Future frontend code belongs in separate `features/clinical-record` and `features/sessions` domains because the longitudinal record and discrete sessions have distinct lifecycles. Both domains consume the existing API client, TanStack Query, React Hook Form, Zod, `FormSection`, `ErrorState`, and `PermissionGate` patterns.

## 15. Phase breakdown

- **5.0:** audit, document contracts, and establish the minimum backend foundations.
- **5.1:** implemented longitudinal clinical-record route and explicit create/edit flow.
- **5.2:** implemented paginated patient session history.
- **5.3:** implemented manual new-session form using the documented prototype mapping.
- **5.4:** implemented appointment handoff to the existing session form and
  atomic appointment-backed endpoint.
- **5.5:** implemented patient-qualified clinical-note detail and author-only editing. The detail page separates ECOS analysis from professional content and preserves former-author read continuity through a narrow RLS context projection, without broadening normal Patient Workspace access.
- **5.6:** end-to-end integration, query invalidations, and validation.

## 16. Risks

- Clinical content is sensitive: do not log form values or note text.
- Do not treat an `appointmentId` query parameter as authorization.
- Do not expose `EmotionalJournal` content in a clinical note.
- Render `sessionDate` using the institution timezone supplied by the patient overview; do not substitute note creation time.
- Keep activities outside the clinical-note DTO; their future integration belongs to Phase 7.

## 17. Implementation order

1. Complete and validate Phase 5.0.
2. Complete and validate the Phase 5.1 clinical-record route, contract updates, and audit events.
3. Complete and validate the Phase 5.3 manual session form and hybrid note model.
4. Complete Phase 5.5 detail/edit.
5. Finish with Phase 5.6 integration validation.
