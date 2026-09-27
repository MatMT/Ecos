export const API_REQUEST_TIMEOUT_MS = 15_000

const API_VERSION_PREFIX = "/api/v1"

export function resolveApiBaseUrl(apiOrigin: string | undefined): string {
  if (!apiOrigin) {
    throw new Error(
      "NEXT_PUBLIC_API_URL debe configurarse para comunicarse con la API de Nest.",
    )
  }

  let parsedOrigin: URL

  try {
    parsedOrigin = new URL(apiOrigin)
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL debe ser una URL válida.")
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_URL debe utilizar HTTP o HTTPS.")
  }

  if (parsedOrigin.pathname !== "/" || parsedOrigin.search || parsedOrigin.hash) {
    throw new Error(
      "NEXT_PUBLIC_API_URL debe contener únicamente el origen de la API de Nest.",
    )
  }

  return `${parsedOrigin.origin}${API_VERSION_PREFIX}`
}

export const apiBaseUrl = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
