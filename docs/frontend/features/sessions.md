# Sessions

## Purpose

Phases 5.2–5.5 provide a paginated clinical-session history, registration,
detail and controlled editing for a patient. A session is a `ClinicalNote`; it is not a
longitudinal `ClinicalRecord`, an EmotionalJournal entry, an activity, or a
treatment plan.

## Routes and authorization

- `/patients/[id]/sessions` requires `clinical-notes.view`.
- `/patients/[id]/sessions/new` requires `clinical-notes.manage`.
- `/patients/[id]/sessions/[noteId]` requires `clinical-notes.view`.

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

`GET /students/:studentId/clinical-notes/:noteId` is the detail contract used
by the portal. It verifies the URL patient against the note and returns only
the minimum workspace context, note author, immutable appointment snapshot,
authorized clinical content, void state and timestamps. The existing
unqualified detail endpoint remains available for compatibility.

Detail reads preserve continuity of care: the original author and the current
assigned psychologist can read an authorized note; only its original author
can update it. A narrowly scoped RLS context helper supplies the workspace
projection for a former author without granting that user general access to the
patient profile or workspace endpoints. Administrators are denied.

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

`useCreateSession` invalidates `sessionKeys.byPatient(patientId)` and
`patientKeys.overview(patientId)`. Appointment-backed creation additionally
invalidates the affected appointment detail and appointment lists. Successful
creation navigates to the newly created session detail. The empty history and page header
expose manual creation only through `clinical-notes.manage`.

## Appointment handoff

Agenda exposes **Registrar sesión** from the list and calendar detail only to
the appointment's assigned psychologist with `clinical-notes.manage`. The
action carries only `appointmentId` to `/patients/[id]/sessions/new`; the form
reloads and validates the appointment before it is editable.

Appointment-backed forms display a compact appointment context and keep date,
type, duration and modality read-only. They submit only clinical content and
`appointmentId` to `POST /clinical-notes`. A confirmed appointment becomes
`completed` atomically with note creation. A legacy completed appointment with
no note may be documented once; a duplicate is rejected and shown as a safe
conflict without clearing form values.

Appointment list/detail responses include only `hasClinicalNote`, a boolean
used to present “Sesión registrada”; they never include clinical-note content.
Administrators can still manage appointments but cannot initiate or submit
clinical sessions.

## Session detail and controlled editing

The history exposes **Ver sesión** for every visible list item. Detail is read
first and semantic: session metadata, author, appointment context when
present, professional fields, and timestamps are displayed without disabled
inputs. Missing optional content reads “Sin información registrada.” Long
clinical text preserves line breaks and is never truncated.

`aiAssistantAnalysis`, when present, appears only in a separate **Análisis
complementario de ECOS** section. It is never merged into professional content,
sent by the form, generated by this feature, or persisted outside TanStack
Query's in-memory cache.

**Editar sesión** is visible only to an author with `clinical-notes.manage` and
only while the note is not voided. `SessionForm` has explicit `create` and
`edit` modes. Edit keeps date, type, duration, modality, appointment and all
identity fields immutable; it permits nullable clearing only for diagnosis,
emotional state, summary, observations, impression, interventions, agreements
and follow-up plan. PATCH performs the same author and void checks server-side,
records `CLINICAL_NOTE_UPDATED` metadata, and returns `409` for a voided note.

`useUpdateSession` invalidates the session detail, patient history and patient
overview. It never invalidates appointments because editing a note does not
alter appointment state. Failed writes retain form values; there is no autosave,
ordinary delete, void UI, version history, activity assignment, treatment-plan
editing, EmotionalJournal query, or AI generation.
