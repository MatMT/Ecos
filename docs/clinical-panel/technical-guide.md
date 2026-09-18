# ECOS — Guía técnica para el backend del panel clínico

_Terapeutas y administradores · NestJS · Prisma ORM · PostgreSQL_

Documento de especificación técnica · Versión inicial · Septiembre 2026

> **Origen.** Copia fiel (reformateada a Markdown) de la propuesta recibida del responsable de la
> aplicación **mobile** el 2026-09-16, para servir de referencia versionada dentro del repositorio.
> Las decisiones definitivas del equipo — qué se adopta tal cual, qué se ajusta y por qué — viven en
> [`GOALS.md`](./GOALS.md), no en este archivo. Este documento no se edita para "corregirlo"; se
> preserva como la propuesta original. Para trabajo diario en inglés, ver la traducción adaptada en
> [`technical-guide.en.md`](./technical-guide.en.md).

**Propósito.** Definir la evolución del backend existente para soportar la operación de una clínica
de psicología, preservando el modelo `StudentProfile` y las relaciones actuales siempre que sea
viable, y agregando capacidades clínicas, operativas y de auditoría sin introducir
refactorizaciones innecesarias.

---

## 1. Objetivo, alcance y decisiones de diseño

Esta guía establece los requerimientos técnicos para ampliar el servidor de ECOS y preparar una API
consumible por el panel web de terapeutas y administradores. El documento parte del esquema Prisma
actualmente implementado y propone cambios aditivos, reglas de negocio, servicios, controladores,
DTO, endpoints y mecanismos de autorización necesarios para operar un flujo clínico de psicología
con continuidad de seguimiento.

La intención no es reemplazar la arquitectura existente ni renombrar masivamente los modelos ya
utilizados por el servidor. Las nuevas capacidades deberán integrarse alrededor del dominio actual,
preservando compatibilidad con la aplicación móvil y con la lógica ya desarrollada.

### 1.1 Decisiones confirmadas para esta etapa

| Decisión | Criterio técnico |
|---|---|
| Paciente | Se mantiene técnicamente como `StudentProfile`. En el frontend y en la documentación funcional puede denominarse paciente. |
| Asignación terapeuta-paciente | Se incorpora una tabla histórica de asignaciones. `StudentProfile.assignedDoctorId` se conserva como puntero al terapeuta principal actual. |
| Agenda | Cada terapeuta debe contar con disponibilidad configurable, duración de sesión y excepciones. Las citas solo se crean sobre espacios válidos. |
| Sesión clínica | `Appointment` + `ClinicalNote` continúan siendo la base. No se exige crear un modelo `Session` independiente en esta fase. |
| Diario emocional | No forma parte del panel clínico. El contenido privado permanece en la aplicación móvil. |
| Contenido compartido | El servidor almacena únicamente contenido que el paciente comparta expresamente con el terapeuta. |
| Biometría | El panel consulta información procesada o consolidada; no se recomienda utilizar PostgreSQL como repositorio de señales crudas de alta frecuencia. |
| Administradores | Gestionan operación, usuarios, asignaciones y agenda; no reciben acceso irrestricto a notas clínicas por el solo hecho de ser administradores. |

**Criterio de implementación.** Cuando una capacidad pueda resolverse extendiendo un modelo
existente, se priorizará esa opción. Se crearán modelos nuevos únicamente cuando representen un
concepto con ciclo de vida propio, historial o reglas que no deban mezclarse con las tablas
actuales.

### 1.2 Alcance funcional del panel

- Administración institucional de usuarios, terapeutas y pacientes.
- Asignación y reasignación de terapeutas conservando historial.
- Definición de horarios de atención, duración de sesiones y excepciones de disponibilidad.
- Agenda, solicitudes de cita, confirmación, reprogramación, cancelación y control de asistencia.
- Expediente psicológico, notas de sesión y continuidad terapéutica.
- Planes de tratamiento, objetivos y actividades asignadas.
- Consulta de información biométrica resumida y alertas generadas por ECOS.
- Gestión profesional de alertas y registro de acciones de seguimiento.
- Consulta de contenido que el paciente haya decidido compartir expresamente.
- Dashboards, línea de tiempo clínica, autorización por rol y relación clínica, y auditoría.

---

## 2. Esquema actual y criterio de compatibilidad

El esquema Prisma actual ya define la estructura principal del ecosistema remoto. La evolución
propuesta debe respetar estos modelos y sus nombres para evitar modificar innecesariamente
servicios, consultas y relaciones ya utilizadas.

| Modelo Prisma | Tabla | Uso actual / criterio |
|---|---|---|
| `Institution` | `remote_institutions` | Institución a la que pertenecen los usuarios. |
| `User` | `remote_users` | Cuenta, rol e institución. Los terapeutas continúan representándose como `User` con `role=psychologist`. |
| `StudentProfile` | `remote_student_profiles` | Perfil del usuario que recibe seguimiento. Para el panel se interpreta funcionalmente como paciente. |
| `BandDevice` | `remote_band_devices` | Ecos Band vinculada al paciente. |
| `BiometricRecord` | `remote_biometric_records` | Registro biométrico remoto; se recomienda tratarlo como dato consolidado/procesado. |
| `Alert` | `remote_alerts` | Alertas derivadas de anomalías, IA o botón de ayuda. |
| `EmotionalJournal` | `remote_emotional_journal` | Existe en el esquema, pero no debe exponerse en el panel clínico. |
| `Appointment` | `remote_appointments` | Agenda entre paciente y terapeuta. |
| `ClinicalNote` | `remote_clinical_notes` | Registro profesional asociado a una cita. |

