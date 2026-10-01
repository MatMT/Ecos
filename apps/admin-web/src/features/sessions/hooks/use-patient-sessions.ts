"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { sessionKeys } from "@/features/sessions/api/session.keys"
import { sessionsApi } from "@/features/sessions/api/sessions.api"
import type { PatientSessionsParams } from "@/features/sessions/types/session.types"

export function usePatientSessions(
  patientId: number,
  params: PatientSessionsParams,
) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => sessionsApi.listByPatient(patientId, params, signal),
    queryKey: sessionKeys.list(patientId, params),
  })
}
