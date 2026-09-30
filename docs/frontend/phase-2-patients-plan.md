# ECOS Admin Web — Phase 2 Patients Plan

## 1. Scope

Phase 2.0 prepares the patient module without implementing its functional
screens. Backend terminology remains `StudentProfile`, `studentId` and
`/students`; all interface text uses “Paciente” and “Pacientes”. The phase does
not modify `server`, Prisma, Supabase, migrations or existing backend contracts.

The reduced Phase 1 preflight now passes typecheck and production build. Lint
exits successfully with three existing `no-img-element` warnings in the two
mockups and the login illustration. Login, session restoration, role behavior
and theme still require manual verification against a running authorized
environment; no credentials are stored in this repository.

## 2. Existing mockups

| Route | Route composition | Mockup | Current data |
| --- | --- | --- | --- |
| `/patients` | `app/(dashboard)/patients/page.tsx` | `features/patients/components/patients-page.tsx` | `GET /students?skip=0&take=20` |
| `/patients/[id]` | `app/(dashboard)/patients/[id]/page.tsx` | `app/views/PatientDetail.tsx` | Typed design fixture in `app/data/mockData.ts` |

The former list mockup contained local search and status controls, responsive
patient cards, simulated biometric and AI summaries, next-session text and an
unconnected create dialog. Phase 2.1 replaced its product flow with a
contract-backed table. Phase 2.2 restores the card hierarchy with only the
available identity, code and diagnosis fields plus deterministic initial-based
avatars; it does not transfer any simulated clinical content. The detail mockup
retains the patient header, metric cards, Recharts trends, AI panel and
expandable session history.

Both use the existing shadcn primitives, Lucide and semantic light/dark tokens.
The list grid adapts from one to two and three columns; the detail uses two
metric columns on small screens and four at `lg`. The detail's session content
and fixed two-column inner grid require a responsive review when it is split
into real summary components.

Accessibility observations: the list search relies on its placeholder rather
than an accessible label, the simulated creation controls are not a form, and
the Recharts visualizations have no textual summary. Card navigation uses real
buttons and profile images have alternative text. These items are addressed as
their simulated controls become functional; no clinical history accessibility
surface is added in this phase.

The mockups are design references and remain available until their data
consumers are replaced. The fixture is not a clinical source of truth and must
not be imported by future feature code.

## 3. Backend contracts

`ApiClient` already applies `/api/v1`; frontend adapters therefore use the
relative paths below.

| Method and path | Contract | Access observed |
| --- | --- | --- |
| `GET /students?skip=&take=` | `StudentResponseDto[]` | Authenticated; RLS scopes psychologists to assigned patients and administrators to their institution. |
| `GET /students/:id` | `StudentResponseDto` | Authenticated; RLS-scoped. |
| `POST /students` | `CreateStudentDto` → `StudentResponseDto` | `administrator`. |
| `PATCH /students/:id` | `UpdateStudentDto` → `StudentResponseDto` | No controller role guard; RLS is authoritative. UI remains limited to `patients.manage`. |
| `GET /students/:studentId/overview` | `StudentOverviewResponseDto` | `psychologist` only. |

`StudentResponseDto` provides `id`, `userId`, `studentCode`,
`primaryDiagnosis`, `assignedDoctorId`, timestamps and a nested user with
identity, email, role and institution identifier.

`CreateStudentDto` requires `fullName`, `email` and a password of at least six
characters. It optionally accepts `studentCode`, `primaryDiagnosis` and
`assignedDoctorId` (UUID). Expected errors include 400 validation or therapist
assignment failure, 403 and 409 email conflict. `UpdateStudentDto` only permits
optional `studentCode` and `primaryDiagnosis`; it can return 404 when the
profile is not visible.

## 4. List response

The actual list response is a direct JSON array of `StudentResponseDto`, not an
envelope. It provides no `meta`, `total`, total pages or next cursor. The
backend defaults to `skip=0` and `take=20`, and clamps `take` to 100.

## 5. Filters and pagination

The only supported list parameters are numeric `skip` and `take`; pagination is
offset-based. No backend `page`, `pageSize`, `search`, `status`, `therapistId`
or institution parameter exists. Institution and psychologist assignment scope
are determined by server-side RLS, never by the browser.

