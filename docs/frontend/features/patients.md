# Patients Feature

## Terminología y rutas

El contrato HTTP conserva `StudentProfile`, `studentId` y `/students`; la
interfaz utiliza “Paciente” y “Pacientes”. Las rutas productivas son
`/patients`, `/patients/new`, `/patients/[id]` y `/patients/[id]/edit` dentro
del shell protegido.

## API, cache y hooks

`patientsApi` usa `ApiClient` para `GET /students`, `GET /students/:id`,
`POST /students`, `PATCH /students/:id` y `GET /students/:id/overview`.
Las listas solo reciben `skip` y `take`; todas las queries reenvían el
`AbortSignal` de TanStack Query.

Las keys son `patientKeys.all`, `lists()`, `list(params)`, `details()`,
`detail(id)`, `overviews()` y `overview(id)`. `usePatient(id)` consulta la
ficha administrativa y `usePatientOverview(id)` el endpoint clínico compuesto.
La ficha elige una única query por rol; no combina ambas ni realiza solicitudes
N+1.

Una edición invalida la ficha, las listas y el overview del paciente porque el
código institucional aparece en la cabecera. La creación invalida únicamente
las listas afectadas.

## Listado, formularios y avatar

El listado es una cuadrícula responsive de tarjetas con nombre, correo cuando
existe, código institucional y diagnóstico principal de `StudentResponseDto`.
No incorpora datos clínicos agregados, fotografías ni imágenes mock.

`PatientAvatar` centraliza el fallback visual de iniciales y la paleta muted
determinística por identificador. Es compartido por tarjetas y ficha; nombres
ausentes muestran `?` y “Nombre no registrado”.

`/patients/new` crea un paciente con nombre, correo, contraseña y código
opcional. `/patients/[id]/edit` solo modifica el código institucional. Zod
presenta errores locales; las respuestas de Nest sin campos tipados se muestran
como `FormError` general. La interfaz no permite borrar un código enviando un
valor vacío porque backend no define un contrato para `null`.

## Ficha principal y workspace — Fases 2.4 a 2.6

`/patients/[id]` cambia según el rol autenticado. Un administrador consulta
solo `GET /students/:id` y recibe identidad, correo, código institucional y
terapeuta si el contrato lo entrega. No recibe ni muestra diagnóstico,
biometría, alertas, citas, planes, actividades, notas o contenido compartido.

Un psicólogo consulta exclusivamente `GET /students/:id/overview`. El overview
seguro resume biometría, próxima cita, alertas, plan terapéutico, actividades,
seguimiento y contenido compartido en tarjetas responsive. Cada bloque está
protegido por su permiso de lectura. El contrato solo expone las proyecciones
necesarias: no incluye diagnóstico ni cuerpos de notas clínicas, análisis de
IA, respuestas de actividades o cuerpos de contenido compartido.

`PatientWorkspace` recibe ese contexto ya cargado y no ejecuta queries ni usa
Zustand. La cabecera reutiliza `PatientAvatar`, establece el breadcrumb desde
el nombre cargado y solo expone Editar bajo `patients.manage`. La navegación
contextual es `PatientSectionNav`: su configuración tipada centraliza etiqueta,
icono, permiso, estrategia de coincidencia, disponibilidad y helper de ruta.
La visibilidad siempre es `available && can(role, permission)`.

En Fases 5.2–5.5, **Resumen**, **Expediente** y **Sesiones** están disponibles para
psicología. Las fases 6.1–6.2 habilitan también **Biometría** y las fases 6.3–6.4
habilitan **Alertas** en `/patients/[id]/alerts` bajo `alerts.view`. `/patients/[id]/sessions` muestra únicamente metadata paginada de
las notas clínicas: fecha de atención, terapeuta, tipo, modalidad, estado de
anulación y metadata de cita. No descarga ni presenta cuerpos clínicos. La
ausencia de sesiones es un estado vacío válido. `/patients/[id]/sessions/new`
registra sesiones manuales o vinculadas a cita; `/patients/[id]/sessions/[noteId]`
presenta el detalle autorizado y mantiene Sesiones activa en la navegación.

