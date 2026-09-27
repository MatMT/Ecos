import type { PatientsListParams } from "@/features/patients/types/patient.types"

export const patientKeys = {
  all: ["patients"] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: number) => [...patientKeys.details(), id] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: PatientsListParams) => [...patientKeys.lists(), params] as const,
}
