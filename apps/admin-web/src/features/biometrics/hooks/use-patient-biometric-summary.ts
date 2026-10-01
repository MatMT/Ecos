"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { biometricsApi } from "@/features/biometrics/api/biometrics.api"
import { biometricKeys } from "@/features/biometrics/api/biometric.keys"
import type { BiometricRange } from "@/features/biometrics/types/biometric.types"

export function usePatientBiometricSummary(
  patientId: number,
  range: BiometricRange,
) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => biometricsApi.getSummary(patientId, range, signal),
    queryKey: biometricKeys.summary(patientId, range),
  })
}
