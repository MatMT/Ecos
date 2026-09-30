"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionsApi } from "@/features/sessions/api/sessions.api"
import { sessionKeys } from "@/features/sessions/api/session.keys"
import type { CreateManualSessionInput } from "@/features/sessions/types/session.types"
import { patientKeys } from "@/features/patients/api/patient.keys"

export function useCreateSession(patientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateManualSessionInput) =>
      sessionsApi.createManual(patientId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: sessionKeys.byPatient(patientId),
        }),
        queryClient.invalidateQueries({
          queryKey: patientKeys.overview(patientId),
        }),
      ])
    },
  })
}
