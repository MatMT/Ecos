"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { patientsApi } from "@/features/patients/api/patients.api"
import { patientKeys } from "@/features/patients/api/patient.keys"

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() }),
  })
}