_Figura 1. Esquema relacional de referencia compartido para el proyecto ECOS._

### 2.1 StudentProfile se mantiene como paciente

No se recomienda renombrar `StudentProfile` ni sus claves foráneas en esta etapa. El backend ya
utiliza `studentId`, `assignedDoctorId` y relaciones asociadas. Cambiar el dominio completo a
`PatientProfile` obligaría a actualizar modelos, migraciones, DTO, consultas, pruebas y
posiblemente contratos ya consumidos por la aplicación móvil.

> **Convención funcional.** En el backend se conserva `StudentProfile` y `studentId`. En el panel,
> los textos visibles pueden utilizar "Paciente". La diferencia es deliberada y evita una migración
> de nombres sin beneficio funcional inmediato.

### 2.2 Relaciones que deben preservarse

- `Institution` 1 ─── N `User`
- `User` 1 ─── 0..1 `StudentProfile`
- `User(psychologist)` 1 ─── N `StudentProfile` `[assignedDoctorId, compatibilidad]`
- `StudentProfile` 1 ─── N `Appointment`
- `User(psychologist)` 1 ─── N `Appointment`
- `Appointment` 1 ─── 0..1 `ClinicalNote`
- `StudentProfile` 1 ─── N `BandDevice`
- `BandDevice` 1 ─── N `BiometricRecord`
- `StudentProfile` 1 ─── N `Alert`

---

## 3. Evolución recomendada del modelo de datos

Las siguientes extensiones se plantean para cubrir los casos de uso del panel sin romper el esquema
existente. Cada propuesta indica qué problema resuelve y cómo debe convivir con los modelos
actuales.

### 3.1 Historial de asignación terapeuta-paciente

`StudentProfile.assignedDoctorId` es útil para resolver rápidamente quién es el terapeuta principal
actual, pero no conserva el historial de cambios. Se recomienda crear `TherapistAssignment` como
tabla de relación histórica y mantener `assignedDoctorId` sincronizado con la asignación activa
principal.

