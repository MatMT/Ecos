# ECOS Admin Web — Phase 1 Decisions

## Package manager

pnpm 10.34.5.

Reason:
The monorepo root declares this version and workspace packages are managed through pnpm.

## Routing

Next.js App Router.

Route groups:

- `(dashboard)` for future protected portal routes; it already exists.
- `(auth)` for future public authentication routes; it is reserved until a real route is implemented.

The dashboard shell remains at `src/app/(dashboard)/layout.tsx`. The server
layout composes a narrow client `DashboardShell`, which owns responsive shell
interaction and consumes the existing session query without adding domain
queries.

Navigation lives in the typed `src/lib/navigation` configuration. Items are
filtered through the existing permission matrix, while `RouteAccessBoundary`
continues to protect direct navigation. Only functional destinations are shown;
permission-specific destinations are added with their real routes.

Desktop uses a fixed, permanently expanded sidebar from the `lg` breakpoint.
Below it, navigation uses the existing Radix dialog as a drawer. Breadcrumbs are
derived from route metadata, use a neutral dynamic-route fallback, and may be
overridden by a client feature that already has the resource label. Sidebar state
is local React state and is not persisted.

## Shared view toolkit

`components/common` provides `PageHeader`, `FilterBar`, generic `DataTable`,
`EmptyState`, `ErrorState`, `FormError`, embeddable `ForbiddenState`,
`ConfirmDialog`, `FormSection`, `StatCard` and `StatusBadge`. They are
domain-agnostic and use the existing UI primitives and semantic tokens.

`DataTable` receives data, stable row IDs, columns and optional external 1-based
pagination. It never queries Nest. `ConfirmDialog` is controlled by the feature
and receives an `isPending` state; it never executes HTTP itself.

Forms use React Hook Form with Zod and feature-owned FormModels transformed to
DTOs at the API boundary. `ApiError` preserves Nest validation messages as a
typed string array, but not field names. Feature code can call `setError` only
through an explicit exact-message-to-field mapping; unmapped errors use
`FormError` as a general error. The shared helper never infers fields from text.

Sonner is the sole toast implementation. The root `ToastProvider` follows the
existing document theme; success and failure toasts are reserved for mutations.
Persistent loading, empty, error and forbidden states are rendered in the view.

The dashboard route group has a client `error.tsx` boundary for unexpected
render failures. It exposes recovery with `ErrorState` and `reset` without
displaying, logging or sending technical details or sensitive data.

## Internal architecture

The application is organized incrementally by feature. Future domains will live under `src/features/<domain>` and retain their UI, hooks, DTOs, and API adapters close to the domain that owns them.

`src/components/common` contains reusable application-shell components. `src/components/ui` is reserved for generic visual primitives when one is required; it must not depend on a feature.

The current prototype views remain under `src/app/views` until their associated data integration is implemented. Empty architectural directories are not created in advance.

Remote server state will use TanStack Query when API integration begins. Global client state is not introduced as a substitute for remote state.

`admin-web` communicates only with Nest through HTTP. It never accesses Prisma, PostgreSQL, Supabase, or server-side credentials directly.

## Visual system

shadcn/ui is configured locally in `admin-web` with its Radix preset, CSS variables, neutral base, Lucide icons and the existing `@/*` aliases. The generated UI primitives live in `src/components/ui`; `src/lib/utils.ts` is the single `cn` utility.

`src/app/globals.css` owns the semantic light/dark tokens. Existing ECOS navy and blue/teal colors remain the identity and primary accent, while general surfaces use neutral semantic tokens. Dashboard and patient mockups consume the shared primitives without adding data, auth, or clinical functionality.

## TypeScript and alias

Strict TypeScript with `moduleResolution: "bundler"`.

`@/*` maps to `src/*` and remains the import convention.

## Environment

`NEXT_PUBLIC_API_URL` is the public API base URL. Local development uses `http://localhost:6622`.

The browser communicates with Nest only; no Supabase, PostgreSQL, Prisma, or server secret is exposed to `admin-web`.

## HTTP client

`src/lib/api` is the only shared HTTP infrastructure. It uses native `fetch`; Axios is not installed and does not add value for the current requirements.

