import { API_REQUEST_TIMEOUT_MS, apiBaseUrl } from "@/lib/api/config"
import { ApiError, createApiError } from "@/lib/api/errors"
import type {
  ApiAuthenticationHandler,
  ApiRequestOptions,
  QueryParams,
} from "@/lib/api/types"

const JSON_CONTENT_TYPE = "application/json"

export class ApiClient {
  private authenticationHandler: ApiAuthenticationHandler | undefined

  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = API_REQUEST_TIMEOUT_MS,
  ) {}

  get<TResponse>(path: string, options?: ApiRequestOptions): Promise<TResponse> {
    return this.request<TResponse>("GET", path, undefined, options)
  }

  post<TResponse, TBody>(
    path: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>("POST", path, body, options)
  }

  put<TResponse, TBody>(
    path: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>("PUT", path, body, options)
  }

  patch<TResponse, TBody>(
    path: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>("PATCH", path, body, options)
  }

  delete<TResponse>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return this.request<TResponse>("DELETE", path, undefined, options)
  }

  setAuthenticationHandler(
    authenticationHandler: ApiAuthenticationHandler | undefined,
  ): void {
    this.authenticationHandler = authenticationHandler
  }

  private async request<TResponse, TBody = undefined>(
    method: string,
    path: string,
    body: TBody | undefined,
    options: ApiRequestOptions | undefined,
  ): Promise<TResponse> {
    const { cleanup, didTimeOut, signal } = createRequestSignal(
      options?.signal,
      this.timeoutMs,
    )

    try {
      const url = createRequestUrl(this.baseUrl, path, options?.params)
      const headers = new Headers(options?.headers)
      if (!headers.has("Accept")) {
        headers.set("Accept", JSON_CONTENT_TYPE)
      }

      let response = await this.fetchResponse(
        url,
        method,
        body,
        headers,
        options,
        signal,
      )

      if (response.status === 401 && this.canRecoverSession(options)) {
        const accessToken = await this.authenticationHandler?.refreshAccessToken()

        if (accessToken) {
          response = await this.fetchResponse(
            url,
            method,
            body,
            headers,
            options,
            signal,
            accessToken,
          )
        } else {
          this.authenticationHandler?.onSessionExpired()
        }
      }

      if (!response.ok) {
        throw createApiError(response.status, await readResponseBody(response))
      }

      return readResponseBody<TResponse>(response)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (didTimeOut()) {
        throw new ApiError({
          code: "REQUEST_TIMEOUT",
          details: error,
          message:
            "La solicitud excedió el tiempo de espera permitido. Por favor, intente nuevamente.",
          status: 0,
        })
      }

      if (isAbortError(error) || options?.signal?.aborted) {
        throw new ApiError({
          code: "REQUEST_ABORTED",
          details: error,
          message: "La solicitud fue cancelada.",
          status: 0,
        })
      }

      throw new ApiError({
        code: "NETWORK_ERROR",
        details: error,
        message:
          "No fue posible establecer comunicación con el servidor. Por favor, verifique su conexión e intente nuevamente.",
        status: 0,
      })
    } finally {
      cleanup()
    }
  }

  private canRecoverSession(options: ApiRequestOptions | undefined): boolean {
    return (
      options?.authentication !== "none" && this.authenticationHandler !== undefined
    )
  }

  private async fetchResponse<TBody>(
    url: URL,
    method: string,
    body: TBody | undefined,
    headers: Headers,
    options: ApiRequestOptions | undefined,
    signal: AbortSignal,
    refreshedAccessToken?: string,
  ): Promise<Response> {
    const requestHeaders = new Headers(headers)
    const accessToken =
      refreshedAccessToken ??
      (options?.authentication === "none"
        ? null
        : await this.authenticationHandler?.getAccessToken())

    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`)
    }

    return fetch(url, {
      body: serializeRequestBody(body, requestHeaders),
      credentials: options?.credentials ?? "omit",
      headers: requestHeaders,
      method,
      signal,
    })
  }
}

export const api = new ApiClient(apiBaseUrl)

function createRequestUrl(
  baseUrl: string,
  path: string,
  params: QueryParams | undefined,
): URL {
  const normalizedPath = path.replace(/^\/+/, "")
  const url = new URL(`${baseUrl}/${normalizedPath}`)

  if (!params) {
    return url
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item))
      }
      continue
    }

    url.searchParams.append(key, String(value))
  }

  return url
}

function createRequestSignal(externalSignal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController()
  let timedOut = false

  const abortFromExternalSignal = () => controller.abort()
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternalSignal()
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, { once: true })
    }
  }

  return {
    cleanup: () => {
      clearTimeout(timeoutId)
      externalSignal?.removeEventListener("abort", abortFromExternalSignal)
    },
    didTimeOut: () => timedOut,
    signal: controller.signal,
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

function serializeRequestBody<TBody>(
  body: TBody | undefined,
  headers: Headers,
): BodyInit | undefined {
  if (body === undefined) {
    return undefined
  }

  if (isBodyInit(body)) {
    return body
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", JSON_CONTENT_TYPE)
  }

  return JSON.stringify(body)
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof ArrayBuffer ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams
  )
}

async function readResponseBody<TResponse = unknown>(
  response: Response,
): Promise<TResponse> {
  if (response.status === 204 || response.status === 205) {
    return undefined as TResponse
  }

  const contentLength = response.headers.get("content-length")
  if (contentLength === "0") {
    return undefined as TResponse
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    return (await response.json()) as TResponse
  }

  const text = await response.text()
  return (text || undefined) as TResponse
}
