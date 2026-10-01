"use client"

import { useQuery } from "@tanstack/react-query"
import { patientsApi } from "@/features/patients/api/patients.api"
import { patientKeys } from "@/features/patients/api/patient.keys"
import type { PatientsListParams } from "@/features/patients/types/patient.types"

export function usePatients(params: PatientsListParams) {
  return useQuery({
    queryFn: ({ signal }) => patientsApi.list(params, signal),
    queryKey: patientKeys.list(params),
  })
}
