# therapist-web

React + Next.js + Tailwind CSS project migrated from a Vite/Figma Make prototype.

## Development Server

Run the Next.js development server with:

```bash
corepack pnpm dev
```

The app is configured to listen on `0.0.0.0:9443`.

## Key Files

- `src/app/layout.tsx` - Root HTML shell and shared sidebar layout
- `src/app/page.tsx` - Redirects `/` to `/dashboard`
- `src/app/dashboard/page.tsx` - Dashboard route
- `src/app/patients/page.tsx` - Patients list route
- `src/app/patients/[id]/page.tsx` - Patient detail route
- `src/app/clinical-notes/page.tsx` - Clinical notes route
- `src/app/globals.css` - Global styles and Tailwind CSS import
- `src/views` - Client UI views reused by the routes
- `src/components` - Shared UI components
- `src/data/mockData.ts` - Prototype data
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - Tailwind CSS v4 PostCSS setup
- `.mise.toml` - Toolchain versions

## Styling

This project uses Tailwind CSS v4. Use Tailwind utility classes directly in JSX and keep global tokens in `src/app/globals.css`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
