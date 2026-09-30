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

En Fase 5.2, **Resumen**, **Expediente** y **Sesiones** están disponibles para
psicología. `/patients/[id]/sessions` muestra únicamente metadata paginada de
las notas clínicas: fecha de atención, terapeuta, tipo, modalidad, estado de
anulación y metadata de cita. No descarga ni presenta cuerpos clínicos. La
ausencia de sesiones es un estado vacío válido; las rutas de nueva sesión y
detalle continúan fuera de alcance.

`/patients/[id]/clinical-record` consulta y mantiene exclusivamente el
expediente clínico longitudinal mediante los contratos explícitos de creación,
lectura y edición. La ausencia de expediente es un estado vacío válido después
de confirmar la visibilidad del paciente; no se trata como un error técnico.
La navegación conserva `appointments`,
`biometrics`, `alerts`, `treatment-plan`, `activities` y `shared-content`
como `future`; no tienen páginas, reglas de ruta ni enlaces visibles.
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
| Biometría reciente | `recentBiometricSummary` | `biometrics.view` | Sin datos biométricos recientes | Historial, tendencias y gestión de banda |
| Alertas abiertas | `openAlerts` | `alerts.view` | Sin alertas pendientes | Historial y resolución de alertas |
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

El listado aún no tiene búsqueda, filtros, selector de tamaño, paginación
interactiva ni estado de URL: backend no entrega filtros aprobados ni metadatos
confiables. Reasignaciones, sesiones, editor de planes, gráficas biométricas,
historial de alertas y módulos clínicos restantes siguen fuera de alcance.
