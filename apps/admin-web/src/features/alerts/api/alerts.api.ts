import { api } from "@/lib/api"
import type {
  AlertDetail,
  PatientAlertsParams,
  PatientAlertsResponse,
} from "@/features/alerts/types/alert.types"

export const alertsApi = {
  close: (alertId: number) =>
    api.patch(`/alerts/${alertId}/close`, {}),
  getByPatient: (patientId: number, alertId: number, signal?: AbortSignal) =>
    api.get<AlertDetail>(`/students/${patientId}/alerts/${alertId}`, {
      signal,
    }),
  listByPatient: (
    patientId: number,
    params: PatientAlertsParams,
    signal?: AbortSignal,
  ) =>
    api.get<PatientAlertsResponse>(`/students/${patientId}/alerts`, {
      params: {
        alertType: params.alertType,
        priority: params.priority,
        skip: params.skip,
        status: params.status,
        take: params.take,
      },
      signal,
    }),
  review: (alertId: number) =>
    api.patch(`/alerts/${alertId}/review`, {}),
}
