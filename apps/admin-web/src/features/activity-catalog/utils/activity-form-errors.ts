import { ApiError } from "@/lib/api";

export function getActivityFormErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "No fue posible guardar la actividad. Por favor, intente nuevamente.";
}
