# 🛡️ Plan de Implementación: Fase 8 (Hardening y Seguridad Frontend)

## [Goal Description]
El objetivo de la **Fase 8 (Hardening)** es asegurar, pulir y estabilizar la plataforma frontend (`admin-web`). Acorde a la guía de arquitectura (`docs/clinical-panel/technical-guide.md`), esta fase se centra en validaciones de autorización, auditoría visual, y revisión estricta de contratos con la API.

**Nota sobre el estado actual:**
Tras revisar los recientes commits (incluyendo la incorporación de la Fase 5: `clinical-record` y `sessions`), el proyecto **SÍ está listo** para recibir una fase de estabilización. 
Aunque faltan algunos módulos (como Alertas, Dashboards y Planes de Tratamiento), aplicar "Hardening" ahora es una excelente decisión arquitectónica para evitar que los módulos actuales (Pacientes, Terapeutas, Citas, y Expedientes) acumulen deuda técnica o vulnerabilidades de acceso.

---

## User Review Required
> [!WARNING] Salto de Módulos (Fases 6 y 7)
> Al proceder con la Fase 8, estamos posponiendo temporalmente la creación de las pantallas de **Contenido Compartido (Fase 6)** y los **Dashboards analíticos (Fase 7)**. Si tu intención es asegurar el núcleo operativo de la clínica antes de añadir estadísticas, podemos continuar sin problema.

> [!IMPORTANT] Control de Roles
> Asumimos que los únicos roles interactuando con el `admin-web` actualmente son `administrator` y `psychologist`. Cualquier otro rol (como `student`) debe ser expulsado inmediatamente a la pantalla de login.

## Open Questions
- ¿Deseas que implementemos bloqueos a nivel de *Middleware* de Next.js para que las páginas protegidas ni siquiera carguen si el usuario no tiene permisos? ¿O es suficiente con ocultar las opciones en la UI y mostrar una pantalla de "Acceso Denegado"?
- ¿Quieres que incluyamos una auditoría de rendimiento (ej. reemplazar los listados grandes por paginación infinita o tablas con cursores)?

---

## Proposed Changes (Subfases)

### Subfase 8.1: Role-Based Access Control (RBAC UI)
Implementación de barreras de acceso en la interfaz para separar lo que puede hacer un Administrador vs. un Terapeuta.
#### [NEW] `src/components/auth/RoleGuard.tsx`
Componente que envuelve secciones de la UI y las renderiza solo si el token pertenece a los roles permitidos.
#### [MODIFY] `src/lib/navigation/dashboard-navigation.ts`
Filtro de las rutas de navegación (Ocultar `Terapeutas` y `Asignaciones` a los psicólogos).
#### [NEW] `src/app/(dashboard)/forbidden/page.tsx`
Pantalla amigable de error 403.

---

### Subfase 8.2: Endurecimiento de Formularios e Idempotencia
Evitar múltiples envíos accidentales y normalizar las notificaciones de éxito/error.
#### [MODIFY] `src/features/appointments/components/CreateAppointmentModal.tsx`
#### [MODIFY] `src/features/sessions/components/session-form.tsx`
Asegurar que los botones de envío se deshabiliten (`disabled`) estrictamente durante mutaciones (`isPending`), y revisar la validación en Zod para que no explote si el backend manda un 400 inesperado.

---

### Subfase 8.3: Intercepción Global de Errores y Expiración de Sesión
Manejo de estados límite de la API (Tokens vencidos, caídas del servidor).
#### [NEW] `src/app/(dashboard)/error.tsx`
*Error Boundary* de Next.js para atrapar fallos de renderizado y mostrar un botón de "Reintentar".
#### [NEW] `src/app/(dashboard)/not-found.tsx`
Página 404 corporativa y consistente con el diseño.
#### [MODIFY] `src/lib/api/client.ts`
Ajustar los interceptores de Axios/Fetch para que un `401 Unauthorized` destruya las cookies locales y mande al usuario directo al login sin dejarlo interactuar con la caché vieja.

---

### Subfase 8.4: Revisión Estricta de Contratos (OpenAPI)
Auditar los tipos de TypeScript contra las últimas modificaciones del backend (especialmente tras los cambios de la Fase 5).
#### [MODIFY] `src/features/patients/dto/patient.dto.ts`
#### [MODIFY] `src/features/therapists/dto/therapists.dto.ts`
Eliminación de variables no usadas, `any` accidentales, y alineación de los límites de paginación globales (ej. no volver a mandar `take: 500`).

---

## Verification Plan

### Automated Tests
1. Correr `pnpm typecheck` en el espacio de trabajo `admin-web` para garantizar que no hay discrepancias de contratos.
2. Correr `pnpm lint` para verificar limpieza de código.

### Manual Verification
1. **Auditoría de Roles:** Iniciar sesión con un usuario `psychologist`, verificar que las pestañas administrativas desaparecen y que tratar de forzar la URL `/therapists` redirige a la página `Forbidden`.
2. **Expiración de Sesión:** Borrar la cookie de Auth manualmente en DevTools y hacer clic en cualquier lugar. El usuario debe ser expulsado al login.
3. **Idempotencia:** Hacer doble clic rapidísimo en "Guardar" al crear una cita o sesión clínica y verificar que en la pestaña *Network* solo se dispara 1 petición a la API.
