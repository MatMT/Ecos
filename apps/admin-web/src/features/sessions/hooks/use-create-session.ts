"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sessionsApi } from "@/features/sessions/api/sessions.api"
import { sessionKeys } from "@/features/sessions/api/session.keys"
import type { CreateSessionInput } from "@/features/sessions/types/session.types"
import { patientKeys } from "@/features/patients/api/patient.keys"
import { appointmentsKeys } from "@/features/appointments/hooks/use-appointments"

export function useCreateSession(patientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSessionInput) =>
      input.kind === "appointment"
        ? sessionsApi.createForAppointment(input.data)
        : sessionsApi.createManual(patientId, input.data),
    onSuccess: async (_session, input) => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: sessionKeys.byPatient(patientId),
        }),
        queryClient.invalidateQueries({
          queryKey: patientKeys.overview(patientId),
        }),
      ]

      if (input.kind === "appointment") {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: appointmentsKeys.lists(),
          }),
          queryClient.invalidateQueries({
            queryKey: appointmentsKeys.detail(input.data.appointmentId),
          }),
        )
      }

      await Promise.all(invalidations)
    },
  })
}