Fase 2.1 may load a bounded initial slice, but complete `DataTable`
pagination, page totals and global filtering remain blocked until backend
returns metadata and approved filters. The frontend will not invent totals or
filter the current slice as if it represented all patients.

## 6. Patient overview response

`StudentOverviewResponseDto` returns, in one request, minimal student identity,
institution timezone, current therapist (including specialty when available),
next appointment, active treatment plan, most recent biometric summary, open
alerts, pending activities, recent follow-up metadata and recent shared-content
metadata. The service limits each recent collection to three items. It omits
diagnosis and sensitive clinical bodies, including note observations and shared
content bodies.

For a psychologist, the future overview can show header information plus safe
summary counts or compact blocks for available aggregates. It must not become a
complete clinical record, detailed biometrics, timeline, plan editor or session
history. Weekly trends, profile image, age, gender, phone, device state, AI
interpretation and a patient status label are not part of this response.

For an administrator, `/patients/[id]` will use `GET /students/:id` for a
non-clinical administrative header. The aggregate overview remains unavailable
until backend authorizes an administrator contract.

## 7. Missing backend requirements

The concrete gaps are recorded in `backend-debt.md`: list metadata and approved
filters; one-request list summaries when product requires them; and an
administrator overview contract. No frontend N+1 strategy, local scope check or
synthetic clinical status will be used as a workaround.

## 8. Permissions

The existing visual matrix gives both `administrator` and `psychologist`
`patients.view`; only `administrator` receives `patients.manage`. The single
`/patients` route remains shared and `RouteAccessBoundary` already protects it.
`PermissionGate` will hide create and edit actions for psychologists.

Nest and RLS remain authoritative. The frontend does not calculate assigned
patients. Create is explicitly administrator-only; the controller-level update
rule is not equally explicit, so the UI will retain the stricter local
`patients.manage` policy until backend documents a different product rule.

## 9. Proposed feature structure

No empty directories are created in Phase 2.0. Beginning in Phase 2.1, the
feature will grow only with real content:

```text
features/patients/
├── api/
│   ├── patients.api.ts
│   └── patient.keys.ts
├── components/
├── hooks/
└── types/
```

Schemas are added only with the create/edit form in Phase 2.3. Small mapping
utilities are added only if the list or overview needs repeated, contract-backed
presentation transforms.

## 10. Query keys

The domain key factory will use numeric student-profile identifiers and stable
serializable list input:

```ts
patientKeys.all
patientKeys.lists()
patientKeys.list({ skip, take })
patientKeys.details()
patientKeys.detail(id)
patientKeys.overviews()
patientKeys.overview(id)
```

`search`, `status` and `therapistId` are intentionally absent until supported
by backend. Query functions forward TanStack Query's `AbortSignal` to
`ApiClient`.

## 11. Routes

`/patients` and `/patients/[id]` are retained. `/patients/new` and
`/patients/[id]/edit` are deferred to Phase 2.3 and only added with working
screens, route permissions and visual `patients.manage` gating. No clinical,
session, biometric, alert, plan or activity child routes are created here.

The detail feature will set `useDashboardBreadcrumbLabel(fullName)` from the
patient data it already loaded, replacing the existing “Detalle” fallback
without a second request.

## 12. Mock data migration

The fixture is category B and now belongs only to the existing detail mockup.
Phase 2.1 has removed it from the list, which displays only
`StudentResponseDto` fields. In Phase 2.4, the detail stops reading it and
consumes the detail or psychologist overview query.

Once neither view imports it, the fixture is removed. Simulated metrics, AI
status, next-session text, photos and session histories are never merged into
feature types or production UI as factual data.

## 13. Components to reuse

Use `PageHeader`, `FilterBar`, `DataTable`, `EmptyState`, `ErrorState`,
`ForbiddenState`, `StatusBadge`, `Skeleton`, `ConfirmDialog`, `FormSection`,
`PermissionGate`, `useSession`, `ApiClient`, TanStack Query and Sonner according
to their Phase 1 responsibilities. No patient-specific duplicates of these
patterns will be created.

