"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sessionsApi } from "@/features/sessions/api/sessions.api"
import { sessionKeys } from "@/features/sessions/api/session.keys"
import type { UpdateSessionInput } from "@/features/sessions/types/session.types"
import { patientKeys } from "@/features/patients/api/patient.keys"

export function useSessionDetail(patientId: number, noteId: number) {
  return useQuery({
    enabled: patientId > 0 && noteId > 0,
    queryFn: ({ signal }) => sessionsApi.getByPatient(patientId, noteId, signal),
    queryKey: sessionKeys.detail(patientId, noteId),
  })
}

export function useUpdateSession(patientId: number, noteId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateSessionInput) => sessionsApi.update(noteId, input),
    onSuccess: async (session) => {
      queryClient.setQueryData(
        sessionKeys.detail(patientId, noteId),
        session,
      )
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: sessionKeys.detail(patientId, noteId),
        }),
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