La ruta de detalle obtiene su propio contexto mínimo de paciente junto con la
nota. Esto permite que el autor histórico consulte una nota tras una
reasignación sin ampliar el acceso general de ese psicólogo a la ficha u otras
secciones del Patient Workspace. Solo el autor puede editar y únicamente el
contenido profesional permitido; administradores no reciben acceso clínico.

`/patients/[id]/clinical-record` consulta y mantiene exclusivamente el
expediente clínico longitudinal mediante los contratos explícitos de creación,
lectura y edición. La ausencia de expediente es un estado vacío válido después
de confirmar la visibilidad del paciente; no se trata como un error técnico.
La navegación conserva `appointments`, `treatment-plan` y `shared-content`
como `future`; no tienen páginas, reglas de ruta ni enlaces visibles.
**Actividades** está disponible para psicología asignada en
`/patients/[id]/activities`: presenta historial paginado, filtro por estado y
asignación manual de actividades activas del catálogo institucional. No permite
crear actividades libres, modificar asignaciones ni marcar completitud. Su
detalle protegido en `/patients/[id]/activities/[assignmentId]` muestra de forma
exclusivamente de lectura el contenido vigente del catálogo y la respuesta
registrada cuando existe; no almacena una instantánea histórica del contenido.
**Biometría** presenta un resumen estable del último
registro sincronizado global, una tabla paginada minimizada y tendencias
descriptivas por rango predefinido. No afirma monitoreo en vivo, no muestra
umbrales, anomalías ni contenido clínico. **Alertas** muestra entidades `Alert`
persistidas y paginadas; su detalle calificado por paciente permite revisión y
cierre únicamente a psicología autorizada. No representa notificaciones ni
anomalías locales de la aplicación móvil.

## Activities Summary

The psychologist-only overview receives `activitiesSummary` from
`GET /students/:studentId/overview` in the same RLS-scoped request as its other
clinical summaries. It contains `totalCount`, `incompleteCount`, and at most
three recent incomplete assignments. Incomplete means persisted `pending` or
`in_progress`; recent assignments are ordered by `assignedAt DESC, id DESC`.
The overview never receives response text or activity instructions.

The card distinguishes no assignments from no incomplete assignments, uses the
central assignment status/origin labels, and links to history and assignment
detail through `patientRoutes`. It has no mutation controls. The legacy
`pendingActivities` response field remains available temporarily for API
compatibility, but Admin Web renders `activitiesSummary`.
`patientRoutes` es la única fuente de rutas internas para listado, creación,
edición, resumen, expediente y dichas convenciones. No existe aún
un `patients/[id]/layout.tsx`: con una única sección causaría complejidad y
riesgo de repetir queries sin aportar composición reutilizable.

La carga usa skeletons. Un 403 muestra `ForbiddenState` embebido, un 404 usa
Not Found y los demás errores muestran `ErrorState` con reintento. Las ausencias
de terapeuta, cita, plan o datos biométricos se expresan como estados neutrales.

## Overview Summary Blocks

| Bloque | Campo del overview | Permiso | Estado compacto | Detalle diferido |
| --- | --- | --- | --- | --- |
| Terapeuta actual | `currentTherapist` | `patients.view` | Sin terapeuta asignado | Historial y reasignación |
| Próxima cita | `nextAppointment` | `appointments.view` | Sin próxima cita programada | Agenda y gestión de citas |
| Biometría reciente | `recentBiometricSummary` | `biometrics.view` | Sin datos biométricos registrados | Historial y tendencias |
| Alertas | `alertsSummary` | `alerts.view` | Sin alertas abiertas | Historial, detalle, revisión y cierre de alertas |
| Plan activo | `activeTreatmentPlan` | `treatment-plans.view` | Sin plan terapéutico activo | Objetivos y edición del plan |
| Actividades pendientes | `pendingActivities` | `patient-activities.view` | Sin actividades pendientes | Catálogo e historial de actividades |
| Seguimiento reciente | `recentFollowUps` | `clinical-notes.view` | Aún no hay seguimiento reciente registrado | Resumen real de sesiones y notas completas |
| Contenido compartido | `recentSharedContent` | `shared-content.view` | Sin contenido compartido reciente | Biblioteca y detalle del contenido |

