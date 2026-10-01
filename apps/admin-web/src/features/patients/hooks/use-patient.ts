"use client"

import { useQuery } from "@tanstack/react-query"
import { patientsApi } from "@/features/patients/api/patients.api"
import { patientKeys } from "@/features/patients/api/patient.keys"

export function usePatient(id: number) {
  return useQuery({
    queryFn: ({ signal }) => patientsApi.getById(id, signal),
    queryKey: patientKeys.detail(id),
  })
}
