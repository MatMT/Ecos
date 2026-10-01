"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { patientsApi } from "@/features/patients/api/patients.api"
import { patientKeys } from "@/features/patients/api/patient.keys"
import type { UpdatePatientInput } from "@/features/patients/types/patient.types"

export function useUpdatePatient(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdatePatientInput) => patientsApi.update(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: patientKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: patientKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: patientKeys.overview(id) }),
      ])
    },
  })
}
