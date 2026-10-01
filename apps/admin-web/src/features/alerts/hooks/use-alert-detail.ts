"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { alertsApi } from "@/features/alerts/api/alerts.api"
import { alertKeys } from "@/features/alerts/api/alert.keys"
import { patientKeys } from "@/features/patients/api/patient.keys"

export function useAlertDetail(patientId: number, alertId: number) {
  return useQuery({
    enabled: patientId > 0 && alertId > 0,
    queryFn: ({ signal }) => alertsApi.getByPatient(patientId, alertId, signal),
    queryKey: alertKeys.detail(patientId, alertId),
  })
}

function useAlertLifecycleMutation(
  patientId: number,
  mutationFn: () => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: alertKeys.byPatient(patientId),
        }),
        queryClient.invalidateQueries({
          queryKey: patientKeys.overview(patientId),
        }),
      ])
    },
  })
}

export function useReviewAlert(patientId: number, alertId: number) {
  return useAlertLifecycleMutation(patientId, () =>
    alertsApi.review(alertId),
  )
}

export function useCloseAlert(patientId: number, alertId: number) {
  return useAlertLifecycleMutation(patientId, () =>
    alertsApi.close(alertId),
  )
}
