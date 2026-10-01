# ECOS Admin Web — Authentication

## Contrato backend

`admin-web` se comunica únicamente con Nest mediante el ApiClient.

- `POST /api/v1/auth/login`: recibe `{ email, password }` y devuelve un access token, refresh token rotativo y `user.id`.
- `POST /api/v1/auth/refresh`: recibe `{ refreshToken }`, rota el par de tokens y devuelve `user.id`.
- `GET /api/v1/users/:id`: con Bearer token y el identificador recién entregado por Nest, devuelve el perfil propio con `fullName`, `email`, `role` e `institutionId` bajo RLS.
- `POST /api/v1/auth/logout`: con Bearer token, invalida las sesiones remotas y responde 204.

No existe `GET /auth/me`. La combinación `refresh → users/:id` es el mecanismo actual para reconstruir una sesión sin decodificar JWT ni consultar Supabase directamente.

## Estrategia y ciclo de sesión

Nest usa access token Bearer y refresh token rotativo, no cookies HttpOnly. El par de tokens se conserva de forma atómica en `sessionStorage` bajo `ecos-admin-auth-tokens`; no se persisten el usuario, el rol, la institución ni datos clínicos.

Después de login se consulta el perfil propio y se guarda solamente en la query `["auth", "session"]`. Tras recargar, la query rota el refresh token y vuelve a consultar el perfil. El refresh es single-flight y una solicitud autenticada recibe un único reintento después de renovar el token.

`sessionStorage` evita conservar tokens al cerrar el navegador, pero continúa expuesto a XSS. La aplicación no utiliza `localStorage` para credenciales y deberá migrar a cookies HttpOnly si el backend ofrece ese mecanismo.

## Estructura frontend

`src/features/auth` contiene los contratos, almacenamiento de tokens, API, hooks, schema y componentes de autenticación. `AuthSessionProvider` registra la estrategia genérica en el ApiClient y centraliza la finalización de sesión; no almacena el usuario en Context.

`useSession` es la única fuente de sesión del frontend y usa TanStack Query. Sus estados distinguen carga, autenticación, ausencia de sesión y error temporal.

## Rutas protegidas

`(dashboard)` se envuelve completamente en `AuthBoundary`. Mientras se verifica la sesión muestra un skeleton y no renderiza el shell. Una sesión ausente redirige a `/login`, con un `returnTo` interno validado cuando corresponde. La autorización por rol y ruta se resuelve después mediante `RouteAccessBoundary`.

No se usa middleware: los tokens están en `sessionStorage` y no pueden verificarse de forma confiable desde Edge ni Server Components. `/login` redirige solamente cuando una sesión de portal ya fue confirmada.

Los roles `administrator` y `psychologist` pueden acceder al portal según su matriz de permisos. Un `student`, un rol nulo o un rol desconocido no recibe el shell y se dirige a `/403`; una sesión válida no se elimina por esa denegación.

## 401, 403 y logout

Un 401 en una solicitud autenticada intenta un refresh una sola vez. Si este falla con 401, `AuthSessionProvider` elimina tokens, limpia `queryClient` y redirige una vez a `/login`. Un error de red o 5xx durante la resolución de sesión muestra un estado recuperable y no cierra la sesión.

Un 403 indica una sesión válida sin autorización; no limpia tokens ni caché. Las rutas completas usan `/403` y las features podrán mostrar una denegación dentro de su propio contexto con `PermissionGate` o `ForbiddenState`.

Logout llama a Nest cuando es posible y, aun si falla esa llamada, elimina tokens y ejecuta `queryClient.clear()` para impedir que una sesión posterior vea datos del usuario anterior.

## Checklist manual

- Login válido: perfil confirmado y navegación a `/dashboard`.
- Recarga: refresh rotativo y perfil propio reconstruyen la sesión.
- Logout y cambio de usuario: no permanecen queries del usuario anterior.
- Dashboard sin sesión: no muestra shell y redirige a `/login`.
- Credenciales inválidas: mensaje neutral y sin navegación.
- Error de red durante resolución: estado recuperable, sin logout.
- Sesión expirada: una sola limpieza y redirección.
- 403: no finaliza la sesión.