```prisma
model TherapistAssignment {
  id           Int       @id @default(autoincrement())
  studentId    Int       @map("student_id")
  therapistId  Int       @map("therapist_id")
  assignedById Int?      @map("assigned_by_id")
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

La creación de una nueva asignación debe ejecutarse dentro de una transacción: finalizar la
asignación principal anterior, insertar el nuevo historial y actualizar
`StudentProfile.assignedDoctorId`. El servicio debe impedir dos asignaciones principales activas
para el mismo paciente.

### 3.2 Perfil profesional del terapeuta

`User` puede continuar siendo la entidad de autenticación del terapeuta. Se recomienda un perfil
complementario únicamente para datos profesionales que no pertenecen a la cuenta.

```prisma
model PsychologistProfile {
  id                    Int      @id @default(autoincrement())
  userId                Int      @unique @map("user_id")
  professionalLicense   String?  @map("professional_license") @db.VarChar(100)
  specialty             String?  @db.VarChar(255)
  phone                 String?  @db.VarChar(50)
  defaultSessionMinutes Int      @default(60) @map("default_session_minutes")
  active                Boolean  @default(true)
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
}
```

### 3.3 Disponibilidad y horario del terapeuta

La agenda no debe basarse únicamente en citas existentes. Antes de permitir una reserva, el servidor
necesita conocer cuándo atiende cada terapeuta, cuánto dura una sesión y qué excepciones existen.
Esta capa evita crear citas fuera de horario y permite al frontend consultar espacios disponibles.

```prisma
model TherapistSchedule {
  id                     Int       @id @default(autoincrement())
  therapistId            Int       @map("therapist_id")
  dayOfWeek              Int       @map("day_of_week") // 1=Lunes ... 7=Domingo
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
  therapistId Int       @map("therapist_id")
  date        DateTime  @db.Date
  startTime   DateTime? @db.Time(0) @map("start_time")
  endTime     DateTime? @db.Time(0) @map("end_time")
  available   Boolean   @default(false)
  reason      String?   @db.VarChar(255)
}
```

**Uso esperado.** `TherapistSchedule` define la disponibilidad semanal recurrente.
`TherapistScheduleException` permite bloquear vacaciones, reuniones y ausencias, o habilitar
horarios extraordinarios. La duración normal puede ser de 60 minutos, pero queda configurable por
terapeuta o por bloque de horario.

### 3.4 Extensiones de Appointment

`Appointment` debe mantenerse como entidad principal de agenda. Se recomienda ampliar sus campos
para permitir control de duración, modalidad, cancelaciones, reprogramaciones y trazabilidad de
quién creó la cita.

| Campo sugerido | Tipo | Propósito |
|---|---|---|
| `durationMinutes` | `Int` | Duración efectiva de la sesión. Por defecto toma la configuración del terapeuta. |
| `endAt` | `DateTime?` | Hora final calculada. Facilita detección de solapamientos. |
| `modality` | `enum/string` | Presencial, virtual u otras modalidades definidas por la institución. |
| `reason` | `String?` | Motivo resumido de la cita. |
| `cancelReason` | `String?` | Motivo de cancelación. |
| `createdById` | `Int?` | Usuario que generó la cita. |
| `rescheduledFromId` | `Int?` | Referencia a la cita anterior si se conserva historial mediante una nueva cita. |

Se recomienda ampliar `AppointmentStatus` con `rescheduled` y `no_show`. Los estados existentes
deben mantenerse para no afectar la lógica ya implementada.

### 3.5 Expediente clínico

`ClinicalNote` representa una sesión puntual. Para información longitudinal se recomienda
`ClinicalRecord`, único por `StudentProfile` dentro de la institución actual.

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

El expediente no debe reemplazar las notas de sesión. Su objetivo es conservar antecedentes y datos
que atraviesan varias consultas.

### 3.6 ClinicalNote como registro de sesión

La relación uno a uno entre `Appointment` y `ClinicalNote` puede mantenerse como representación
práctica de una sesión realizada. `sessionDiagnosis` debe continuar siendo opcional: una consulta
psicológica no implica necesariamente emitir o modificar un diagnóstico.

| Campo / concepto | Criterio |
|---|---|
| `sessionSummary` | Resumen profesional de la sesión. |
| `clinicalImpression` | Impresión clínica del profesional, diferenciada de un diagnóstico formal. |
| `interventions` | Intervenciones o técnicas aplicadas. |
| `agreements` | Acuerdos establecidos con el paciente. |
| `followUpPlan` | Plan para la siguiente sesión o seguimiento. |
| `aiAssistantAnalysis` | Análisis auxiliar. Nunca debe sobrescribir automáticamente el contenido profesional. |

### 3.7 Plan terapéutico y objetivos

Para dar continuidad al tratamiento se recomienda separar los objetivos clínicos de las notas de
sesión. Un plan puede permanecer activo durante varias citas y contener uno o más objetivos.

```prisma
model TreatmentPlan {
  id          Int       @id @default(autoincrement())
  studentId   Int       @map("student_id")
  therapistId Int       @map("therapist_id")
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

### 3.8 Actividades y recomendaciones

ECOS debe permitir que el terapeuta asigne actividades y que el sistema pueda generar
recomendaciones diferenciadas. El origen debe conservarse para que el frontend no confunda una
sugerencia de ECOS con una indicación profesional.

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
  therapistId Int?      @map("therapist_id")
  origin      String    // psychologist | ecos
  assignedAt  DateTime  @default(now()) @map("assigned_at")
  dueAt       DateTime? @map("due_at")
  status      String    @default("pending")
  response    String?   @db.Text
  completedAt DateTime? @map("completed_at")
}
```

### 3.9 Alertas y acciones de seguimiento

El modelo `Alert` actual resuelve la existencia de una alerta, pero `resolved: Boolean` no permite
representar el ciclo de atención. Se recomienda añadir prioridad y estado, y crear `AlertAction`
para conservar las decisiones del terapeuta.

| Campo | Valor sugerido | Uso |
|---|---|---|
| `priority` | `low / medium / high / critical` | Jerarquiza la atención sin depender únicamente del tipo de alerta. |
| `status` | `new / reviewed / in_follow_up / closed` | Representa el ciclo de vida. |
| `reviewedAt` | `DateTime?` | Fecha de primera revisión profesional. |
| `reviewedById` | `Int?` | Profesional que revisó. |
| `closedAt` | `DateTime?` | Cierre de la alerta. |
| `contextSummary` | `Text?` | Contexto que el paciente decidió comunicar durante el filtro inicial. |

```prisma
model AlertAction {
  id          Int      @id @default(autoincrement())
  alertId     Int      @map("alert_id")
  therapistId Int      @map("therapist_id")
  actionType  String   @map("action_type")
  comment     String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
}
```

Tipos de acción esperados: `reviewed`, `patient_contacted`, `appointment_created`,
`session_scheduled`, `referral_recommended` y `closed`. El catálogo puede implementarse con `enum`
cuando el flujo quede estabilizado.

### 3.10 Contenido compartido por el paciente

El diario emocional privado no debe ser una fuente consultable desde el panel. Si el paciente
decide compartir una entrada o un fragmento con el terapeuta, el servidor necesita almacenar un
snapshot explícito de ese contenido.

```prisma
model SharedPatientContent {
  id            Int       @id @default(autoincrement())
  studentId     Int       @map("student_id")
  therapistId   Int?      @map("therapist_id")
  contentType   String    @map("content_type") // journal_entry, patient_note, ai_summary
  content       String    @db.Text
  sourceLocalId String?   @map("source_local_id") @db.VarChar(255)
  sharedAt      DateTime  @default(now()) @map("shared_at")
  revokedAt     DateTime? @map("revoked_at")
  createdAt     DateTime  @default(now()) @map("created_at")
}
```

**Privacidad.** El panel no debe exponer `EmotionalJournal` ni ofrecer endpoints de lectura general
sobre ese modelo. Solo debe consultar `SharedPatientContent` o el mecanismo equivalente que
represente una decisión explícita del paciente.

### 3.11 Consentimientos y contactos de confianza

Aunque no son parte central de la operación del panel, se recomienda modelarlos porque condicionan
acceso, seguimiento y mecanismos de ayuda.

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

### 3.12 Auditoría

El backend debe registrar operaciones sensibles sobre información clínica. La auditoría no
sustituye los logs técnicos; es una bitácora de acceso y acciones con valor operativo.

```prisma
model AuditLog {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  institutionId Int?     @map("institution_id")
  action        String   @db.VarChar(100)
  entity        String   @db.VarChar(100)
  entityId      String?  @map("entity_id") @db.VarChar(100)
  metadata      Json?
  createdAt     DateTime @default(now()) @map("created_at")
}
```

---

## 4. Motor de agenda y disponibilidad

La agenda debe resolverse como una regla de negocio del servidor y no como una validación exclusiva
del frontend. El frontend puede mostrar horarios disponibles, pero el backend debe recalcular
disponibilidad antes de confirmar una cita para evitar condiciones de carrera y reservas
duplicadas.

### 4.1 Configuración semanal del terapeuta

Cada terapeuta puede definir uno o varios bloques por día. Un bloque contiene hora de inicio, hora
final, duración de sesión y pausa opcional. Por ejemplo, lunes de 08:00 a 12:00 con sesiones de 60
minutos y sin pausa genera cuatro espacios: 08:00, 09:00, 10:00 y 11:00.

| Ejemplo | Inicio | Fin | Duración | Pausa | Slots resultantes |
|---|---|---|---|---|---|
| Bloque mañana | 08:00 | 12:00 | 60 min | 0 min | 08:00 · 09:00 · 10:00 · 11:00 |
| Bloque tarde | 13:30 | 17:30 | 60 min | 15 min | 13:30 · 14:45 · 16:00 |

### 4.2 Cálculo de disponibilidad

1. Resolver la zona horaria de la institución.
2. Obtener el horario recurrente aplicable al terapeuta y a la fecha solicitada.
3. Aplicar excepciones: ausencias, vacaciones, bloqueos o disponibilidad extraordinaria.
4. Generar los espacios de acuerdo con `sessionDurationMinutes` y `breakMinutes`.
5. Consultar `Appointment` en estados que ocupan agenda y eliminar los espacios solapados.
6. Excluir fechas/horas ya vencidas cuando corresponda.
7. Retornar slots disponibles al frontend.
8. Al crear la cita, repetir la validación dentro de una transacción antes de persistir.

### 4.3 Solapamiento de citas

Dos citas se solapan cuando el inicio de una ocurre antes del final de la otra y su final ocurre
después del inicio de la otra. La validación debe considerar la duración real de la cita y no
únicamente comparar `appointmentDate` por igualdad.

```text
Regla de solapamiento
overlap = newStart < existingEnd  AND  newEnd > existingStart
```

### 4.4 Reprogramación

La reprogramación debe validar nuevamente disponibilidad. Si se requiere historial completo, la
opción más segura es marcar la cita original como `rescheduled` y crear una nueva `Appointment`
referenciada mediante `rescheduledFromId`. Si el equipo prefiere actualizar la misma fila, deberá
existir al menos una bitácora de cambios.

### 4.5 Endpoints de agenda

| Método | Endpoint | Responsabilidad |
|---|---|---|
| GET | `/psychologists/:id/schedules` | Consultar horario recurrente. |
| POST | `/psychologists/:id/schedules` | Crear bloque de atención. |
| PATCH | `/schedules/:id` | Modificar duración, horas o estado. |
| DELETE | `/schedules/:id` | Desactivar/eliminar bloque si no afecta trazabilidad clínica. |
| GET | `/psychologists/:id/schedule-exceptions` | Consultar excepciones. |
| POST | `/psychologists/:id/schedule-exceptions` | Registrar ausencia o horario extraordinario. |
| GET | `/psychologists/:id/availability?date=YYYY-MM-DD` | Obtener slots calculados. |
| POST | `/appointments` | Crear cita validando slot. |
| PATCH | `/appointments/:id/reschedule` | Reprogramar sobre un nuevo slot. |
| PATCH | `/appointments/:id/cancel` | Cancelar conservando motivo. |

---

## 5. Organización recomendada en NestJS

La lógica debe agruparse por dominio. Los controladores deben validar contratos HTTP y delegar en
servicios; las reglas clínicas, de agenda, autorización y transacciones no deben implementarse
directamente en los controladores.

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

### 5.1 Responsabilidad de las capas

| Capa | Responsabilidad |
|---|---|
| Controller | Recibe request, aplica pipes/guards, transforma parámetros y devuelve respuestas HTTP. No concentra lógica de negocio. |
| DTO | Define el contrato de entrada/salida, validaciones de formato y campos permitidos. |
| Service | Implementa reglas de negocio, autorización contextual, transacciones y coordinación entre modelos. |
| Prisma | Persistencia y consultas. No debe ser utilizado desde componentes del frontend ni saltarse los servicios del dominio. |
| Guard / Policy | Controla rol, institución, asignación terapeuta-paciente y propiedad del recurso. |
| Event / Notification | Reacciona a citas, alertas y otros cambios sin acoplar el flujo principal a la notificación. |

---

## 6. Autorización y alcance de datos

La autorización del panel debe combinar rol, institución y relación con el recurso. Comprobar
únicamente `role=psychologist` o `role=administrator` no es suficiente para información clínica.

| Rol | Alcance | Acciones principales | No debe asumir |
|---|---|---|---|
| `administrator` | Usuarios y operación de su institución | Crear cuentas, terapeutas, pacientes, asignaciones, agenda operativa y catálogos. | Notas clínicas completas por defecto. |
| `psychologist` | Pacientes asignados y recursos clínicos relacionados | Expediente, citas, notas, planes, actividades, alertas, biometría y contenido compartido. | Pacientes sin asignación o autorización. |
| `student` | Datos propios | Aplicación móvil; no es el foco del panel web. | Información de otros usuarios. |

> **Regla crítica.** Un terapeuta autenticado no debe poder consultar `/students/:id` únicamente
> porque posee el rol `psychologist`. Debe existir una asignación activa o una autorización
> institucional explícita para ese paciente.

### 6.1 Guards y políticas sugeridas

- `JwtAuthGuard` o mecanismo equivalente de autenticación ya utilizado por el proyecto.
- `RolesGuard` para distinguir `administrator`, `psychologist` y `student`.
- `InstitutionScopeGuard` para impedir acceso cruzado entre instituciones.
- `AssignedStudentPolicy` para verificar relación terapeuta-paciente.
- `ClinicalResourcePolicy` para notas, expediente, planes, alertas y contenido compartido.
- `AuditInterceptor` para registrar operaciones sensibles seleccionadas.

---

## 7. Especificación funcional por módulo

### 7.1 Pacientes (StudentProfile)

El módulo debe mantener `StudentProfile` como entidad técnica. El listado para terapeutas se limita
a pacientes con asignación activa; el administrador puede consultar los pacientes de su
institución.

| Método | Endpoint | Uso | Acceso |
|---|---|---|---|
| GET | `/students` | Listar pacientes según alcance. | Admin / Psychologist |
| POST | `/students` | Crear `User` + `StudentProfile`. | Admin |
| GET | `/students/:id` | Consultar ficha básica. | Admin / Psychologist asignado |
| PATCH | `/students/:id` | Actualizar datos permitidos. | Admin / alcance definido |
| GET | `/students/:id/overview` | Vista agregada para cabecera clínica. | Psychologist asignado |
| GET | `/students/:id/timeline` | Línea de tiempo clínica. | Psychologist asignado |

`CreateStudentDto` — JSON de ejemplo:

```json
{
  "fullName": "Ana Martínez",
  "email": "ana@example.com",
  "studentCode": "UDB-2026-001",
  "primaryDiagnosis": null,
  "assignedDoctorId": 17
}
```

La creación debe ejecutarse en transacción: validar institución, validar correo, crear `User` con
`role=student`, crear `StudentProfile` y, si se asigna terapeuta, crear `TherapistAssignment`
además de actualizar `assignedDoctorId`.

### 7.2 Terapeutas

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/psychologists` | Listar terapeutas de la institución. |
| POST | `/psychologists` | Crear `User` con `role=psychologist` y perfil profesional. |
| GET | `/psychologists/:id` | Consultar perfil y estado. |
| PATCH | `/psychologists/:id` | Actualizar datos profesionales. |
| GET | `/psychologists/:id/students` | Pacientes con asignación activa. |
| GET | `/psychologists/:id/availability` | Slots disponibles para una fecha/rango. |

