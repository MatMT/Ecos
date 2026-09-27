import { api } from "@/lib/api"
import type {
  AuthResponse,
  AuthenticatedUser,
  LoginInput,
} from "@/features/auth/types/auth.types"

export const authApi = {
  getCurrentUser: (userId: string, signal?: AbortSignal) =>
    api.get<AuthenticatedUser>(`/users/${userId}`, { signal }),

  login: (input: LoginInput) =>
    api.post<AuthResponse, LoginInput>("/auth/login", input, {
      authentication: "none",
    }),

  logout: () =>
    api.post<void, undefined>("/auth/logout", undefined, {
      authentication: "required",
    }),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse, { refreshToken: string }>(
      "/auth/refresh",
      { refreshToken },
      { authentication: "none" },
    ),
}
