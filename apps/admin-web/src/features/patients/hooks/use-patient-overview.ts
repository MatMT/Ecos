"use client"
import { useQuery } from "@tanstack/react-query"
import { patientsApi } from "@/features/patients/api/patients.api"
import { patientKeys } from "@/features/patients/api/patient.keys"
import type { StudentOverview } from "../types/patient.types"

export function usePatientOverview(studentId: number) {
  return useQuery<StudentOverview>({
    queryFn: ({ signal }) => patientsApi.getOverview(studentId, signal),
    queryKey: patientKeys.overview(studentId),
    staleTime: 30_000,
  })
}