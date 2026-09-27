import { ApiError } from "@/lib/api"

export function getPatientFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return "Ha ocurrido un problema temporal. Por favor, intente nuevamente."
}
