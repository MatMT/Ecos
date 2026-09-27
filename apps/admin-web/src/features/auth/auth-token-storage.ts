import type { AuthTokens } from "@/features/auth/types/auth.types"

export const AUTH_TOKEN_STORAGE_KEY = "ecos-admin-auth-tokens"

type Listener = () => void

let cachedTokens: AuthTokens | null | undefined
const listeners = new Set<Listener>()

export function clearAuthTokens(): void {
  cachedTokens = null

  if (isBrowser()) {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }

  notifyListeners()
}

export function getAuthTokens(): AuthTokens | null {
  if (cachedTokens !== undefined) {
    return cachedTokens
  }

  cachedTokens = readStoredTokens()
  return cachedTokens
}

export function setAuthTokens(tokens: AuthTokens): void {
  cachedTokens = tokens

  if (isBrowser()) {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(tokens))
  }

  notifyListeners()
}

export function subscribeToAuthTokens(listener: Listener): () => void {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Partial<AuthTokens>
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === "string" &&
    candidate.refreshToken.length > 0
  )
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}

function readStoredTokens(): AuthTokens | null {
  if (!isBrowser()) {
    return null
  }

  try {
    const rawTokens = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!rawTokens) {
      return null
    }

    const parsedTokens: unknown = JSON.parse(rawTokens)
    if (isAuthTokens(parsedTokens)) {
      return parsedTokens
    }
  } catch {
    // Invalid or unavailable browser storage is treated as an unauthenticated session.
  }

  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  return null
}
