# Arquitectura interna de `admin-web`

## Principios

- Usar Next.js App Router como punto de composición de rutas y layouts.
- Organizar la lógica de producto por dominio cuando el dominio exista.
- Mantener los componentes de presentación, la lógica de datos y los contratos de red separados.
- Consumir exclusivamente la API HTTP de Nest. El navegador no accede a Prisma, PostgreSQL ni Supabase.
- Crear directorios y abstracciones solo cuando tengan contenido y una responsabilidad concreta.

## Grupos de rutas

`src/app/(dashboard)` contiene las rutas del portal. `AuthBoundary` resuelve autenticación y `RouteAccessBoundary` decide el acceso visual por permiso antes de renderizar el shell.

`src/app/(auth)` contiene rutas públicas de autenticación, actualmente `/login`. Los route groups no modifican la URL pública.

## Estructura actual

```text
src/
├── app/
│   ├── (dashboard)/
│   ├── (auth)/login/
│   ├── data/mockData.ts
│   └── views/
├── components/
│   ├── common/
│   │   ├── ConfirmDialog.tsx
│   │   ├── DataTable.tsx
│   │   ├── DashboardShell.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardBreadcrumbs.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── FormError.tsx
│   │   ├── FilterBar.tsx
│   │   ├── FormSection.tsx
│   │   ├── ForbiddenState.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/              # Primitivas visuales de shadcn/ui
└── lib/
    ├── api/             # Cliente HTTP de Nest
    ├── forms/           # Helpers de errores de formulario
    ├── navigation/      # Configuración y helpers del shell
    ├── permissions/     # Matriz y utilidades puras de autorización
    ├── query/           # TanStack Query y su provider
    └── utils.ts
```

Las vistas y datos simulados existentes son provisionales. No se trasladan hasta que el dominio correspondiente tenga integración de datos real.

El shell protegido vive en `app/(dashboard)/layout.tsx`. El layout compone los
boundaries de sesión y acceso, mientras `components/common/DashboardShell.tsx`
contiene únicamente la interacción de navegación, breadcrumbs y cuenta. La
configuración tipada de navegación vive en `lib/navigation`; cada entrada se
filtra mediante la matriz de permisos existente y no sustituye la validación de
rutas.

Los patrones comunes de vista viven en `components/common`: reciben datos,
callbacks o composición desde la feature, pero no conocen endpoints ni dominio.
`DataTable` recibe la paginación externamente; `ConfirmDialog` nunca ejecuta
HTTP; los estados de carga, vacío, error y denegación se muestran de forma
explícita. La guía operativa está en `docs/frontend/developer-page-guide.md`.
`app/(dashboard)/error.tsx` contiene el boundary de errores inesperados del
portal; los errores esperados de una query o mutation se resuelven en su feature.

## Estructura objetivo

```text
src/
├── app/                 # Rutas, layouts y composición
│   ├── (auth)/          # Rutas públicas futuras
│   └── (dashboard)/     # Portal protegido futuro
├── components/
│   ├── common/          # Shell y componentes transversales
│   └── ui/              # Primitivas visuales sin dependencia de dominio
├── features/
│   ├── auth/            # Login, sesión y contratos de autenticación
│   ├── patients/
│   ├── therapists/
│   ├── appointments/
│   ├── clinical/
│   ├── treatment-plans/
│   ├── activities/
│   ├── alerts/
│   └── biometrics/
├── hooks/               # Hooks reutilizables no propietarios de un dominio
├── lib/
│   ├── api/             # Cliente HTTP central; adaptadores viven en features
│   ├── forms/           # Utilidades transversales de formulario
│   ├── navigation/      # Configuración tipada del dashboard shell
│   ├── permissions/     # Matriz, rutas y utilidades puras de autorización
│   ├── query/           # QueryClient y provider de TanStack Query
│   └── utils/           # Utilidades puras transversales
├── schemas/             # Esquemas de validación compartidos
└── types/               # Tipos transversales del frontend
```

La estructura objetivo es una convención; sus directorios se crearán gradualmente al incorporar contenido real.

