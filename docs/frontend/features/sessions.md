# Sessions

## Purpose

Phases 5.2 and 5.3 provide a paginated clinical-session history and manual
session registration for a patient. A session is a `ClinicalNote`; it is not a
longitudinal `ClinicalRecord`, an EmotionalJournal entry, an activity, or a
treatment plan.

## Routes and authorization

- `/patients/[id]/sessions` requires `clinical-notes.view`.
- `/patients/[id]/sessions/new` requires `clinical-notes.manage`.

Both routes reuse `PatientWorkspace`. The navigation item remains active for
all session descendants. Administrators are denied by the psychologist-only
server guard; an unassigned psychologist receives `404` through the patient
RLS scope.

## API and privacy boundary

`GET /students/:studentId/clinical-notes?skip=0&take=20` returns a paginated,
privacy-minimized envelope. List items contain IDs, canonical `sessionDate`,
optional appointment metadata, session type/duration/modality snapshots,
therapist summary, observed emotional state, void state and timestamps. They
never include clinical text, diagnosis, AI analysis, void reason,
EmotionalJournal or shared content. Results are ordered by `sessionDate`, then
creation time and ID, all descending, with undated legacy rows last.

`POST /students/:studentId/clinical-notes` creates a manual session. The
request contains only editable session data; the server derives patient and
author, requires the current assignment, records `CLINICAL_NOTE_CREATED`, and
rejects future clinical dates. It does not modify an appointment.

`POST /clinical-notes` remains the appointment-backed path. It verifies the
appointment, snapshots its metadata into the note, and atomically completes a
confirmed appointment. `appointmentId` is optional on the model so manual
sessions can coexist, but stays unique whenever present.

## Create session

The manual form uses React Hook Form, Zod, `FormSection`, the existing API
client, `applyApiFieldErrors` and `FormError`. Its source mockup is
`apps/therapist-web/src/views/ClinicalNotes.tsx`; that application is not a
runtime dependency.

| UI field | DTO/model field |
| --- | --- |
| Fecha y hora clínica | `sessionDate` |
| Tipo, duración y modalidad | `sessionType`, `durationMinutes`, `modality` |
| Diagnóstico | `sessionDiagnosis` |
| Estado emocional | `observedEmotionalState` |
| Notas y observaciones | `sessionSummary`, `observations` |
| Impresión, intervenciones, acuerdos y seguimiento | Corresponding `ClinicalNote` fields |

The form has no patient selector, draft, autosave, AI generation, local
persistence, activity assignment or treatment-plan editing. It preserves the
mockup's clinical sections but removes mock data, statistics and the sidebar.
It warns before cancellation or browser unload when there are unsaved changes.

`useCreateSession` invalidates only `sessionKeys.byPatient(patientId)` and
`patientKeys.overview(patientId)`. Successful creation returns to the session
history. The empty history and page header expose creation only through
`clinical-notes.manage`.

## Current limits and next phases

Phase 5.3 registers manual sessions only from the patient workspace. Phase
5.4 will add the UI handoff from a confirmed appointment to the existing
atomic appointment-backed endpoint. Phase 5.5 will add clinical-note detail
and author-only editing.
