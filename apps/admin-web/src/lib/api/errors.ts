import type { ApiErrorOptions } from "@/lib/api/types"

interface NestErrorPayload {
  error?: unknown
  message?: unknown
}

const DEFAULT_ERROR_MESSAGE =
  "Ha ocurrido un error durante la comunicación con el servidor."

export class ApiError extends Error {
  readonly code?: string
  readonly details?: unknown
  readonly status: number
  readonly validationMessages: readonly string[]

  constructor({
    code,
    details,
    message,
    status,
    validationMessages = [],
  }: ApiErrorOptions) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.details = details
    this.status = status
    this.validationMessages = validationMessages
  }
}

export function createApiError(
  status: number,
  payload: unknown,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): ApiError {
  const nestPayload = isNestErrorPayload(payload) ? payload : undefined

  return new ApiError({
    code: getErrorCode(nestPayload?.error),
    details: payload,
    message: getErrorMessage(nestPayload?.message, fallbackMessage),
    status,
    validationMessages: getValidationMessages(nestPayload?.message),
  })
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "string" ? error : undefined
}

function getErrorMessage(message: unknown, fallbackMessage: string): string {
  if (typeof message === "string" && message.length > 0) {
    return message
  }

  const validationMessages = getValidationMessages(message)
  if (validationMessages.length > 0) {
    return validationMessages.join(" ")
  }

  return fallbackMessage
}

function getValidationMessages(message: unknown): readonly string[] {
  if (!Array.isArray(message)) {
    return []
  }

  return message.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  )
}

function isNestErrorPayload(payload: unknown): payload is NestErrorPayload {
  return typeof payload === "object" && payload !== null
}