### 7.3 Asignaciones terapeuta-paciente

| Método | Endpoint | Uso |
|---|---|---|
| POST | `/therapist-assignments` | Crear nueva asignación y cerrar la principal previa. |
| GET | `/students/:id/therapist-assignments` | Consultar historial de asignaciones. |
| GET | `/psychologists/:id/assignments` | Consultar asignaciones del profesional. |
| PATCH | `/therapist-assignments/:id/end` | Finalizar asignación. |
| PATCH | `/therapist-assignments/:id/set-primary` | Definir principal y sincronizar `StudentProfile.assignedDoctorId`. |

> **Transacción obligatoria.** La reasignación no debe dejar al paciente con dos terapeutas
> principales activos. Finalizar la asignación anterior, insertar la nueva y actualizar
> `assignedDoctorId` debe ocurrir como una única operación transaccional.

### 7.4 Citas

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/appointments` | Listar agenda filtrada por fecha, terapeuta, paciente o estado. |
| POST | `/appointments` | Crear cita validando disponibilidad. |
| GET | `/appointments/:id` | Consultar detalle. |
| PATCH | `/appointments/:id/confirm` | Confirmar cita. |
| PATCH | `/appointments/:id/reschedule` | Reprogramar. |
| PATCH | `/appointments/:id/cancel` | Cancelar con motivo. |
| PATCH | `/appointments/:id/no-show` | Marcar inasistencia. |
| PATCH | `/appointments/:id/complete` | Marcar realizada; puede requerir `ClinicalNote`. |

`CreateAppointmentDto` — JSON de ejemplo:

```json
{
  "studentId": 45,
  "doctorId": 17,
  "sessionTitle": "Seguimiento",
  "sessionType": "follow_up",
  "appointmentDate": "2026-09-18T14:00:00-06:00",
  "durationMinutes": 60,
  "modality": "in_person"
}
```

`AppointmentsService` debe comprobar: institución, rol del doctor, asignación cuando aplique,
horario configurado, excepción de agenda, conflicto de citas, duración permitida y fecha futura.

### 7.5 Expediente clínico

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/students/:id/clinical-record` | Consultar expediente. |
| POST | `/students/:id/clinical-record` | Abrir expediente si no existe. |
| PATCH | `/students/:id/clinical-record` | Actualizar antecedentes e información longitudinal. |

