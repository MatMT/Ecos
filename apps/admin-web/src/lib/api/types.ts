export type QueryParamValue = boolean | number | string

export type QueryParams = Record<
  string,
  QueryParamValue | readonly QueryParamValue[] | null | undefined
>

export interface ApiAuthenticationHandler {
  getAccessToken: () => Promise<string | null> | string | null
  onSessionExpired: () => void
  refreshAccessToken: () => Promise<string | null>
}

export interface ApiRequestOptions {
  authentication?: "none" | "required"
  credentials?: RequestCredentials
  headers?: HeadersInit
  params?: QueryParams
  signal?: AbortSignal
}

export interface ApiErrorOptions {
  code?: string
  details?: unknown
  message: string
  status: number
  validationMessages?: readonly string[]
}
