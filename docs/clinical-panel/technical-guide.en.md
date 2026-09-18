# ECOS — Technical guide for the clinical panel backend

_Therapists and administrators · NestJS · Prisma ORM · PostgreSQL_

Technical specification document · Initial version · September 2026

> **Origin.** English translation of [`technical-guide.md`](./technical-guide.md) (the Spanish
> original received from the `mobile` app's lead on 2026-09-16), adapted for day-to-day reference so
> nobody has to mentally translate while reading it. The **only** substantive change from the
> original is that every `User`/therapist-referencing foreign key below already uses
> `String @db.Uuid` instead of `Int` — see [`GOALS.md`](./GOALS.md) §4 for why. Everything else is a
> faithful translation. If this file and the Spanish original ever disagree on anything other than
> those ID types, the Spanish original is the source of truth — file a note in `GOALS.md` and fix
> this copy.

**Purpose.** Define how the existing backend evolves to support the operation of a psychology
clinic, preserving the `StudentProfile` model and its current relations wherever viable, and adding
clinical, operational, and audit capabilities without introducing unnecessary refactors.

---

## 1. Objective, scope, and design decisions

This guide sets out the technical requirements for extending the ECOS server and preparing an API
consumable by the therapist/administrator web panel. The document starts from the Prisma schema
currently implemented and proposes additive changes, business rules, services, controllers, DTOs,
endpoints, and authorization mechanisms needed to operate a psychology clinical workflow with
continuity of care.

The intent is not to replace the existing architecture or mass-rename models already used by the
server. New capabilities must integrate around the current domain, preserving compatibility with
the mobile app and with logic already built.

### 1.1 Decisions confirmed for this stage

| Decision | Technical criterion |
|---|---|
| Patient | Stays technically as `StudentProfile`. The frontend and functional documentation may call it "patient." |
| Therapist-patient assignment | A historical assignment table is added. `StudentProfile.assignedDoctorId` is kept as a pointer to the current primary therapist. |
| Schedule | Every therapist needs configurable availability, session duration, and exceptions. Appointments are only created on valid slots. |
| Clinical session | `Appointment` + `ClinicalNote` remain the base. A separate `Session` model is not required at this stage. |
| Emotional journal | Not part of the clinical panel. Private content stays in the mobile app. |
| Shared content | The server stores only content the patient has explicitly shared with the therapist. |
| Biometrics | The panel reads processed/consolidated information; PostgreSQL is not recommended as a store for raw, high-frequency signals. |
| Administrators | Manage operations, users, assignments, and scheduling; they don't get unrestricted access to clinical notes just by being administrators. |

**Implementation criterion.** Whenever a capability can be solved by extending an existing model,
that option is prioritized. New models are created only when they represent a concept with its own
lifecycle, history, or rules that shouldn't be mixed into current tables.

### 1.2 Functional scope of the panel

- Institutional administration of users, therapists, and patients.
- Assigning and reassigning therapists while keeping history.
- Defining office hours, session duration, and availability exceptions.
- Agenda: appointment requests, confirmation, rescheduling, cancellation, attendance tracking.
- Psychological record, session notes, and therapeutic continuity.
- Treatment plans, goals, and assigned activities.
- Viewing summarized biometric information and ECOS-generated alerts.
- Professional management of alerts and a log of follow-up actions.
- Viewing content the patient has decided to share.
- Dashboards, clinical timeline, role- and relationship-based authorization, and auditing.

---

## 2. Current schema and compatibility criteria

The current Prisma schema already defines the main structure of the remote ecosystem. The proposed
evolution must respect these models and their names to avoid needlessly changing services, queries,
and relations already in use.

| Prisma model | Table | Current use / criterion |
|---|---|---|
| `Institution` | `remote_institutions` | Institution users belong to. |
| `User` | `remote_users` | Account, role, and institution. Therapists continue to be represented as `User` with `role=psychologist`. |
| `StudentProfile` | `remote_student_profiles` | Profile of the user being followed up. For the panel, read functionally as "patient." |
| `BandDevice` | `remote_band_devices` | Ecos Band linked to the patient. |
| `BiometricRecord` | `remote_biometric_records` | Remote biometric record; recommended to treat as consolidated/processed data. |
| `Alert` | `remote_alerts` | Alerts derived from anomalies, AI, or the panic button. |
| `EmotionalJournal` | `remote_emotional_journal` | Exists in the schema, but must not be exposed to the clinical panel. |
| `Appointment` | `remote_appointments` | Agenda between patient and therapist. |
| `ClinicalNote` | `remote_clinical_notes` | Professional record tied to an appointment. |

_Figure 1. Shared relational reference schema for the ECOS project._

### 2.1 StudentProfile stays "patient"

Renaming `StudentProfile` or its foreign keys is not recommended at this stage. The backend already
uses `studentId`, `assignedDoctorId`, and their associated relations. Changing the whole domain to
`PatientProfile` would force updates to models, migrations, DTOs, queries, tests, and possibly
contracts already consumed by the mobile app.

> **Functional convention.** The backend keeps `StudentProfile` and `studentId`. In the panel, the
> visible copy may say "Paciente" (Patient). The difference is deliberate and avoids a name
> migration with no immediate functional benefit.

### 2.2 Relations that must be preserved

- `Institution` 1 ─── N `User`
- `User` 1 ─── 0..1 `StudentProfile`
- `User(psychologist)` 1 ─── N `StudentProfile` `[assignedDoctorId, compatibility]`
- `StudentProfile` 1 ─── N `Appointment`
- `User(psychologist)` 1 ─── N `Appointment`
- `Appointment` 1 ─── 0..1 `ClinicalNote`
- `StudentProfile` 1 ─── N `BandDevice`
- `BandDevice` 1 ─── N `BiometricRecord`
- `StudentProfile` 1 ─── N `Alert`

---

## 3. Recommended evolution of the data model

The following extensions cover the panel's use cases without breaking the existing schema. Each one
states what problem it solves and how it must coexist with current models.

### 3.1 Therapist-patient assignment history

`StudentProfile.assignedDoctorId` is useful for quickly resolving who the current primary therapist
is, but it keeps no change history. `TherapistAssignment` is recommended as a historical relation
table, keeping `assignedDoctorId` in sync with the active primary assignment.

```prisma
model TherapistAssignment {
  id           Int       @id @default(autoincrement())
  studentId    Int       @map("student_id")
  therapistId  String    @map("therapist_id") @db.Uuid
  assignedById String?   @map("assigned_by_id") @db.Uuid
  startsAt     DateTime  @default(now()) @map("starts_at")
  endsAt       DateTime? @map("ends_at")
  isPrimary    Boolean   @default(true) @map("is_primary")
  reason       String?   @db.VarChar(500)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  student      StudentProfile @relation(fields: [studentId], references: [id])
  therapist    User           @relation("TherapistAssignments", fields: [therapistId], references: [id])
}
```

Creating a new assignment must run inside a transaction: end the previous primary assignment,
insert the new history row, and update `StudentProfile.assignedDoctorId`. The service must prevent
two active primary assignments for the same patient.

### 3.2 Therapist professional profile

`User` can remain the therapist's authentication entity. A complementary profile is recommended
solely for professional data that doesn't belong on the account.

```prisma
model PsychologistProfile {
  id                    Int      @id @default(autoincrement())
  userId                String   @unique @map("user_id") @db.Uuid
  professionalLicense   String?  @map("professional_license") @db.VarChar(100)
  specialty             String?  @db.VarChar(255)
  phone                 String?  @db.VarChar(50)
  defaultSessionMinutes Int      @default(60) @map("default_session_minutes")
  active                Boolean  @default(true)
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
}
```

### 3.3 Therapist availability and schedule

The agenda shouldn't be based solely on existing appointments. Before allowing a booking, the server
needs to know when each therapist sees patients, how long a session lasts, and what exceptions
exist. This layer prevents appointments outside office hours and lets the frontend query available
slots.

```prisma
model TherapistSchedule {
  id                     Int       @id @default(autoincrement())
  therapistId            String    @map("therapist_id") @db.Uuid
  dayOfWeek              Int       @map("day_of_week") // 1=Monday ... 7=Sunday
  startTime              DateTime  @db.Time(0) @map("start_time")
  endTime                DateTime  @db.Time(0) @map("end_time")
  sessionDurationMinutes Int       @default(60) @map("session_duration_minutes")
  breakMinutes           Int       @default(0) @map("break_minutes")
  validFrom              DateTime? @db.Date @map("valid_from")
  validTo                DateTime? @db.Date @map("valid_to")
  active                 Boolean   @default(true)
}

model TherapistScheduleException {
  id          Int       @id @default(autoincrement())
  therapistId String    @map("therapist_id") @db.Uuid
  date        DateTime  @db.Date
  startTime   DateTime? @db.Time(0) @map("start_time")
  endTime     DateTime? @db.Time(0) @map("end_time")
  available   Boolean   @default(false)
  reason      String?   @db.VarChar(255)
}
```

**Expected use.** `TherapistSchedule` defines recurring weekly availability.
`TherapistScheduleException` blocks vacations, meetings, and absences, or enables extraordinary
hours. The default duration can be 60 minutes, but it's configurable per therapist or per time
block.

### 3.4 Appointment extensions

`Appointment` must remain the main agenda entity. Extending its fields is recommended to allow
control over duration, modality, cancellations, rescheduling, and traceability of who created the
appointment.

| Suggested field | Type | Purpose |
|---|---|---|
| `durationMinutes` | `Int` | Effective session duration. Defaults to the therapist's configuration. |
| `endAt` | `DateTime?` | Computed end time. Makes overlap detection easier. |
| `modality` | `enum/string` | In-person, virtual, or other modalities defined by the institution. |
| `reason` | `String?` | Short reason for the appointment. |
| `cancelReason` | `String?` | Cancellation reason. |
| `createdById` | `String? @db.Uuid` | User who created the appointment. |
| `rescheduledFromId` | `Int?` | Reference to the previous appointment, if history is kept via a new row. |

Extending `AppointmentStatus` with `rescheduled` and `no_show` is recommended. Existing states must
be kept so as not to affect logic already implemented.

### 3.5 Clinical record

`ClinicalNote` represents a single session. For longitudinal information, `ClinicalRecord` is
recommended — one per `StudentProfile` within the current institution.

```prisma
model ClinicalRecord {
  id                    Int      @id @default(autoincrement())
  studentId             Int      @unique @map("student_id")
  openedAt              DateTime @default(now()) @map("opened_at")
  initialReason         String?  @map("initial_reason") @db.Text
  psychologicalHistory  String?  @map("psychological_history") @db.Text
  psychiatricHistory    String?  @map("psychiatric_history") @db.Text
  relevantFamilyHistory String?  @map("relevant_family_history") @db.Text
  previousTreatments    String?  @map("previous_treatments") @db.Text
  currentMedication     String?  @map("current_medication") @db.Text
  generalObservations   String?  @map("general_observations") @db.Text
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
}
```

The record must not replace session notes. Its purpose is to keep history and data that spans
several visits.

### 3.6 ClinicalNote as the session record

The one-to-one relation between `Appointment` and `ClinicalNote` can be kept as the practical
representation of a session held. `sessionDiagnosis` must remain optional — a psychological
consultation doesn't necessarily mean issuing or updating a diagnosis.

| Field / concept | Criterion |
|---|---|
| `sessionSummary` | Professional summary of the session. |
| `clinicalImpression` | The professional's clinical impression, distinct from a formal diagnosis. |
| `interventions` | Interventions or techniques applied. |
| `agreements` | Agreements reached with the patient. |
| `followUpPlan` | Plan for the next session or follow-up. |
| `aiAssistantAnalysis` | Auxiliary analysis. Must never automatically overwrite professional content. |

### 3.7 Treatment plan and goals

To give treatment continuity, clinical goals should be kept separate from session notes. A plan can
stay active across several appointments and hold one or more goals.

```prisma
model TreatmentPlan {
  id          Int       @id @default(autoincrement())
  studentId   Int       @map("student_id")
  therapistId String    @map("therapist_id") @db.Uuid
  title       String?   @db.VarChar(255)
  generalGoal String?   @map("general_goal") @db.Text
  startsAt    DateTime  @default(now()) @map("starts_at")
  endsAt      DateTime? @map("ends_at")
  status      String    @default("active")
  notes       String?   @db.Text
}

model TreatmentGoal {
  id          Int       @id @default(autoincrement())
  planId      Int       @map("plan_id")
  description String    @db.Text
  status      String    @default("pending")
  targetDate  DateTime? @db.Date @map("target_date")
}
```

### 3.8 Activities and recommendations

ECOS must let the therapist assign activities, and let the system generate differentiated
recommendations. The origin must be kept so the frontend never confuses an ECOS suggestion with a
professional instruction.

```prisma
model Activity {
  id            Int     @id @default(autoincrement())
  institutionId Int?    @map("institution_id")
  title         String  @db.VarChar(255)
  description   String? @db.Text
  instructions  String? @db.Text
  active        Boolean @default(true)
}

model StudentActivity {
  id          Int       @id @default(autoincrement())
  studentId   Int       @map("student_id")
  activityId  Int       @map("activity_id")
  therapistId String?   @map("therapist_id") @db.Uuid
  origin      String    // psychologist | ecos
  assignedAt  DateTime  @default(now()) @map("assigned_at")
  dueAt       DateTime? @map("due_at")
  status      String    @default("pending")
  response    String?   @db.Text
  completedAt DateTime? @map("completed_at")
}
```

### 3.9 Alerts and follow-up actions

The current `Alert` model resolves whether an alert exists, but `resolved: Boolean` can't represent
the care lifecycle. Adding priority and status is recommended, plus creating `AlertAction` to keep
the therapist's decisions.

| Field | Suggested value | Use |
|---|---|---|
| `priority` | `low / medium / high / critical` | Prioritizes attention without depending solely on alert type. |
| `status` | `new / reviewed / in_follow_up / closed` | Represents the lifecycle. |
| `reviewedAt` | `DateTime?` | Date of first professional review. |
| `reviewedById` | `String? @db.Uuid` | Professional who reviewed it. |
| `closedAt` | `DateTime?` | Alert closing date. |
| `contextSummary` | `Text?` | Context the patient chose to share during the initial screening. |

```prisma
model AlertAction {
  id          Int      @id @default(autoincrement())
  alertId     Int      @map("alert_id")
  therapistId String   @map("therapist_id") @db.Uuid
  actionType  String   @map("action_type")
  comment     String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
}
```

Expected action types: `reviewed`, `patient_contacted`, `appointment_created`,
`session_scheduled`, `referral_recommended`, and `closed`. The catalog can become an `enum` once the
flow has stabilized.

### 3.10 Patient-shared content

The private emotional journal must not be a queryable source from the panel. If the patient decides
to share an entry or a fragment with the therapist, the server needs to store an explicit snapshot
of that content.

```prisma
model SharedPatientContent {
  id            Int       @id @default(autoincrement())
  studentId     Int       @map("student_id")
  therapistId   String?   @map("therapist_id") @db.Uuid
  contentType   String    @map("content_type") // journal_entry, patient_note, ai_summary
  content       String    @db.Text
  sourceLocalId String?   @map("source_local_id") @db.VarChar(255)
  sharedAt      DateTime  @default(now()) @map("shared_at")
  revokedAt     DateTime? @map("revoked_at")
  createdAt     DateTime  @default(now()) @map("created_at")
}
```

**Privacy.** The panel must not expose `EmotionalJournal`, nor offer endpoints for general reads on
that model. It should only query `SharedPatientContent` or the equivalent mechanism representing an
explicit patient decision.

### 3.11 Consents and trusted contacts

Although not central to the panel's operation, modeling these is recommended because they condition
access, follow-up, and help mechanisms.

```prisma
model Consent {
  id              Int       @id @default(autoincrement())
  studentId       Int       @map("student_id")
  consentType     String    @map("consent_type")
  documentVersion String    @map("document_version") @db.VarChar(50)
  acceptedAt      DateTime? @map("accepted_at")
  revokedAt       DateTime? @map("revoked_at")
  createdAt       DateTime  @default(now()) @map("created_at")
}

model TrustedContact {
  id           Int     @id @default(autoincrement())
  studentId    Int     @map("student_id")
  fullName     String  @map("full_name") @db.VarChar(255)
  relationship String? @db.VarChar(100)
  phone        String? @db.VarChar(50)
  email        String? @db.VarChar(255)
  active       Boolean @default(true)
}
```

### 3.12 Auditing

The backend must log sensitive operations on clinical information. Auditing doesn't replace
technical logs — it's an access/action log with operational value.

```prisma
model AuditLog {
  id            Int      @id @default(autoincrement())
  userId        String   @map("user_id") @db.Uuid
  institutionId Int?     @map("institution_id")
  action        String   @db.VarChar(100)
  entity        String   @db.VarChar(100)
  entityId      String?  @map("entity_id") @db.VarChar(100)
  metadata      Json?
  createdAt     DateTime @default(now()) @map("created_at")
}
```

---

## 4. Scheduling and availability engine

The agenda must be resolved as a server-side business rule, not a frontend-only validation. The
frontend can display available hours, but the backend must recompute availability before confirming
an appointment, to avoid race conditions and duplicate bookings.

### 4.1 Therapist's weekly configuration

Each therapist can define one or more blocks per day. A block has a start time, end time, session
duration, and an optional break. For example, Monday 08:00–12:00 with 60-minute sessions and no
break yields four slots: 08:00, 09:00, 10:00, and 11:00.

| Example | Start | End | Duration | Break | Resulting slots |
|---|---|---|---|---|---|
| Morning block | 08:00 | 12:00 | 60 min | 0 min | 08:00 · 09:00 · 10:00 · 11:00 |
| Afternoon block | 13:30 | 17:30 | 60 min | 15 min | 13:30 · 14:45 · 16:00 |

### 4.2 Availability calculation

1. Resolve the institution's time zone.
2. Get the recurring schedule that applies to the therapist and the requested date.
3. Apply exceptions: absences, vacations, blocks, or extraordinary availability.
4. Generate slots according to `sessionDurationMinutes` and `breakMinutes`.
5. Query `Appointment` rows in states that occupy the agenda and remove overlapping slots.
6. Exclude past dates/times where applicable.
7. Return available slots to the frontend.
8. When creating the appointment, repeat the validation inside a transaction before persisting.

### 4.3 Appointment overlap

Two appointments overlap when one starts before the other ends and ends after the other starts.
The check must consider the appointment's actual duration, not just compare `appointmentDate` for
equality.

```text
Overlap rule
overlap = newStart < existingEnd  AND  newEnd > existingStart
```

### 4.4 Rescheduling

Rescheduling must re-validate availability. If full history is required, the safest option is to
mark the original appointment as `rescheduled` and create a new `Appointment` referenced via
`rescheduledFromId`. If the team prefers to update the same row instead, there must be at least a
change log.

### 4.5 Scheduling endpoints

| Method | Endpoint | Responsibility |
|---|---|---|
| GET | `/psychologists/:id/schedules` | Query recurring schedule. |
| POST | `/psychologists/:id/schedules` | Create an availability block. |
| PATCH | `/schedules/:id` | Modify duration, hours, or status. |
| DELETE | `/schedules/:id` | Deactivate/remove a block if it doesn't affect clinical traceability. |
| GET | `/psychologists/:id/schedule-exceptions` | Query exceptions. |
| POST | `/psychologists/:id/schedule-exceptions` | Log an absence or extraordinary schedule. |
| GET | `/psychologists/:id/availability?date=YYYY-MM-DD` | Get computed slots. |
| POST | `/appointments` | Create an appointment, validating the slot. |
| PATCH | `/appointments/:id/reschedule` | Reschedule onto a new slot. |
| PATCH | `/appointments/:id/cancel` | Cancel, keeping the reason. |

---

## 5. Recommended NestJS organization

Logic must be grouped by domain. Controllers validate HTTP contracts and delegate to services;
clinical, scheduling, authorization, and transaction rules must never be implemented directly in
controllers.

```text
src/
├── institutions/
├── users/
├── students/
├── psychologists/
├── therapist-assignments/
├── schedules/
├── appointments/
├── clinical-records/
├── clinical-notes/
├── treatment-plans/
├── activities/
├── bands/
├── biometrics/
├── alerts/
├── shared-content/
├── consents/
├── trusted-contacts/
├── dashboards/
├── audit/
└── common/
    ├── guards/
    ├── decorators/
    ├── policies/
    ├── pipes/
    └── dto/
```

### 5.1 Layer responsibilities

| Layer | Responsibility |
|---|---|
| Controller | Receives the request, applies pipes/guards, transforms parameters, and returns HTTP responses. Holds no business logic. |
| DTO | Defines the input/output contract, format validation, and allowed fields. |
| Service | Implements business rules, contextual authorization, transactions, and coordination between models. |
| Prisma | Persistence and queries. Must never be used from frontend components or bypass domain services. |
| Guard / Policy | Controls role, institution, therapist-patient assignment, and resource ownership. |
| Event / Notification | Reacts to appointments, alerts, and other changes without coupling the main flow to notification delivery. |

---

## 6. Authorization and data scope

Panel authorization must combine role, institution, and relationship to the resource. Checking only
`role=psychologist` or `role=administrator` is not enough for clinical information.

| Role | Scope | Main actions | Must not assume |
|---|---|---|---|
| `administrator` | Users and operations of their own institution | Create accounts, therapists, patients, assignments, operational scheduling, and catalogs. | Full access to clinical notes. |
| `psychologist` | Assigned patients and related clinical resources | Record, appointments, notes, plans, activities, alerts, biometrics, and shared content. | Unassigned or unauthorized patients. |
| `student` | Own data | Mobile app; not the web panel's focus. | Other users' information. |

> **Critical rule.** An authenticated therapist must not be able to query `/students/:id` merely
> because they hold the `psychologist` role. There must be an active assignment or explicit
> institutional authorization for that patient.

### 6.1 Suggested guards and policies

- `JwtAuthGuard` or the equivalent authentication mechanism already used by the project.
- `RolesGuard` to distinguish `administrator`, `psychologist`, and `student`.
- `InstitutionScopeGuard` to prevent cross-institution access.
- `AssignedStudentPolicy` to verify the therapist-patient relationship.
- `ClinicalResourcePolicy` for notes, records, plans, alerts, and shared content.
- `AuditInterceptor` to log selected sensitive operations.

---

## 7. Functional specification by module

### 7.1 Patients (StudentProfile)

The module must keep `StudentProfile` as the technical entity. The list for therapists is limited to
patients with an active assignment; the administrator can query their institution's patients.

| Method | Endpoint | Use | Access |
|---|---|---|---|
| GET | `/students` | List patients by scope. | Admin / Psychologist |
| POST | `/students` | Create `User` + `StudentProfile`. | Admin |
| GET | `/students/:id` | Get basic record. | Admin / assigned Psychologist |
| PATCH | `/students/:id` | Update allowed data. | Admin / defined scope |
| GET | `/students/:id/overview` | Aggregated view for the clinical header. | Assigned Psychologist |
| GET | `/students/:id/timeline` | Clinical timeline. | Assigned Psychologist |

`CreateStudentDto` — example JSON:

```json
{
  "fullName": "Ana Martínez",
  "email": "ana@example.com",
  "studentCode": "UDB-2026-001",
  "primaryDiagnosis": null,
  "assignedDoctorId": "b8f2c1d4-..."
}
```

Creation must run in a transaction: validate institution, validate email, create `User` with
`role=student`, create `StudentProfile`, and — if a therapist is assigned — also create a
`TherapistAssignment` and update `assignedDoctorId`.

### 7.2 Therapists

| Method | Endpoint | Use |
|---|---|---|
| GET | `/psychologists` | List the institution's therapists. |
| POST | `/psychologists` | Create a `User` with `role=psychologist` and a professional profile. |
| GET | `/psychologists/:id` | Get profile and status. |
| PATCH | `/psychologists/:id` | Update professional data. |
| GET | `/psychologists/:id/students` | Patients with an active assignment. |
| GET | `/psychologists/:id/availability` | Available slots for a date/range. |

### 7.3 Therapist-patient assignments

| Method | Endpoint | Use |
|---|---|---|
| POST | `/therapist-assignments` | Create a new assignment and close the previous primary one. |
| GET | `/students/:id/therapist-assignments` | Query assignment history. |
| GET | `/psychologists/:id/assignments` | Query a professional's assignments. |
| PATCH | `/therapist-assignments/:id/end` | End an assignment. |
| PATCH | `/therapist-assignments/:id/set-primary` | Set as primary and sync `StudentProfile.assignedDoctorId`. |

> **Mandatory transaction.** Reassignment must never leave a patient with two active primary
> therapists. Ending the previous assignment, inserting the new one, and updating
> `assignedDoctorId` must happen as a single transactional operation.

### 7.4 Appointments

| Method | Endpoint | Use |
|---|---|---|
| GET | `/appointments` | List agenda filtered by date, therapist, patient, or status. |
| POST | `/appointments` | Create an appointment, validating availability. |
| GET | `/appointments/:id` | Get detail. |
| PATCH | `/appointments/:id/confirm` | Confirm appointment. |
| PATCH | `/appointments/:id/reschedule` | Reschedule. |
| PATCH | `/appointments/:id/cancel` | Cancel with a reason. |
| PATCH | `/appointments/:id/no-show` | Mark as a no-show. |
| PATCH | `/appointments/:id/complete` | Mark as completed; may require a `ClinicalNote`. |

`CreateAppointmentDto` — example JSON:

```json
{
  "studentId": 45,
  "doctorId": "3fae1c9e-...",
  "sessionTitle": "Follow-up",
  "sessionType": "follow_up",
  "appointmentDate": "2026-09-18T14:00:00-06:00",
  "durationMinutes": 60,
  "modality": "in_person"
}
```

`AppointmentsService` must check: institution, the doctor's role, the assignment when applicable,
configured schedule, schedule exceptions, appointment conflicts, allowed duration, and that the date
is in the future.

### 7.5 Clinical record

| Method | Endpoint | Use |
|---|---|---|
| GET | `/students/:id/clinical-record` | Get record. |
| POST | `/students/:id/clinical-record` | Open a record if none exists. |
| PATCH | `/students/:id/clinical-record` | Update history and longitudinal information. |

### 7.6 Clinical notes

| Method | Endpoint | Use |
|---|---|---|
| POST | `/clinical-notes` | Log a note for a completed appointment. |
| GET | `/clinical-notes/:id` | Get note. |
| PATCH | `/clinical-notes/:id` | Update while the edit policy allows it. |
| GET | `/students/:id/clinical-notes` | Patient's note history. |

> **Deletion.** A physical `DELETE` on `ClinicalNote` is not recommended. If a note needs to be
> voided or corrected, use `voidedAt`, `voidedBy`, and `voidReason`, or an equivalent strategy that
> preserves traceability.

### 7.7 Treatment plan and goals

| Method | Endpoint | Use |
|---|---|---|
| POST | `/treatment-plans` | Create a plan. |
| GET | `/students/:id/treatment-plans` | Query the patient's plans. |
| PATCH | `/treatment-plans/:id` | Update status and content. |
| POST | `/treatment-plans/:id/goals` | Add a goal. |
| PATCH | `/treatment-goals/:id` | Update progress/status. |
| PATCH | `/treatment-plans/:id/close` | Close a plan, keeping history. |

### 7.8 Activities

| Method | Endpoint | Use |
|---|---|---|
| GET | `/activities` | Institutional catalog. |
| POST | `/activities` | Create a reusable activity. |
| PATCH | `/activities/:id` | Update or deactivate. |
| POST | `/students/:id/activities` | Assign an activity. |
| GET | `/students/:id/activities` | Query activity status. |
| PATCH | `/student-activities/:id` | Update status, response, or closure. |

### 7.9 Biometrics and Ecos Band

The panel must consume information with clinical or follow-up value, not a sequence of raw
high-frequency signals. Keeping `BiometricRecord` as a consolidated unit is recommended, documenting
the period/window it represents.

| Method | Endpoint | Use |
|---|---|---|
| GET | `/students/:id/bands` | Query linked Ecos Bands. |
| GET | `/students/:id/biometrics` | Query series/summaries by date range. |
| GET | `/students/:id/biometrics/latest` | Latest available summary. |
| GET | `/students/:id/biometrics/trends` | Trends prepared for charts. |

> **Edge recommendation.** If the mobile app generates multiple readings per minute, those signals
> should be processed locally and sent to the server as summaries, relevant events, or aggregated
> windows. This reduces volume, protects privacy, and stays consistent with the project's Edge
> Computing architecture.

### 7.10 Alerts

| Method | Endpoint | Use |
|---|---|---|
| GET | `/alerts` | List by therapist, priority, status, and date. |
| GET | `/alerts/:id` | Get detail. |
| PATCH | `/alerts/:id/review` | Log first review. |
| POST | `/alerts/:id/actions` | Log an action taken. |
| PATCH | `/alerts/:id/close` | Close the alert. |
| GET | `/students/:id/alerts` | Patient's history. |

The therapist may decide to contact the patient, schedule an appointment, plan a session, or
recommend a referral. An alert must not automatically turn into a diagnosis, nor modify the clinical
record without professional intervention.

### 7.11 Shared content

| Method | Endpoint | Use |
|---|---|---|
| GET | `/students/:id/shared-content` | Content explicitly shared with the professional. |
| GET | `/shared-content/:id` | Detail and sharing metadata. |

Creating shared content is primarily the mobile app's responsibility. The professional panel only
consumes content already shared. No panel endpoint should be built that lets someone browse the
patient's private journal.

### 7.12 Dashboards

| Endpoint | Expected content |
|---|---|
| `GET /dashboard/psychologist` | Assigned patients, today's appointments, upcoming appointments, pending alerts, priority alerts, activities, and recent follow-up. |
| `GET /dashboard/administrator` | Users, patients, therapists, assignments, appointments, linked bands, and the institution's operational metrics. |

### 7.13 Patient aggregated view

A composite endpoint is recommended for the record's landing screen, to avoid the frontend firing
many independent requests when a patient is opened.

`GET /students/:id/overview` — indicative contract:

```json
{
  "student": {},
  "currentTherapist": {},
  "nextAppointment": {},
  "activeTreatmentPlan": {},
  "recentBiometricSummary": {},
  "openAlerts": [],
  "pendingActivities": [],
  "recentClinicalNotes": [],
  "recentSharedContent": []
}
```

### 7.14 Clinical timeline

`ClinicalTimelineService` can unify events from `Appointment`, `ClinicalNote`, `Alert`,
`StudentActivity`, `SharedPatientContent`, and relevant clinical changes. It doesn't need its own
table in the first version; it can be built via queries mapped to a common DTO.

`TimelineItemDto`:

```json
{
  "type": "ALERT",
  "occurredAt": "2026-09-14T14:20:00-06:00",
  "title": "Follow-up alert",
  "referenceId": 381,
  "summary": "Biometric variation reviewed by the therapist"
}
```

---

## 8. Business rules by service

| Service | Responsibility |
|---|---|
| `StudentsService` | Create User/StudentProfile in a transaction; scope queries by institution; coordinate overview and basic relations. |
| `PsychologistsService` | Validate `role=psychologist`, professional profile, status, and institutional membership. |
| `TherapistAssignmentsService` | Keep history, close previous assignments, guarantee a single primary, sync `assignedDoctorId`. |
| `SchedulesService` | Manage the weekly schedule, exceptions, and slot generation. |
| `AppointmentsService` | Validate availability, conflicts, states, rescheduling, cancellation, and no-shows. |
| `ClinicalRecordsService` | Manage the record's longitudinal information with restricted access. |
| `ClinicalNotesService` | Log sessions, prevent unauthorized edits, preserve traceability. |
| `TreatmentPlansService` | Plans, goals, status, and closure. |
| `ActivitiesService` | Catalog, assignments, and telling `psychologist`/`ecos` origin apart. |
| `BiometricsService` | Query aggregates, ranges, and trends; avoid exposing unnecessary signals. |
| `AlertsService` | Lifecycle, priority, review, and actions. |
| `SharedContentService` | Expose only shared snapshots; respect revocation per policy. |
| `DashboardService` | Optimized aggregate queries, scoped correctly. |
| `AuditService` | Log sensitive access/actions without needlessly blocking the main flow. |

### 8.1 Transactions that must not be split

| Operation | Transactional unit |
|---|---|
| Create patient | `User` + `StudentProfile` + initial assignment, when applicable. |
| Reassign therapist | Close previous assignment + create new one + update `assignedDoctorId`. |
| Create appointment | Final availability check + persist appointment. |
| Reschedule | Validate new slot + preserve change traceability. |
| Complete appointment | Status change + creation/validation of `ClinicalNote` per policy. |
| Resolve alert | Log `AlertAction` + update status/closure. |

---

## 9. DTOs, validation, and API conventions

DTOs must prevent the client from sending audit fields, relations, or states that belong to the
server. NestJS must apply a global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`
where compatible with the current implementation.

| Data | Validation |
|---|---|
| IDs | Positive integers (or UUIDs for `User`-referencing fields); verify existence and institutional scope. |
| Email | Valid format and uniqueness per account policy. |
| Role | No arbitrary values outside the `Role` enum. |
| Date/time | ISO 8601; interpreted using the institution's time zone. |
| Session duration | Reasonable range, consistent with the therapist's configuration. |
| `Appointment.status` | Changes only via allowed transitions. |
| `ClinicalNote` | `appointmentId` required, and consistent with `studentId`/`doctorId`. |
| Assignment | `therapistId` must be a `User` with `role=psychologist` in the same institution. |
| `AlertAction` | Only an authorized professional for the associated patient. |
| Shared content | Creation from the panel not accepted, except an explicitly authorized case. |

### 9.1 Appointment transitions

```text
Suggested rule
pending     -> confirmed | cancelled | rescheduled
confirmed   -> completed | cancelled | rescheduled | no_show
completed   -> [terminal state]
cancelled   -> [terminal state]
no_show     -> [terminal state]
rescheduled -> [terminal state of the original appointment]
```

### 9.2 Responses and pagination

Lists of patients, appointments, alerts, and notes must be paginated. A consistent structure is
recommended to make the frontend's job easier.

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

---

## 10. Events and notifications

Even though the notification system can be implemented in a later phase, services must emit domain
events or provide clear integration points. This avoids coupling email, WebSocket, or push delivery
to the same method that persists the operation.

| Event | Use |
|---|---|
| `appointment.created` | Notify the patient/therapist depending on origin. |
| `appointment.rescheduled` | Notify a date change. |
| `appointment.cancelled` | Notify a cancellation. |
| `alert.created` | Update the panel and notify the responsible therapist. |
| `alert.reviewed` | Log follow-up; optionally inform the patient. |
| `activity.assigned` | Notify a new activity. |
| `therapist.assignment.changed` | Update relations and access. |
| `shared_content.created` | Inform the therapist of new shared content. |

---

## 11. Performance considerations

- Add indexes on foreign keys used for filtering: `studentId`, `doctorId`/`therapistId`, `status`,
  `appointmentDate`, `createdAt`.
- Index `TherapistAssignment` by `studentId`, `therapistId`, `startsAt`, and `endsAt`.
- Index `Appointment` by `doctorId` + `appointmentDate` and `studentId` + `appointmentDate`.
- Index `Alert` by `studentId` + `status` + `createdAt` and, where applicable, a derived therapist
  scope.
- Avoid N+1 queries in overview and dashboards; use controlled `include`/`select` or aggregate
  queries.
- Paginate histories and biometric series.
- Don't load large `Text` fields in lists when only a summary is needed.
- Keep dashboard responses compact and view-oriented.

---

## 12. Auditing, privacy, and handling of clinical information

The separation between administrative operation and clinical content must be reflected in the API.
An administrator needs to manage accounts and assignments, but must not automatically get access to
therapeutic notes, history, or shared content.

| Suggested event | When to log |
|---|---|
| `CLINICAL_RECORD_VIEWED` | Viewing the clinical record. |
| `CLINICAL_NOTE_CREATED` | Creating a session note. |
| `CLINICAL_NOTE_UPDATED` | A later edit. |
| `ALERT_REVIEWED` | First review of an alert. |
| `ALERT_ACTION_CREATED` | An action taken on an alert. |
| `THERAPIST_ASSIGNED` | Assignment/reassignment. |
| `SHARED_CONTENT_VIEWED` | Viewing explicitly shared content. |
| `CONSENT_UPDATED` | A relevant change to a consent. |

> **Emotional journal.** The professional panel must not consume `EmotionalJournal`. That model
> existing in the current schema doesn't imply it should be exposed through web endpoints. Clinical
> integration must be limited to content the patient explicitly shares.

---

## 13. Phased implementation plan (as proposed)

| Phase | Main deliverable |
|---|---|
| Phase 1 · Operational base | `TherapistAssignment`, `PsychologistProfile`, institution/assignment-based permissions, patient and therapist endpoints. |
| Phase 2 · Scheduling | `TherapistSchedule`, exceptions, availability, `Appointment` extension, rescheduling, and conflict control. |
| Phase 3 · Clinical record | `ClinicalRecord`, extended `ClinicalNote`, edit restrictions, clinical auditing. |
| Phase 4 · Therapeutic continuity | `TreatmentPlan`, `TreatmentGoal`, `Activity`, `StudentActivity`. |
| Phase 5 · Alerts and biometrics | `Alert` lifecycle, `AlertAction`, `BiometricRecord` queries, trends, and follow-up panel. |
| Phase 6 · Shared content | `SharedPatientContent` and panel access rules. |
| Phase 7 · Dashboards | Overview, timeline, therapist/admin dashboard, query optimization. |
| Phase 8 · Hardening | Authorization tests, indexes, auditing, idempotency, and OpenAPI contract review. |

_(Note: the phase numbering and scope actually used by the backend team live in_
_[`GOALS.md`](./GOALS.md) — it adds a Phase 0 ahead of this list and may reorder or merge the above._
_This table is the original proposal, not the executed plan.)_

## 14. Acceptance criteria

- An administrator can create therapists and patients only within their own institution.
- A therapist change preserves history and updates `assignedDoctorId` without ever duplicating a
  primary assignment.
- The frontend can get available slots without computing schedules itself.
- The server rejects an appointment outside office hours or overlapping another one.
- A therapist cannot query patients from another institution, or unassigned patients, without
  explicit authorization.
- The clinical record and notes keep traceability and are never physically deleted as routine.
- Alerts have a lifecycle, a priority, and an action history.
- The panel can query processed biometrics by period without depending on raw high-frequency data.
- The panel has no access to the private emotional journal.
- Content shared by the patient can be queried in a differentiated, audited way.
- Dashboards and overview use aggregated queries and don't require dozens of frontend requests.
- The OpenAPI/Swagger documentation reflects DTOs, responses, roles, and relevant errors.

---

## Appendix A. Endpoint summary matrix

| Module | Main endpoints |
|---|---|
| Patients | `GET/POST /students` · `GET/PATCH /students/:id` · `GET /students/:id/overview` · `GET /students/:id/timeline` |
| Therapists | `GET/POST /psychologists` · `GET/PATCH /psychologists/:id` · `GET /psychologists/:id/students` |
| Assignments | `POST /therapist-assignments` · `GET /students/:id/therapist-assignments` · `PATCH /therapist-assignments/:id/end` |
| Schedules | `GET/POST /psychologists/:id/schedules` · `PATCH /schedules/:id` · `POST /psychologists/:id/schedule-exceptions` |
| Availability | `GET /psychologists/:id/availability` |
| Appointments | `GET/POST /appointments` · `GET /appointments/:id` · confirm · reschedule · cancel · no-show · complete |
| Record | `GET/POST/PATCH /students/:id/clinical-record` |
| Notes | `POST /clinical-notes` · `GET/PATCH /clinical-notes/:id` · `GET /students/:id/clinical-notes` |
| Plans | `POST /treatment-plans` · `GET /students/:id/treatment-plans` · `PATCH /treatment-plans/:id` |
| Goals | `POST /treatment-plans/:id/goals` · `PATCH /treatment-goals/:id` |
| Activities | `GET/POST /activities` · `POST/GET /students/:id/activities` · `PATCH /student-activities/:id` |
| Biometrics | `GET /students/:id/biometrics` · latest · trends |
| Alerts | `GET /alerts` · `GET /alerts/:id` · review · actions · close · `GET /students/:id/alerts` |
| Shared | `GET /students/:id/shared-content` · `GET /shared-content/:id` |
| Dashboards | `GET /dashboard/psychologist` · `GET /dashboard/administrator` |

## Appendix B. Migration recommendations

- Create the new tables first, without dropping current columns.
- Backfill `TherapistAssignment` from `StudentProfile.assignedDoctorId` to preserve the initial
  state.
- Keep `assignedDoctorId` in sync during the transition.
- Add new values to `AppointmentStatus` via a compatible migration.
- Add fields to `Alert` as optional initially, and backfill `status` from `resolved`.
- Don't remove `EmotionalJournal` during this phase if the mobile app still uses it — simply don't
  expose it to the panel, and define the new shared-content contract.
- Add indexes after the backfill, and validate execution plans on the main listings.
- Update Swagger/OpenAPI and integration tests in the same delivery as each endpoint.

## Appendix C. Clinical design notes

The system must favor continuity of care without turning algorithmic outputs into automatic
clinical decisions. Biometric data, ECOS inferences, and alerts are supporting inputs. The therapist
retains responsibility for interpreting the information, documenting their assessment, and deciding
the corresponding follow-up.

Session notes, history, clinical impressions, and treatment plans must be kept distinct from
system-generated data. The backend must preserve this separation both in the data model and in
permissions and frontend representation.

**Expected outcome.** Once these phases are complete, the server will be able to sustain a clinical
panel with institutional administration, historical assignment, professional scheduling, a clinical
record, therapeutic follow-up, biometrics, alerts, shared content, and auditing — without abandoning
the `StudentProfile` schema the project already uses.