### 7.6 Notas clínicas

| Método | Endpoint | Uso |
|---|---|---|
| POST | `/clinical-notes` | Registrar nota para una cita realizada. |
| GET | `/clinical-notes/:id` | Consultar nota. |
| PATCH | `/clinical-notes/:id` | Actualizar mientras la política de edición lo permita. |
| GET | `/students/:id/clinical-notes` | Historial de notas del paciente. |

> **Eliminación.** No se recomienda `DELETE` físico para `ClinicalNote`. Si una nota debe anularse o
> corregirse, utilice `voidedAt`, `voidedBy` y `voidReason`, o una estrategia equivalente que
> conserve trazabilidad.

### 7.7 Plan terapéutico y objetivos

| Método | Endpoint | Uso |
|---|---|---|
| POST | `/treatment-plans` | Crear plan. |
| GET | `/students/:id/treatment-plans` | Consultar planes del paciente. |
| PATCH | `/treatment-plans/:id` | Actualizar estado y contenido. |
| POST | `/treatment-plans/:id/goals` | Agregar objetivo. |
| PATCH | `/treatment-goals/:id` | Actualizar progreso/estado. |
| PATCH | `/treatment-plans/:id/close` | Cerrar plan conservando historial. |

### 7.8 Actividades

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/activities` | Catálogo institucional. |
| POST | `/activities` | Crear actividad reutilizable. |
| PATCH | `/activities/:id` | Actualizar o desactivar. |
| POST | `/students/:id/activities` | Asignar actividad. |
| GET | `/students/:id/activities` | Consultar estado de actividades. |
| PATCH | `/student-activities/:id` | Actualizar estado, respuesta o cierre. |

### 7.9 Biométricos y Ecos Band

El panel debe consumir información que tenga utilidad clínica o de seguimiento, no una secuencia de
señales crudas de alta frecuencia. Se recomienda mantener `BiometricRecord` como unidad consolidada
y documentar el periodo o ventana que representa.

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/students/:id/bands` | Consultar Ecos Band vinculadas. |
| GET | `/students/:id/biometrics` | Consultar series/resúmenes por rango de fecha. |
| GET | `/students/:id/biometrics/latest` | Último resumen disponible. |
| GET | `/students/:id/biometrics/trends` | Tendencias preparadas para gráficas. |

