# ECOS Admin Web — Phase 1 Technical Audit

## 1. Executive summary

`admin-web` is an early Next.js dashboard prototype. It has three dashboard routes and local placeholder data, but no API client, server-state library, forms/validation library, auth flow, route protection, or environment configuration. Its intended API is the Nest server on port `6622`.

## 2. Monorepo structure

The pnpm workspace includes `apps/*` and `packages/*`; no shared package was found. Applications include `admin-web`, `server`, `therapist-web`, and `mobile`. Turborepo defines `build`, `lint`, `test`, and persistent `dev` tasks. Root scripts delegate through Turbo; `dev:mobile` starts `server` and `mobile` directly.

`admin-web` is at `apps/admin-web`; `server` is at `apps/server`. `admin-web` runs with `pnpm --filter admin-web dev` on `http://localhost:9444`. `server` runs with `pnpm --filter server dev`; its checked-in example uses port `6622`, while the configuration fallback is `3000`. Docker exposes the server as `6622:6622`.

## 3. Current admin-web state

The app uses Next `16.0.0`, React `19.0.0`, TypeScript `5.7.0`, and the App Router under `src/app`. Current routes are the dashboard, patients list, and patient detail. Shared UI currently lives in `src/components`; views are in `src/app/views`; no `features`, `lib`, `hooks`, `providers`, `schemas`, or shared `types` directory exists. The `@/*` alias maps to `src/*` and TypeScript strict mode is enabled.

## 4. Tooling

Tailwind CSS `4.0.0` is configured through `@tailwindcss/postcss`; Lucide and Recharts are installed. ESLint uses Next core-web-vitals and TypeScript presets. Formatting uses `oxfmt`. No test runner, browser-test framework, Husky, or lint-staged configuration was found in `admin-web`.

## 5. UI and styles

The dashboard uses Tailwind utilities, custom CSS, Lucide, and Recharts. shadcn/ui and CSS Modules were not found. The root stylesheet contains the current light/dark theme support; page shell components are `Header`, `Sidebar`, and `ThemeToggle`.

## 6. Remote state and HTTP

No `fetch`, Axios, TanStack Query, SWR, Redux store, or API client is used by `admin-web`. `mockData.ts` is empty while patient views still reference it, so those views currently have known type errors. No frontend `.env` or `.env.example` was found; consequently no API URL is currently configured.

## 7. Authentication

The documented client contract is `docs/AUTH_INTEGRATION.md`. Clients call only Nest, not GoTrue directly, except the browser redirect resulting from password recovery. Auth uses Bearer access JWTs and rotating opaque refresh tokens; the access-token default is one hour. Public endpoints are `POST /api/v1/auth/login`, `/refresh`, and `/forgot-password`; protected endpoints are `/logout` and `/update-password`.

Login body is `{ email, password }`. Login/refresh return `{ access_token, refresh_token, expires_in, token_type, user }`, where `user` contains `id` and optional `email`. Refresh input is `{ refreshToken }`; every refresh replaces the old token pair. The server has no cookie session and CORS credentials are not enabled.

## 8. Roles and permissions

The real Prisma role values are `student`, `psychologist`, and `administrator`. `admin-web` is for `psychologist` and `administrator`; authorization is enforced through the global JWT guard, role guards, and PostgreSQL RLS. `GET /api/v1/students/me` is student-only.

## 9. Environment and local integration

`admin-web` defines no environment variable. `server` requires `PORT`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, `APP_DATABASE_URL`, `SUPABASE_AUTH_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`; secrets are not reproduced here. Server CORS defaults to origins `http://localhost:9443` and `http://localhost:9444`, with `GET`, `POST`, `PATCH`, and `DELETE` allowed.

## 10. Docker, Supabase, and Prisma

Root Compose runs the Nest `server` and includes the self-hosted Supabase Compose stack. The server image is containerized; `admin-web` is not. Supabase provides PostgreSQL, GoTrue Auth, REST, Realtime, Storage, gateway, and supporting services; the server uses GoTrue through the gateway and Prisma against PostgreSQL. Prisma lives only in `server`; no direct Prisma access exists in `admin-web`.

## 11. Backend contracts available for Phase 1

All API routes have global prefix `/api` and URI version `v1`; Scalar documentation is served at `/api/docs`. Portal-relevant resources already include users, psychologists, students, therapist assignments, schedules, appointments, clinical records/notes, treatment plans, activities, alerts, biometrics, shared content, and role-specific dashboard endpoints: `GET /api/v1/dashboard/psychologist` and `GET /api/v1/dashboard/administrator`.

## 12. Dependency and architecture comparison

Available: Next, React, Tailwind, Lucide, Recharts, ESLint, TypeScript, and formatting. Missing for the proposed frontend architecture: an HTTP client wrapper, server-state solution, forms, validation, auth/session storage abstraction, permission utilities, test tooling, and a documented `NEXT_PUBLIC` API base URL. The current `src/app` and `src/components` should be retained; introduce feature/lib layers incrementally in a later subphase rather than reorganizing prototype views preemptively.

## 13. Risks and recommendations

- The lack of a current-user contract blocks reliable protected-route restoration for portal roles.
- The API base URL is not configured in `admin-web`.
- Existing patient mock-data references prevent a clean TypeScript build independently of this audit.
- Browser token persistence needs an explicit security decision; the authoritative guide names httpOnly cookies as preferred and sessionStorage as the pragmatic fallback with an XSS trade-off.
- `admin-web` must use the server API only and must not expose Supabase service credentials.

## 14. Backend debt detected

See [backend-debt.md](./backend-debt.md): authenticated current-user/session identity is blocking.

## 15. Recommended Phase 1.1

Resolve the backend current-user contract first. Then define `admin-web`'s API base URL and build one shared token/session and HTTP wrapper following `docs/AUTH_INTEGRATION.md`, including serialized refresh-token rotation and one 401 retry. Do not begin portal modules before that foundation exists.
