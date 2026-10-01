import { api } from "@/lib/api"
import type {
  BiometricRange,
  PatientBiometricSummary,
  PatientBiometricsParams,
  PatientBiometricsResponse,
} from "@/features/biometrics/types/biometric.types"

export const biometricsApi = {
  listByPatient: (
    patientId: number,
    params: PatientBiometricsParams,
    signal?: AbortSignal,
  ) =>
    api.get<PatientBiometricsResponse>(`/students/${patientId}/biometrics`, {
      params: {
        range: params.range,
        skip: params.skip,
        take: params.take,
      },
      signal,
    }),
  getSummary: (patientId: number, range: BiometricRange, signal?: AbortSignal) =>
    api.get<PatientBiometricSummary>(`/students/${patientId}/biometrics/summary`, {
      params: { range },
      signal,
    }),
}