> **Recomendación Edge.** Si la aplicación móvil genera múltiples lecturas por minuto, esas señales
> deben procesarse localmente y enviarse al servidor como resúmenes, eventos relevantes o ventanas
> agregadas. Esto reduce volumen, protege privacidad y mantiene coherencia con la arquitectura Edge
> Computing del proyecto.

### 7.10 Alertas

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/alerts` | Listado según terapeuta, prioridad, estado y fecha. |
| GET | `/alerts/:id` | Detalle. |
| PATCH | `/alerts/:id/review` | Registrar primera revisión. |
| POST | `/alerts/:id/actions` | Registrar acción tomada. |
| PATCH | `/alerts/:id/close` | Cerrar alerta. |
| GET | `/students/:id/alerts` | Historial del paciente. |

El terapeuta puede decidir contactar al paciente, programar cita, planificar sesión o recomendar
una referencia. La alerta no debe convertirse automáticamente en diagnóstico ni modificar el
expediente clínico sin intervención profesional.

### 7.11 Contenido compartido

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/students/:id/shared-content` | Contenido compartido expresamente con el profesional. |
| GET | `/shared-content/:id` | Detalle y metadatos de compartición. |

La creación del contenido compartido corresponde principalmente a la aplicación móvil. El panel
profesional consume únicamente contenido ya compartido. No se debe implementar un endpoint del
panel que permita navegar el diario privado del paciente.

### 7.12 Dashboards

| Endpoint | Contenido esperado |
|---|---|
| `GET /dashboard/psychologist` | Pacientes asignados, citas del día, próximas citas, alertas pendientes, alertas prioritarias, actividades y seguimiento reciente. |
| `GET /dashboard/administrator` | Usuarios, pacientes, terapeutas, asignaciones, citas, bandas vinculadas y métricas operativas de la institución. |

### 7.13 Vista agregada del paciente

Se recomienda un endpoint compuesto para la pantalla inicial del expediente. Su objetivo es evitar
que el frontend ejecute numerosas solicitudes independientes al abrir un paciente.

`GET /students/:id/overview` — contrato orientativo:

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

### 7.14 Línea de tiempo clínica

`ClinicalTimelineService` puede unificar eventos provenientes de `Appointment`, `ClinicalNote`,
`Alert`, `StudentActivity`, `SharedPatientContent` y cambios clínicos relevantes. No necesita una
tabla propia en la primera versión; puede construirse mediante consultas y mapeo a un DTO común.

`TimelineItemDto`:

```json
{
  "type": "ALERT",
  "occurredAt": "2026-09-14T14:20:00-06:00",
  "title": "Alerta de seguimiento",
  "referenceId": 381,
  "summary": "Variación biométrica revisada por el terapeuta"
}
```

---

## 8. Reglas de negocio por servicio

| Servicio | Responsabilidad |
|---|---|
| `StudentsService` | Crear User/StudentProfile en transacción; limitar consultas por institución; coordinar overview y relaciones básicas. |
| `PsychologistsService` | Validar `role=psychologist`, perfil profesional, estado y pertenencia institucional. |
| `TherapistAssignmentsService` | Mantener historial, cerrar asignaciones previas, garantizar principal única y sincronizar `assignedDoctorId`. |
| `SchedulesService` | Gestionar horario semanal, excepciones y generación de slots. |
| `AppointmentsService` | Validar disponibilidad, conflictos, estados, reprogramación, cancelación e inasistencia. |
| `ClinicalRecordsService` | Gestionar información longitudinal del expediente con acceso restringido. |
| `ClinicalNotesService` | Registrar sesión, impedir modificación no autorizada y conservar trazabilidad. |
| `TreatmentPlansService` | Planes, objetivos, estado y cierre. |
| `ActivitiesService` | Catálogo, asignaciones y diferenciación de origen `psychologist`/`ecos`. |
| `BiometricsService` | Consultar agregados, rangos y tendencias; evitar exponer señales innecesarias. |
| `AlertsService` | Ciclo de vida, prioridad, revisión y acciones. |
| `SharedContentService` | Exponer únicamente snapshots compartidos; respetar revocación según política. |
| `DashboardService` | Consultas agregadas optimizadas y limitadas por alcance. |
| `AuditService` | Registrar accesos/acciones sensibles sin bloquear innecesariamente el flujo principal. |

### 8.1 Transacciones que no deben dividirse

| Operación | Unidad transaccional |
|---|---|
| Crear paciente | `User` + `StudentProfile` + asignación inicial cuando corresponda. |
| Reasignar terapeuta | Cerrar asignación previa + crear nueva + actualizar `assignedDoctorId`. |
| Crear cita | Comprobar disponibilidad final + persistir cita. |
| Reprogramar | Validar nuevo slot + conservar trazabilidad del cambio. |
| Completar cita | Cambio de estado + creación/validación de `ClinicalNote` según política. |
| Resolver alerta | Registrar `AlertAction` + actualizar estado/cierre. |

