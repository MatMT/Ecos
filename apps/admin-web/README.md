# ECOS Admin Web

Frontend portal for ECOS administrators and psychologists.

## Requirements

- Node.js 24.x (the repository currently uses Node 24.21.0).
- pnpm 10.34.5.
- The ECOS Nest API running locally at `http://localhost:6622` for future API integration.

## Installation

From the monorepo root:

```bash
pnpm install --frozen-lockfile
```

Create the local environment file:

```bash
cp apps/admin-web/.env.example apps/admin-web/.env.local
```

`NEXT_PUBLIC_API_URL` points only to the Nest API. Do not add Supabase, PostgreSQL, Prisma, or server-side secrets to this application.

## Development

```bash
pnpm --filter admin-web dev
```

The application is available at `http://localhost:9444`.

## Validation

```bash
pnpm --filter admin-web lint
pnpm --filter admin-web typecheck
pnpm --filter admin-web build
```

## Architecture

The project uses Next.js App Router under `src/app` and the `@/*` alias for `src/*` imports.

- `(dashboard)` contains routes for the future protected administrator/psychologist portal.
- `(auth)` is the reserved route group for future public authentication routes. It will be added when authentication is implemented.
- The existing dashboard shell is in `src/components/common`.

The current and target internal architecture, dependency rules, and guidance for future features are documented in [frontend-architecture.md](../../docs/frontend/frontend-architecture.md).

Features, API access, session management, permissions, and clinical modules are intentionally deferred to later Phase 1 subphases.
