import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError } from "@/lib/api"

export type ApiFieldErrorMap<TFieldValues extends FieldValues> = Readonly<
  Partial<Record<string, Path<TFieldValues>>>
>

export function isApiErrorStatus(
  error: unknown,
  ...statuses: readonly number[]
): error is ApiError {
  return error instanceof ApiError && statuses.includes(error.status)
}

export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  error: unknown,
  fieldErrorMap: ApiFieldErrorMap<TFieldValues>,
): readonly string[] {
  if (!isApiErrorStatus(error, 400, 422)) {
    return []
  }

  return error.validationMessages.filter((message) => {
    if (!Object.hasOwn(fieldErrorMap, message)) {
      return true
    }

    const fieldName = fieldErrorMap[message]
    if (!fieldName) {
      return true
    }

    setError(fieldName, {
      message,
      type: "server",
    })
    return false
  })
}