---

## 9. DTO, validaciones y convenciones de API

Los DTO deben impedir que el cliente envíe campos de auditoría, relaciones o estados que
correspondan al servidor. NestJS debe aplicar `ValidationPipe` global con `whitelist` y
`forbidNonWhitelisted` cuando sea compatible con la implementación actual.

| Dato | Validación |
|---|---|
| IDs | Enteros positivos; verificar existencia y alcance institucional. |
| Correo | Formato válido y unicidad según política de cuentas. |
| Rol | No aceptar valores arbitrarios fuera del enum `Role`. |
| Fecha/hora | ISO 8601; interpretar utilizando la zona horaria institucional. |
| Duración de sesión | Rango razonable y coherente con configuración del terapeuta. |
| `Appointment.status` | Cambios únicamente mediante transiciones permitidas. |
| `ClinicalNote` | `appointmentId` obligatorio y relación consistente con `studentId`/`doctorId`. |
| Asignación | `therapistId` debe ser `User` con `role=psychologist` de la misma institución. |
| `AlertAction` | Solo profesional autorizado sobre el paciente asociado. |
| Contenido compartido | No aceptar creación desde panel salvo caso explícitamente autorizado. |

### 9.1 Transiciones de Appointment

```text
Regla sugerida
pending     -> confirmed | cancelled | rescheduled
confirmed   -> completed | cancelled | rescheduled | no_show
completed   -> [estado terminal]
cancelled   -> [estado terminal]
no_show     -> [estado terminal]
rescheduled -> [estado terminal de la cita original]
```

### 9.2 Respuestas y paginación

Los listados de pacientes, citas, alertas y notas deben ser paginados. Se recomienda una estructura
consistente para facilitar el frontend.

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

## 10. Eventos y notificaciones

Aunque el sistema de notificaciones puede implementarse en una fase posterior, los servicios deben
emitir eventos de dominio o disponer de puntos claros de integración. Esto evita acoplar envío de
correo, WebSocket o push al mismo método que persiste la operación.

| Evento | Uso |
|---|---|
| `appointment.created` | Notificar al paciente/terapeuta según origen. |
| `appointment.rescheduled` | Notificar cambio de fecha. |
| `appointment.cancelled` | Notificar cancelación. |
| `alert.created` | Actualizar panel y notificar al terapeuta responsable. |
| `alert.reviewed` | Registrar seguimiento; opcionalmente informar al paciente. |
| `activity.assigned` | Notificar actividad nueva. |
| `therapist.assignment.changed` | Actualizar relaciones y acceso. |
| `shared_content.created` | Informar al terapeuta de nuevo contenido compartido. |

---

## 11. Consideraciones de rendimiento

- Agregar índices en claves foráneas utilizadas para filtros: `studentId`, `doctorId`/`therapistId`,
  `status`, `appointmentDate`, `createdAt`.
- Indexar `TherapistAssignment` por `studentId`, `therapistId`, `startsAt` y `endsAt`.
- Indexar `Appointment` por `doctorId` + `appointmentDate` y `studentId` + `appointmentDate`.
- Indexar `Alert` por `studentId` + `status` + `createdAt` y, si aplica, terapeuta scope derivado.
- Evitar N+1 en overview y dashboard; utilizar `include`/`select` controlados o consultas agregadas.
- Paginar historiales y series biométricas.
- No cargar campos `Text` extensos en listados cuando solo se necesita un resumen.
- Mantener las respuestas del dashboard compactas y orientadas a la vista.

---

## 12. Auditoría, privacidad y manejo de información clínica

La separación entre operación administrativa y contenido clínico debe reflejarse en la API. Un
administrador necesita gestionar cuentas y asignaciones, pero no debe recibir automáticamente
acceso a notas terapéuticas, antecedentes o contenido compartido.

| Evento sugerido | Cuándo registrar |
|---|---|
| `CLINICAL_RECORD_VIEWED` | Consulta de expediente clínico. |
| `CLINICAL_NOTE_CREATED` | Creación de nota de sesión. |
| `CLINICAL_NOTE_UPDATED` | Modificación posterior. |
| `ALERT_REVIEWED` | Primera revisión de alerta. |
| `ALERT_ACTION_CREATED` | Acción tomada sobre alerta. |
| `THERAPIST_ASSIGNED` | Asignación/reasignación. |
| `SHARED_CONTENT_VIEWED` | Consulta de contenido expresamente compartido. |
| `CONSENT_UPDATED` | Cambio relevante en consentimiento. |

> **Diario emocional.** El panel profesional no debe consumir `EmotionalJournal`. La existencia de
> ese modelo en el esquema actual no implica que deba exponerse mediante endpoints web. La
> integración clínica debe limitarse al contenido que el paciente comparta expresamente.

---

## 13. Plan de implementación por fases

| Fase | Entregable principal |
|---|---|
| Fase 1 · Base operativa | `TherapistAssignment`, `PsychologistProfile`, permisos por institución/asignación, endpoints de pacientes y terapeutas. |
| Fase 2 · Agenda | `TherapistSchedule`, excepciones, disponibilidad, extensión de `Appointment`, reprogramación y control de conflictos. |
| Fase 3 · Expediente clínico | `ClinicalRecord`, ampliación de `ClinicalNote`, restricciones de edición, auditoría clínica. |
| Fase 4 · Continuidad terapéutica | `TreatmentPlan`, `TreatmentGoal`, `Activity` y `StudentActivity`. |
| Fase 5 · Alertas y biometría | Ciclo de `Alert`, `AlertAction`, consultas de `BiometricRecord`, tendencias y panel de seguimiento. |
| Fase 6 · Contenido compartido | `SharedPatientContent` y reglas de acceso desde el panel. |
| Fase 7 · Dashboards | Overview, timeline, dashboard therapist/admin, optimización de consultas. |
| Fase 8 · Hardening | Pruebas de autorización, índices, auditoría, idempotencia y revisión de contratos OpenAPI. |