## 14. Domain components expected

Future components are `PatientsPage`, `PatientOverviewPage`, `PatientHeader`,
`PatientListColumns` and compact overview summary blocks. These will preserve
the present header, filter and visual hierarchy while omitting unsupported mock
metrics. Detailed charts, clinical note content, full history and AI analysis
belong to later modules, not this feature's overview.

## 15. Implementation subphases

1. **2.1:** Create shared patient contracts, API adapter, keys, query and basic
   list state handling from the actual list response.
2. **2.2:** Replace the basic table with contract-backed patient cards and
   initial-based avatars. URL-backed filters and complete server pagination
   remain blocked until the corresponding backend debt is resolved.
3. **2.3:** Implement administrator-only create and edit routes from the
   confirmed student DTOs. Creation registers identity, initial password and
   optional institutional code; editing is restricted to the institutional code.
   Diagnosis, therapist assignment and identity changes remain outside this
   administrative form.
4. **2.4:** Implement psychologist overview and administrator administrative
   detail, including dynamic breadcrumbs.
5. **2.5:** Extract compact, contract-backed overview blocks.
6. **2.6:** Implement the patient workspace without a nested layout. Summary
   is its only available contextual section; `PatientWorkspace`,
   `PatientSectionNav`, `patientNavigation` and `patientRoutes` centralize the
   loaded identity context, visible navigation and documented future route
   conventions. The RLS migration
   `20260930120000_restrict_administrative_clinical_reads` aligns alert, band
   and biometric reads with the clinical separation: owner and assigned
   psychologist only, while administrative patient and appointment operations
   remain available.
7. **2.7:** Run integration, accessibility, responsive, permission and error
   handling QA.

## 16. Parallel work proposal

William owns the initial shared contracts (`patients.api.ts`, `patient.keys.ts`
and patient types), then the list, filters/pagination and create/edit work.
Martín begins overview layout and contract-independent presentation components
only after the shared contracts are merged, then handles detail navigation.
Both own final integration and QA.

## 17. Risks

- The temporary fixture is required only while the mockups remain mounted; it
  must be removed once neither production view imports it.
- The list API cannot support accurate total pagination or server-side filters.
- Administrator access to the clinical overview lacks a backend contract.
- `PATCH /students/:id` does not provide a null-clearing contract for
  `studentCode`, nor typed server error fields for form controls.
- The existing mockups contain clinical simulated data unavailable in list and
  detail contracts; preserving their exact content would misrepresent data.
- Three existing `no-img-element` lint warnings remain in mockup/login imagery.
- Manual authenticated validation requires a running server and authorized test
  accounts; no credentials are embedded in the frontend.

## Fase 2.4 implementada

`/patients/[id]` selecciona una vista por rol sin ejecutar consultas paralelas:
el administrador usa `GET /students/:id` para una ficha institucional no
clínica y el psicólogo usa `GET /students/:id/overview` para el resumen clínico
compuesto. La cabecera comparte avatar por iniciales, nombre, correo, código y
terapeuta, establece el breadcrumb dinámico y solo muestra Editar para
`patients.manage`.

El overview reutiliza tarjetas del sistema de diseño para biometría, próxima
cita, alertas, plan, actividades, seguimiento y contenido compartido. No incorpora
fotografías, IA, gráficas, detalles de expediente ni navegación hacia módulos
sin una ruta funcional. El contenido textual de notas clínicas y recursos
compartidos no se renderiza. Los bloques clínicos se someten a sus permisos y
los estados 403, 404, error recuperable, carga y ausencia de datos tienen una
representación explícita.

## Contrato seguro del overview implementado

`GET /students/:id/overview` conserva su URL y exclusividad para `psychologist`,
pero ahora responde una proyección mínima construida con `select` acotados. El
servidor entrega `institutionTimezone`, título de actividad y metadata de
seguimiento como `recentFollowUps`; no entrega diagnóstico, cuerpos clínicos,
análisis de IA, respuestas de actividades ni el cuerpo del contenido compartido.
Las listas de alertas, actividades, seguimiento y contenido compartido se
limitan a tres registros. La ficha administrativa permanece en `GET /students/:id`.
