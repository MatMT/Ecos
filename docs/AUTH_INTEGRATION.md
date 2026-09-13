# ECOS Auth Integration Guide

Audience: any app in this monorepo that needs to log a user in — `patient-app`,
`therapist-web`, `admin-web` — and any dev or agent implementing that. This is the
contract client apps code against. Server-side implementation details live in
[`apps/server/AGENTS.md`](../apps/server/AGENTS.md), in the "Security" and "Row Level
Security (RLS) & Supabase Auth" sections — read that file instead of reverse-engineering
the server's source.

## 1. How it works

- **The Nest server is the only thing your app talks to.** Never call Supabase
  Auth/GoTrue directly, never hit `infra/supabase` ports from client code. The server
  proxies everything.
- There is **no server-side session store**. The "session" is just the token pair your
  app holds: an `access_token` (a JWT, valid 1 hour) and a `refresh_token` (opaque,
  single-use — see "Token lifecycle" below). Every request you make carries the access
  token; nothing is remembered between requests server-side.
- **There is no public self-signup.** Accounts are created by an administrator
  (`POST /users`, requires an admin's token). If your app needs a "create account" flow,
  it's an admin-facing screen, not a public one.
- **Roles are `student` / `psychologist` / `administrator`.** What a logged-in user can
  see and do is enforced twice — once by the API, once by the database (Row Level
  Security) — so a list endpoint can legitimately return different rows to different
  users. Don't assume `GET /users` means "all users"; it means "the users this token is
  allowed to see."

## 2. Endpoints

Base URL: read from your app's own config/env, don't hardcode. Local dev default is
`http://localhost:6622`.

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | none | `{ email, password }` | `{ access_token, refresh_token, expires_in, user }` |
| POST | `/auth/refresh` | none | `{ refreshToken }` | same shape, with a **new** `refresh_token` |
| POST | `/auth/logout` | Bearer | — | 204, revokes every session for this user |
| POST | `/auth/forgot-password` | none | `{ email, redirectTo? }` | 204, always (see "Forgot / reset password" below) |
| POST | `/auth/update-password` | Bearer | `{ password }` | 204 |
| GET/POST/PATCH/DELETE | `/users...` | Bearer | — | role/RLS-scoped |

Every non-public route requires:

```
Authorization: Bearer <access_token>
```

## 3. Error shapes you must handle

```json
{ "statusCode": 401, "message": "Se requiere un token de autenticación.", "error": "Unauthorized" }
```

- **401** — missing/invalid/expired token. Try one refresh (see "Token lifecycle" below), then if that also
  fails, treat the user as logged out.
- **403** — token is valid, but the role check failed (e.g. a non-admin calling
  `POST /users`).
- **404** — the resource doesn't exist, **or** RLS silently filtered it out. These are
  indistinguishable on purpose (not leaking whether a resource exists to someone who
  can't see it) — don't build UI that tries to tell them apart.
- `message` is already formal, user-facing Spanish — safe to show directly in an error
  toast, no need to write your own copy for these cases.

## 4. Token lifecycle — the part that's easy to get wrong

- `access_token` expires in `expires_in` seconds (1 hour by default). Default strategy:
  **reactive** — call the API, if you get a 401, call `/auth/refresh` once, retry the
  original request, and only log the user out if that retry also fails. Use this
  strategy consistently across apps rather than each app inventing its own.
- **`refresh_token` rotates on every use.** `/auth/refresh` returns a brand-new
  `refresh_token` in addition to a new `access_token`. You must overwrite your stored
  refresh token with the new one every time — reusing the one from the original login
  after you've already refreshed once will fail. This is the single most common mistake
  integrating against this API.
- Persist both tokens together, atomically — never end up with an access token from one
  pair and a refresh token from another.

## 5. Forgot / reset password — where the flow crosses into your app

This is the one place where the browser/app talks to GoTrue directly instead of the
server, so it needs explaining:

1. Your app calls `POST /auth/forgot-password` with `{ email, redirectTo }`, where
   `redirectTo` is a URL **your app owns** — a real page for `therapist-web`/`admin-web`,
   a registered deep link (e.g. `ecosapp://reset-password`) for `patient-app`.
2. GoTrue emails the user a link. The user clicks it. That request goes to GoTrue
   directly (through the gateway), **not through the Nest server** — GoTrue verifies it
   and 303-redirects the browser to your `redirectTo`, appending
   `#access_token=...&refresh_token=...&type=recovery` as a **URL fragment** (not a query
   string — read `location.hash`, not `location.search`).
3. Your `redirectTo` page/screen parses that fragment, extracts `access_token`, and calls
   `POST /auth/update-password` with `{ password: newPassword }` and that token as the
   Bearer token. This works because that recovery-session token is a completely normal
   GoTrue JWT — the server's guard can't tell it apart from a regular login.
4. `forgot-password` **always** returns 204, whether or not the email exists (GoTrue's
   anti-enumeration behavior). Never build a UI that says "no account with that email."

## 6. Reference implementation

Token storage is the only genuinely platform-specific part. Everything else — the HTTP
calls, the refresh/retry logic, the shapes — is identical across apps. Implement one
small module like this per app, swapping only the storage functions:

```ts
// authClient.ts — adapt getToken/setTokens/clearTokens to your platform's storage.
// patient-app (Expo):     expo-secure-store (SecureStore.getItemAsync/setItemAsync)
// therapist-web/admin-web: an httpOnly-cookie-backed store if you have one, otherwise
//                          sessionStorage as the pragmatic default — flag this as a
//                          known XSS trade-off if you go that route, not a solved one.

const API_URL = process.env.ECOS_API_URL; // never hardcode

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let inFlightRefresh: Promise<TokenPair | null> | null = null;

async function refresh(refreshToken: string): Promise<TokenPair | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return { accessToken: body.access_token, refreshToken: body.refresh_token };
}

/** Use this for every authenticated call instead of calling fetch() directly. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const tokens = await getTokens(); // your storage read
  const doFetch = (accessToken: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    });

  let res = await doFetch(tokens.accessToken);
  if (res.status !== 401) return res;

  // Single refresh attempt, de-duplicated so concurrent 401s don't each trigger their
  // own refresh call and race each other's token rotation.
  inFlightRefresh ??= refresh(tokens.refreshToken).finally(() => {
    inFlightRefresh = null;
  });
  const newTokens = await inFlightRefresh;

  if (!newTokens) {
    await clearTokens(); // your storage clear
    throw new Error('SESSION_EXPIRED'); // caller should redirect to login
  }

  await setTokens(newTokens); // your storage write — MUST replace the refresh token too
  return doFetch(newTokens.accessToken);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const body = await res.json();
  await setTokens({ accessToken: body.access_token, refreshToken: body.refresh_token });
  return body.user;
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    await clearTokens(); // clear locally even if the network call fails (e.g. offline)
  }
}
```

## 7. Checklist before you consider login "done" in a new app

- [ ] Tokens stored via the platform-appropriate secure mechanism, not plain `localStorage`
      on a health-data app if you can avoid it
- [ ] Every authenticated call goes through one shared wrapper (`apiFetch` above), not
      ad hoc `fetch`/`axios` calls scattered around
- [ ] A 401 triggers exactly one refresh attempt before giving up, and concurrent 401s
      don't each fire their own refresh
- [ ] The refresh token is overwritten with the new one on every refresh — never reused
- [ ] Logout clears local tokens even if the network call fails
- [ ] Forgot-password's `redirectTo` page/screen parses the URL **fragment**, not the
      query string
- [ ] No UI branches on "this email doesn't exist" for forgot-password, or on "404 vs. no
      permission" for a resource lookup
- [ ] If this is a new browser app, its dev origin has been added to the server's
      `CORS_ALLOWED_ORIGINS` (see the "Security" section of `apps/server/AGENTS.md`) — otherwise every request
      will fail with a CORS error, not a 401