`NEXT_PUBLIC_API_URL` is the Nest origin and the client centralizes the confirmed `/api/v1` prefix. The configuration rejects a missing, malformed, non-HTTP(S), or path-based origin before requests are made.

The default request timeout is 15 seconds. Requests support typed JSON or `FormData` bodies, query parameters, headers, `AbortSignal`, and an optional credentials override. The default credentials policy is `omit`, which matches the current Bearer-token API and CORS configuration.

HTTP failures are exposed as a central `ApiError`; the client never redirects, imports Prisma, or reacts to status codes in the UI. `AuthSessionProvider` registers the Bearer token strategy, single-flight refresh and terminal-session callback without creating a second HTTP client. Future feature adapters must call this client rather than use direct requests.

Nest currently returns direct entities and lists instead of a uniform paginated envelope, so `admin-web` does not define a global pagination type. The server currently permits GET, POST, PATCH, and DELETE through CORS; `put` is available generically but has no existing Nest endpoint.

## Server state

TanStack Query 5.104.0 is the official owner of remote state from Nest. It is configured under `src/lib/query` and mounted through `QueryProvider` in the root layout without converting the layout to a Client Component.

The shared query defaults are a 60-second `staleTime`, five-minute `gcTime`, `refetchOnWindowFocus: false`, and `refetchOnReconnect: true`. Queries retry once only for retryable failures such as network, timeout, or 5xx; 4xx responses and cancellations are not retried. Mutations do not retry automatically.

Each future feature owns its query-key factory and includes stable, serializable filters in list keys. TanStack Query uses the Fase 1.4 ApiClient and forwards its `AbortSignal`; it does not add another HTTP layer.

Remote resources must not be copied into Zustand, Context, Redux, global arrays, or custom stores. Cache persistence is disabled: no localStorage, IndexedDB, or persisted query client is configured. The future authentication phase must clear sensitive cache on logout or user change.

## Authentication

Nest uses Bearer access tokens and rotating refresh tokens. `admin-web` stores only that token pair atomically in sessionStorage; it does not store the user, role, institution or TanStack Query cache. This is the documented browser fallback until the backend supports HttpOnly cookies, and carries an explicit XSS trade-off.

The session key is `["auth", "session"]`. Session reconstruction calls `POST /auth/refresh` and then authenticated `GET /users/:id` using the returned id; this existing contract replaces the previously assumed `GET /auth/me` requirement.

`AuthSessionProvider` is mounted under `QueryProvider`. It performs one idempotent cleanup path for logout or terminal 401: clear token storage, `queryClient.clear()`, and client navigation to `/login`. A 403 never closes a session, while network and 5xx session-resolution failures remain recoverable.

`(dashboard)` uses a client AuthBoundary rather than middleware because sessionStorage is unavailable to Edge and Server Components. RouteAccessBoundary then evaluates the closed local permission matrix before the shell is rendered. `administrator` and `psychologist` receive permissions differentiated by area; `student`, null and unknown roles fail closed and render `/403` without ending a valid session.

## Authorization

`UserRole` from the authenticated session is the only frontend role source. Nest does not return explicit capabilities, so `src/lib/permissions` defines a typed local `resource.action` matrix for visual authorization only. `can()` is pure and fail-closed; `usePermission` and `PermissionGate` do not make HTTP calls or persist effective permissions.

Route prefixes are configured centrally and must be declared when a dashboard area is added. A 403 preserves the session and cache; only terminal 401 responses invoke logout cleanup. Institution, patient assignment, ownership and every sensitive operation remain enforced by Nest and RLS.

## Linting and formatting

ESLint is used for linting through `pnpm --filter admin-web lint`.

oxfmt remains the formatter through `pnpm --filter admin-web format`.

TypeScript validation runs through `pnpm --filter admin-web typecheck`.

## Current validation limitation

The scripts are configured and executable. Typecheck and build currently fail because the pre-existing patient views reference the empty `src/app/data/mockData.ts` module. This is intentionally deferred from Phase 1.1 because it belongs to the future patient-data integration.

The build environment can additionally report a Turbopack process/port restriction; this is an execution-environment limitation, not a project configuration change.