Los bloques clínicos se limitan a tres elementos recientes por contrato. Los
estados, prioridades, modalidades, tipos de cita y orígenes se traducen antes
de mostrarse; los enums técnicos no se presentan en la interfaz. Las citas y
fechas clínicas se formatean con `institutionTimezone`, proporcionada por el
overview y resuelta por el servidor desde la institución del paciente.

## Overview boundaries

El overview no contiene expediente completo, sesiones completas, cuerpos de
notas, biometría histórica, historial o resolución de alertas, edición de plan,
catálogo de actividades, diario emocional privado ni acciones de navegación a
módulos aún incompletos. `recentFollowUps` contiene metadata de seguimiento
(fecha, cita, tipo, estado y terapeuta), no el contenido clínico de una nota.
`EmotionalJournal` no se consulta desde `admin-web`.

## Integración de biometría y alertas — Fase 6.5

El mismo `GET /students/:id/overview` entrega una única proyección compacta.
`recentBiometricSummary` contiene solo frecuencia cardíaca promedio, índice de
estrés, oxígeno, identificador y `timestamp` del último registro sincronizado,
ordenado por timestamp, creación e identificador. El bloque muestra los
tres valores reales o “Sin dato” para una métrica nula; no presenta sueño,
temperatura, conexión de banda, monitoreo en vivo ni interpretación clínica.
El enlace **Ver biometría** abre `/patients/[id]/biometrics`.

`alertsSummary` contiene el conteo exacto de alertas no cerradas (`new`,
`reviewed` e `in_follow_up`) y hasta tres resúmenes recientes. Cada resumen
incluye únicamente tipo, prioridad, estado, fecha e identificador: no incluye
descripción ni contexto SOS. **Ver alertas** abre el historial y cada resumen
abre su detalle autorizado. `panic_button` conserva la etiqueta SOS y su origen
móvil verificado. El overview no permite revisar ni cerrar alertas.

## Permisos y límites

`RouteAccessBoundary` exige `patients.view` para la feature; RLS y Nest siguen
siendo la autoridad sobre el alcance efectivo. `patients.manage` protege crear,
editar y sus acciones visibles. El overview compuesto está guardado por backend
para `psychologist`; no se invoca desde la ficha administrativa.

Los administradores conservan operaciones institucionales sobre pacientes y
citas, pero no pueden leer ni modificar expedientes clínicos. El expediente
requiere `clinical-record.view` o `clinical-record.manage` en la interfaz y la
autorización efectiva de Nest y RLS. Un psicólogo no asignado recibe `404` para
no revelar la existencia del recurso. Las demás secciones clínicas futuras
seguirán requiriendo su permiso de frontend y la autorización efectiva de Nest
y RLS cuando cuenten con una ruta funcional.

El overview clínico permanece limitado a `psychologist` y al paciente asignado
por guardia de rol y RLS. En la matriz vigente, ese único rol autorizado posee
`biometrics.view` y `alerts.view`; los `PermissionGate` mantienen los bloques
ocultos cuando una capacidad no está disponible y no convierten falta de permiso
en un estado vacío.

El listado aún no tiene búsqueda, filtros, selector de tamaño, paginación
interactiva ni estado de URL: backend no entrega filtros aprobados ni metadatos
confiables. Reasignaciones, sesiones, editor de planes, gráficas biométricas,
historial de alertas y módulos clínicos restantes siguen fuera de alcance.
