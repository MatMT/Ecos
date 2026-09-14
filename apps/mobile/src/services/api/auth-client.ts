import { API_URL } from '@/config/env';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/services/api/secure-session-storage';

// Contract: docs/AUTH_INTEGRATION.md — do not deviate from the shapes/flow documented there.

export interface AuthUser {
  id: string;
  email?: string;
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  user: AuthUser;
}

interface AuthResponseBody {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

const SESSION_KEY = 'ecos-patient-session';

// Persisted as one JSON blob so the access/refresh token pair (and the user snapshot) can
// never be read or written out of sync with each other.
async function readSession(): Promise<StoredSession | null> {
  const raw = await getSecureItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

async function writeSession(session: StoredSession): Promise<void> {
  await setSecureItem(SESSION_KEY, JSON.stringify(session));
}

async function clearSession(): Promise<void> {
  await deleteSecureItem(SESSION_KEY);
}

function toStoredSession(body: AuthResponseBody): StoredSession {
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    user: body.user,
  };
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return body.message;
  } catch {
    // fall through to the generic message below
  }
  return 'Ha ocurrido un error en el procesamiento de la solicitud. Por favor, intente nuevamente.';
}

async function refresh(refreshToken: string): Promise<AuthResponseBody | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthResponseBody;
  } catch {
    // Network failure is treated the same as a rejected refresh by every caller here — never
    // let it surface as an unhandled rejection during background session bootstrap.
    return null;
  }
}

let inFlightRefresh: Promise<StoredSession | null> | null = null;

/** Ensures a valid (non-expired) session, refreshing once if needed. Null if there is none. */
async function ensureFreshSession(): Promise<StoredSession | null> {
  const session = await readSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 30_000) return session;

  inFlightRefresh ??= (async () => {
    const body = await refresh(session.refreshToken);
    if (!body) {
      await clearSession();
      return null;
    }
    const next = toStoredSession(body);
    await writeSession(next);
    return next;
  })().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

/** Restores a persisted session on app start, refreshing it if the access token has expired. */
async function restoreSession(): Promise<AuthUser | null> {
  const session = await ensureFreshSession();
  return session?.user ?? null;
}

/** Use this for every authenticated call instead of calling fetch() directly. */
async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await ensureFreshSession();
  if (!session) throw new Error('SESSION_EXPIRED');

  const doFetch = (accessToken: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    });

  const res = await doFetch(session.accessToken);
  if (res.status !== 401) return res;

  // The access token was rejected even though it looked fresh locally (clock skew, a token
  // revoked server-side, ...) — one more refresh attempt before giving up, per the documented
  // reactive strategy.
  const refreshed = await refresh(session.refreshToken);
  if (!refreshed) {
    await clearSession();
    throw new Error('SESSION_EXPIRED');
  }
  const next = toStoredSession(refreshed);
  await writeSession(next);
  return doFetch(next.accessToken);
}

const NETWORK_ERROR_MESSAGE =
  'No fue posible conectar con el servidor. Verifique su conexión e intente nuevamente.';

async function login(email: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // fetch() throws a raw, English, implementation-specific error on network failure — never
    // surface that to the user directly.
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const body = (await res.json()) as AuthResponseBody;
  await writeSession(toStoredSession(body));
  return body.user;
}

async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort: logout must succeed locally even if the network call fails (offline, server
    // down, session already expired, ...) — the session is cleared below regardless.
  } finally {
    await clearSession();
  }
}

export const authClient = {
  restoreSession,
  apiFetch,
  login,
  logout,
};