_(Nota: la numeración y el alcance final de fases usados por el equipo de backend viven en_
_[`GOALS.md`](./GOALS.md) _y pueden reordenar o fusionar lo anterior; esta tabla es la propuesta_
_original, no el plan ejecutado.)_

## 14. Criterios de aceptación

- Un administrador puede crear terapeutas y pacientes únicamente dentro de su institución.
- Un cambio de terapeuta conserva el historial y actualiza `assignedDoctorId` sin duplicar una
  asignación principal.
- El frontend puede obtener slots disponibles sin calcular horarios por su cuenta.
- El servidor rechaza una cita fuera de horario o que se solape con otra.
- Un terapeuta no puede consultar pacientes de otra institución ni pacientes no asignados, salvo
  autorización explícita.
- El expediente y las notas clínicas conservan trazabilidad y no se eliminan físicamente de forma
  ordinaria.
- Las alertas poseen ciclo de vida, prioridad e historial de acciones.
- El panel puede consultar biometría procesada por periodos sin depender de datos crudos de alta
  frecuencia.
- El panel no dispone de acceso al diario emocional privado.
- El contenido compartido por el paciente puede consultarse de forma diferenciada y auditada.
- Los dashboards y overview utilizan consultas agregadas y no requieren decenas de peticiones desde
  el frontend.
- La documentación OpenAPI/Swagger refleja DTO, respuestas, roles y errores relevantes.

---

## Anexo A. Matriz resumida de endpoints

| Módulo | Endpoints principales |
|---|---|
| Pacientes | `GET/POST /students` · `GET/PATCH /students/:id` · `GET /students/:id/overview` · `GET /students/:id/timeline` |
| Terapeutas | `GET/POST /psychologists` · `GET/PATCH /psychologists/:id` · `GET /psychologists/:id/students` |
| Asignaciones | `POST /therapist-assignments` · `GET /students/:id/therapist-assignments` · `PATCH /therapist-assignments/:id/end` |
| Horarios | `GET/POST /psychologists/:id/schedules` · `PATCH /schedules/:id` · `POST /psychologists/:id/schedule-exceptions` |
| Disponibilidad | `GET /psychologists/:id/availability` |
| Citas | `GET/POST /appointments` · `GET /appointments/:id` · confirm · reschedule · cancel · no-show · complete |
| Expediente | `GET/POST/PATCH /students/:id/clinical-record` |
| Notas | `POST /clinical-notes` · `GET/PATCH /clinical-notes/:id` · `GET /students/:id/clinical-notes` |
| Planes | `POST /treatment-plans` · `GET /students/:id/treatment-plans` · `PATCH /treatment-plans/:id` |
| Objetivos | `POST /treatment-plans/:id/goals` · `PATCH /treatment-goals/:id` |
| Actividades | `GET/POST /activities` · `POST/GET /students/:id/activities` · `PATCH /student-activities/:id` |
| Biometría | `GET /students/:id/biometrics` · latest · trends |
| Alertas | `GET /alerts` · `GET /alerts/:id` · review · actions · close · `GET /students/:id/alerts` |
| Compartido | `GET /students/:id/shared-content` · `GET /shared-content/:id` |
| Dashboards | `GET /dashboard/psychologist` · `GET /dashboard/administrator` |

## Anexo B. Recomendaciones de migración

- Crear primero las tablas nuevas sin eliminar columnas actuales.
- Poblar `TherapistAssignment` a partir de `StudentProfile.assignedDoctorId` para conservar el
  estado inicial.
- Mantener `assignedDoctorId` sincronizado durante la transición.
- Agregar valores nuevos a `AppointmentStatus` mediante una migración compatible.
- Añadir campos a `Alert` como opcionales inicialmente y ejecutar un backfill de `status` a partir
  de `resolved`.
- No eliminar `EmotionalJournal` durante esta fase si es utilizado por la app móvil; simplemente no
  exponerlo al panel y definir el nuevo contrato de contenido compartido.
- Agregar índices después del backfill y validar planes de ejecución sobre listados principales.
- Actualizar Swagger/OpenAPI y pruebas de integración en la misma entrega que cada endpoint.

## Anexo C. Notas de diseño clínico

El sistema debe favorecer la continuidad de atención sin convertir resultados algorítmicos en
decisiones clínicas automáticas. Los datos biométricos, inferencias de ECOS y alertas son insumos
de apoyo. El terapeuta conserva la responsabilidad de interpretar la información, documentar su
valoración y decidir el seguimiento correspondiente.

Las notas de sesión, antecedentes, impresiones clínicas y planes terapéuticos deben distinguirse de
los datos generados por el sistema. El backend debe conservar esta separación tanto en el modelo de
datos como en los permisos y en la representación del frontend.

**Resultado esperado.** Al completar estas fases, el servidor podrá sostener un panel clínico con
administración institucional, asignación histórica, agenda profesional, expediente, seguimiento
terapéutico, biometría, alertas, contenido compartido y auditoría, sin abandonar el esquema
`StudentProfile` que ya utiliza el proyecto.
