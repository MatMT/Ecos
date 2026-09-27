# Patients Feature

## Terminología backend

El contrato HTTP conserva `StudentProfile`, `studentId` y `/students`.

## Terminología frontend

La interfaz utiliza “Paciente” y “Pacientes”. Los nombres de la feature siguen
la convención `patients` sin modificar endpoints ni DTO de Nest.

## Ruta

`/patients` compone `PatientsPage` dentro del shell protegido existente.

## Estructura

```text
features/patients/
├── api/patients.api.ts
├── api/patient.keys.ts
├── components/patient-card.tsx
├── components/patient-form.tsx
├── components/create-patient-page.tsx
├── components/edit-patient-page.tsx
├── components/patients-page.tsx
├── hooks/use-create-patient.ts
├── hooks/use-patient.ts
├── hooks/use-patients.ts
├── hooks/use-update-patient.ts
├── schemas/patient-form.schema.ts
├── types/patient.types.ts
├── utils/patient-form-errors.ts
├── utils/patient-form-mappers.ts
└── utils/patient-initials.ts
```

## API

`patientsApi.list(params, signal)` usa `ApiClient` para solicitar
`GET /students` con `skip` y `take`. La feature también usa contratos reales
para `POST /students`, `GET /students/:id` y `PATCH /students/:id`; no realiza
solicitudes por cada fila ni incluye delete, overview o reasignaciones.

## Query keys

`patientKeys.all`, `patientKeys.lists()`, `patientKeys.list(params)`,
`patientKeys.details()` y `patientKeys.detail(id)` son las keys implementadas.
Los parámetros se incluyen en la key para preparar cambios posteriores de lista
sin mezclar respuestas en caché.

## usePatients

`usePatients(params)` delega directamente a TanStack Query, utiliza la key del
dominio y reenvía su `AbortSignal` al adaptador API. No copia pacientes a estado
local ni renombra el resultado de `useQuery`.

`usePatient(id)` carga una ficha administrativa actual con `AbortSignal`.
`useCreatePatient()` invalida solo las listas tras una creación y
`useUpdatePatient(id)` invalida la ficha y las listas afectadas. Las páginas
deciden el toast y la navegación únicamente después del éxito.

## Permisos

La ruta sigue protegida por `RouteAccessBoundary` con `patients.view`.
Administradores y psicólogos consumen el mismo listado; Nest y RLS determinan
las filas autorizadas. `patients.manage` protege `/patients/new`,
`/patients/:id/edit`, el botón de creación y la acción Editar. Un psicólogo
puede abrir la ficha temporal desde Ver paciente, pero no recibe acciones ni
rutas administrativas.

## Create Patient

`/patients/new` usa `POST /students`. El formulario solicita nombre completo,
correo electrónico, contraseña inicial y código institucional opcional. Zod
valida nombre, correo y contraseña de al menos seis caracteres antes de que el
modelo se transforme a `CreatePatientInput`. Al crear, la feature invalida
`patientKeys.lists()`, muestra un toast de éxito y navega a `/patients`.

## Edit Patient

`/patients/:id/edit` carga `GET /students/:id`, no reutiliza una tarjeta como
fuente de valores y envía `PATCH /students/:id`. El único campo expuesto es el
código institucional. Un 404 usa la página Not Found y un 403 se representa con
`ForbiddenState`; otros errores de carga muestran `ErrorState` con retry.

El mismo `PatientForm` se reutiliza en ambos modos. La edición invalida
`patientKeys.detail(id)` y `patientKeys.lists()` antes de volver al listado.

## Campos y límites administrativos

Aunque el DTO de Nest también permite `primaryDiagnosis`, la interfaz no lo
presenta por tratarse de información clínica. La creación tampoco ofrece
`assignedDoctorId`: un paciente puede crearse sin terapeuta y la asignación se
reserva para el módulo correspondiente. La edición no cambia identidad, correo,
contraseña, diagnóstico ni terapeuta.

Un código vacío se omite del DTO. El backend no declara un contrato para borrar
el código con `null`, por lo que esta fase no ofrece esa operación.

Los errores locales de Zod aparecen junto al campo. Nest no entrega códigos de
campo estables, de modo que sus errores 400, 409, 422, red y 5xx se conservan en
el formulario como `FormError` general; no se infieren campos desde texto libre.

## Tarjetas y avatares

El listado es una cuadrícula responsive de tarjetas. Cada tarjeta muestra
únicamente nombre, correo cuando existe, código institucional y diagnóstico
principal de `StudentResponseDto`. No es una acción ni enlaza al detalle, que
permanece fuera del alcance hasta la Fase 2.4.

Las fotografías mock no se usan en el listado productivo. Como el proyecto no
dispone de un primitivo `Avatar`, `PatientCard` presenta un fallback visual con
iniciales de la primera y última palabra del nombre. La paleta muted se obtiene
determinísticamente del identificador del paciente; no se guarda en backend ni
cambia entre renders. Un nombre ausente usa `?`, mientras que su etiqueta de
texto visible continúa siendo “Nombre no registrado”.

## Carga, error y vacío

La primera carga usa skeletons con la geometría de las tarjetas. Un 403 muestra
`ForbiddenState` embebido; otros fallos usan `ErrorState` con retry; una
respuesta exitosa vacía usa `EmptyState`. Un refresco en segundo plano conserva
las tarjetas visibles.

## Limitaciones actuales

El servidor solo acepta `skip` y `take` y no devuelve total ni metadatos. No se
implementan búsqueda, filtros, selector de tamaño, paginación interactiva ni
estado del listado en URL. Tampoco se implementan creación, edición,
reasignación, detalle ni overview. Las tarjetas muestran únicamente nombre,
correo, código y diagnóstico disponibles en `StudentResponseDto`.

## Próximo paso

Una fase posterior incorporará búsqueda backend-side, filtros, paginación y
estado en URL cuando el backend acepte los parámetros aprobados y devuelva
metadatos confiables de paginación.
