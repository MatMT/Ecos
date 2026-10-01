import type { PatientAlertsParams } from "@/features/alerts/types/alert.types"

export const alertKeys = {
  all: ["alerts"] as const,
  byPatient: (patientId: number) =>
    [...alertKeys.all, "patient", patientId] as const,
  detail: (patientId: number, alertId: number) =>
    [...alertKeys.byPatient(patientId), "detail", alertId] as const,
  list: (patientId: number, params: PatientAlertsParams) =>
    [...alertKeys.byPatient(patientId), "list", params] as const,
}
