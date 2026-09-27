export type UserRole = "administrator" | "psychologist" | "student" | null

export interface LoginInput {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  token_type: string
  user: {
    email?: string
    id: string
  }
}

export interface AuthenticatedUser {
  email: string | null
  fullName: string | null
  id: string
  institutionId: number | null
  role: UserRole
}

export type AuthSession = AuthenticatedUser