## Responsabilidades y dependencias

Las páginas de `app` componen layouts, features y componentes. No contienen lógica de dominio ni llamadas HTTP directas.

Cada feature es dueña de sus componentes, hooks, tipos específicos, adaptadores de API y transformaciones. Una feature no importa detalles internos de otra; si se requiere colaboración, se expone una interfaz explícita o se extrae un elemento realmente transversal.

`components/common` aloja componentes reutilizables de la aplicación, como la shell actual. `components/ui` aloja primitivas visuales genéricas. Ninguno depende de una feature.

`lib` contiene infraestructura y funciones puras transversales; no depende de `app`, componentes ni features. `hooks` solo contiene hooks que no pertenecen a un dominio. `schemas` y `types` contienen contratos compartidos del frontend.

Los imports internos usan `@/*`. Se prefieren imports de tipo con `import type`. Las rutas pueden importar features, componentes, hooks, `lib`, schemas y types; las capas inferiores no importan rutas.

## Server Components y Client Components

Los componentes son Server Components por defecto. Se añade `"use client"` únicamente a límites que requieren estado, efectos, eventos del navegador o APIs del navegador.

Las interacciones se mantienen en hojas pequeñas de la jerarquía. Los layouts y páginas permanecen como composición de servidor siempre que no necesiten APIs del cliente. El componente cliente no consulta bases de datos ni secretos; cuando exista integración, consumirá Nest mediante el cliente HTTP definido para el proyecto.

## Tipos, DTOs y formularios

Los tipos de `admin-web` describen contratos de interfaz y transporte; no importan ni duplican tipos internos de Prisma. Los DTOs de request y response vivirán junto al adaptador o feature que consume el endpoint.

Un `FormModel` representa el estado y las necesidades de una interfaz de formulario. Un DTO representa el contrato de la API. La conversión entre ambos se realiza en el límite de la feature, antes de invocar el cliente HTTP.

`lib/forms` aloja helpers puros para estado de formulario. `applyApiFieldErrors`
solo acepta mapeos explícitos de mensajes de Nest a campos de React Hook Form;
no conoce DTOs ni endpoints y no deduce campos a partir de texto.

## Estado remoto

TanStack Query gestiona caché, carga, errores, reintentos e invalidación del estado remoto. Su `QueryProvider` está integrado desde el layout raíz y sus defaults viven en `src/lib/query`. No se introducirá Zustand para sustituir datos obtenidos de la API. El estado local efímero continuará en componentes o hooks del dominio.

Las query keys y adaptadores pertenecen a la feature que posee el dominio. Las queries usan el ApiClient y deben reenviar el `AbortSignal` recibido de TanStack Query. Las mutaciones invalidan solamente los recursos afectados; la caché clínica no se persiste en almacenamiento local.

La sesión es una query de `features/auth` con la key `["auth", "session"]`. `AuthSessionProvider` integra Bearer, refresh y limpieza de caché sin duplicar el usuario en Context. `src/lib/permissions` contiene la matriz visual pura; `usePermission`, `PermissionGate` y `RouteAccessBoundary` consumen la sesión sin crear una segunda fuente de identidad. Nest y RLS siguen autorizando cada recurso.

## Nomenclatura

- Usar inglés para archivos, variables, funciones, tipos y componentes.
- Usar `PascalCase` para componentes y tipos, y `camelCase` para funciones, hooks y valores.
- Nombrar hooks con el prefijo `use`.
- Usar nombres de feature en plural cuando representan recursos: `patients`, `appointments` y `alerts`.
- Mantener los textos mostrados al usuario en español formal.

## Añadir una feature

1. Confirmar el endpoint y el contrato de Nest antes de crear UI o tipos de transporte.
2. Crear `src/features/<domain>` solo si aporta una unidad de producto real.
3. Mantener dentro de esa feature su UI, hooks, DTOs y adaptadores necesarios.
4. Exponer a `app` una página o componente de composición pequeño.
5. Extraer a `components`, `hooks`, `schemas`, `types` o `lib` únicamente aquello que sea genuinamente transversal.
