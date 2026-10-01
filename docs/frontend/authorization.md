# ECOS Admin Web — Authorization

## Principio

La autorización visual mejora la experiencia del portal, pero no sustituye Nest ni RLS. El frontend deriva permisos generales de la sesión; Nest decide siempre el acceso real por rol, institución, asignación y propiedad del recurso.

## Roles y sesión

Los valores reales son `administrator`, `psychologist` y `student`. `UserRole` de `features/auth` es la única fuente frontend para ese contrato. La sesión `["auth", "session"]` contiene el rol e `institutionId`; no existe una query, almacenamiento ni endpoint adicional para permisos.

`administrator` y `psychologist` pueden usar el portal. Un `student` conserva su sesión válida, pero se dirige a `/403` y no recibe el shell de `(dashboard)`.

## Permissions y matriz

Los permisos siguen `resource.action` y son un tipo cerrado en `src/lib/permissions`.

| Área | administrator | psychologist |
| --- | --- | --- |
| Dashboard, pacientes y citas | Ver; administrar pacientes y citas | Ver pacientes asignados y administrar citas autorizadas |
| Operación institucional | Terapeutas, asignaciones, horarios, usuarios y catálogo de actividades | Sin acceso |
| Clínica | Sin expediente, notas, planes, alertas, biometría ni contenido compartido | Expediente, notas, planes, actividades de pacientes, alertas, biometría y contenido compartido |
| Catálogo de actividades | Ver y administrar | Solo ver |

La matriz es una política de interfaz. No transforma un permiso general de `patients.view` en autorización sobre un paciente concreto.

## Uso

`can(role, permission)` es una función pura, tipada y fail-closed. Roles nulos, `student` y valores desconocidos devuelven `false`.

`usePermission(permission)` deriva el resultado de `useSession()` sin realizar solicitudes. `PermissionGate` renderiza su contenido solo cuando el permiso existe; sin `fallback`, oculta la acción. Los controles se deshabilitan únicamente por estado temporal del recurso, no por ausencia de permiso.

## Rutas y errores

`RouteAccessBoundary` protege todo `(dashboard)` después de `AuthBoundary`. La configuración central asigna un permiso a cada prefijo de área y deniega rutas del portal no registradas. Las rutas actuales `/dashboard` y `/patients` son compartidas; las rutas futuras deben registrarse junto con su módulo.

Un 401 representa sesión inválida y finaliza la sesión según Fase 1.6. Un 403 conserva tokens y caché. Las rutas completas denegadas muestran `/403`; una feature que reciba `ApiError` con estado 403 debe preferir `ForbiddenState` dentro de su propio contexto cuando la navegación perdería información útil. Un 404 no se interpreta como permiso, pues Nest puede usarlo para no revelar recursos.

## Institución, asignación y cambios de rol

El frontend no compara instituciones ni mantiene listas locales de pacientes permitidos como defensa. Nest y RLS validan institución, asignación terapéutica, propiedad y estado de cada operación.

Las notas clínicas conservan continuidad de lectura para el autor original y
el psicólogo actualmente asignado. La ruta de detalle calificada por paciente
recibe una proyección mínima y RLS-validada para su propia nota; esta excepción
no concede al autor histórico acceso general a la ficha, overview ni otras
secciones del paciente. La edición continúa limitada al autor y a
`clinical-notes.manage`; la interfaz solo oculta la acción, nunca sustituye la
validación del servidor.

El overview clínico del paciente exige el rol `psychologist` y el alcance de
asignación vigente mediante RLS. Administradores no reciben esta proyección.
En la matriz actual, los psicólogos autorizados poseen `biometrics.view` y
`alerts.view`; los bloques siguen protegidos en la interfaz y el servidor no
expone el overview clínico a roles que carecen de ambos ámbitos.

La separación clínica es también efectiva en datos: RLS limita alertas, bandas
y biometría al estudiante propietario o al psicólogo actualmente asignado. Un
administrador conserva el listado, la ficha institucional y las operaciones de
citas autorizadas, pero no puede recuperar esos recursos clínicos directamente.

El historial de alertas por paciente aplica esta misma política: la guardia del
endpoint permite solamente `psychologist` o `student`, por lo que un
administrador recibe `403`; un psicólogo sin acceso a `StudentProfile` recibe
`404` antes de que se consulte cualquier alerta. El portal administra únicamente
la experiencia visual mediante `alerts.view`.

El detalle clínico de alerta del portal usa `GET /students/:studentId/alerts/:alertId`
y admite solo `psychologist`; el administrador recibe `403`. La ruta comprueba
la relación paciente-alerta y la visibilidad RLS, por lo que un psicólogo sin
asignación vigente, una alerta inexistente o una relación no coincidente reciben
`404`. `alerts.manage` únicamente habilita la experiencia de revisión/cierre;
los endpoints mantienen guardia de rol, RLS y validación de transición como
autoridad final.

No hay polling de roles. Cuando la sesión se reconstruya, la matriz tomará el rol actualizado; logout limpia la caché y elimina inmediatamente los permisos efectivos del usuario anterior.

## Añadir un permiso

1. Confirmar el contrato y la autorización efectiva de Nest.
2. Añadir el permiso cerrado y su asignación de rol en `src/lib/permissions`.
3. Registrar la ruta si protege un área completa.
4. Usar `usePermission` o `PermissionGate` en acciones visuales.
5. Documentar cualquier diferencia entre la UX y la protección de Nest en `backend-debt.md`.
