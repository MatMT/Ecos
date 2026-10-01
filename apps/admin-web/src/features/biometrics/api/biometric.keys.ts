import type {
  BiometricRange,
  PatientBiometricsParams,
} from "@/features/biometrics/types/biometric.types"

export const biometricKeys = {
  all: ["biometrics"] as const,
  byPatient: (patientId: number) =>
    [...biometricKeys.all, "patient", patientId] as const,
  history: (patientId: number, params: PatientBiometricsParams) =>
    [...biometricKeys.byPatient(patientId), "history", params] as const,
  summary: (patientId: number, range: BiometricRange) =>
    [...biometricKeys.byPatient(patientId), "summary", range] as const,
}
