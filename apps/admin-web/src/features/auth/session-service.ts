import { ApiError } from "@/lib/api"
import { authApi } from "@/features/auth/api/auth.api"
import {
  getAuthTokens,
  setAuthTokens,
} from "@/features/auth/auth-token-storage"
import type {
  AuthResponse,
  AuthSession,
  AuthTokens,
  AuthenticatedUser,
} from "@/features/auth/types/auth.types"

let inFlightRefresh: Promise<AuthResponse | null> | null = null

export function createAuthTokens(response: AuthResponse): AuthTokens {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export async function refreshStoredSession(): Promise<AuthResponse | null> {
  const tokens = getAuthTokens()
  if (!tokens) {
    return null
  }

  inFlightRefresh ??= authApi
    .refresh(tokens.refreshToken)
    .then((response) => {
      setAuthTokens(createAuthTokens(response))
      return response
    })
    .finally(() => {
      inFlightRefresh = null
    })

  return inFlightRefresh
}

export async function resolveAuthSession(
  signal?: AbortSignal,
): Promise<AuthSession> {
  const refreshedSession = await refreshStoredSession()
  if (!refreshedSession) {
    throw new ApiError({
      code: "SESSION_MISSING",
      message: "No existe una sesión activa.",
      status: 401,
    })
  }

  const user = await authApi.getCurrentUser(refreshedSession.user.id, signal)
  return toAuthSession(user)
}

export function toAuthSession(user: AuthenticatedUser): AuthSession {
  return {
    email: user.email,
    fullName: user.fullName,
    id: user.id,
    institutionId: user.institutionId,
    role: user.role,
  }
}
