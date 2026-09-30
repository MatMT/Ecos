"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { patientsApi, type AssignTherapistInput } from "@/features/patients/api/patients.api"
import { patientKeys } from "@/features/patients/api/patient.keys"

export function useAssignTherapist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignTherapistInput) => patientsApi.assignTherapist(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
      void queryClient.invalidateQueries({
        queryKey: patientKeys.overview(variables.studentId),
      })
      void queryClient.invalidateQueries({
        queryKey: patientKeys.detail(variables.studentId),
      })
    },
  })
}