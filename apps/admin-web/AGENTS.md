<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Auth Integration

Any login/session/token work in this app MUST follow
[`docs/AUTH_INTEGRATION.md`](../../docs/AUTH_INTEGRATION.md) at the repo root — it's the
authoritative contract for talking to the `server` app's auth endpoints. This app's dev
origin (`http://localhost:9444`) must stay in the server's `CORS_ALLOWED_ORIGINS`.
