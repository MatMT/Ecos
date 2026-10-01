"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { alertKeys } from "@/features/alerts/api/alert.keys"
import { alertsApi } from "@/features/alerts/api/alerts.api"
import type { PatientAlertsParams } from "@/features/alerts/types/alert.types"

export function usePatientAlerts(
  patientId: number,
  params: PatientAlertsParams,
) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => alertsApi.listByPatient(patientId, params, signal),
    queryKey: alertKeys.list(patientId, params),
  })
}
