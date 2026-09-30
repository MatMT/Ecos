import type { PatientSessionsParams } from "@/features/sessions/types/session.types"

export const sessionKeys = {
  all: ["sessions"] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (noteId: number) => [...sessionKeys.details(), noteId] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  byPatient: (patientId: number) =>
    [...sessionKeys.lists(), patientId] as const,
  list: (patientId: number, params: PatientSessionsParams) =>
    [...sessionKeys.byPatient(patientId), params] as const,
}
