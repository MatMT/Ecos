import { ApiError } from "@/lib/api";

export function getAssignActivityErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No cuenta con autorización para asignar actividades a este paciente.";
    }

    if (error.status === 404) {
      return "La actividad o el paciente ya no se encuentran disponibles.";
    }

    return error.message;
  }

  return "No fue posible asignar la actividad. Por favor, intente nuevamente.";
}
