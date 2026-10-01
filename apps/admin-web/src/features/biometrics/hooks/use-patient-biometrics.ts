"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { biometricsApi } from "@/features/biometrics/api/biometrics.api"
import { biometricKeys } from "@/features/biometrics/api/biometric.keys"
import type { PatientBiometricsParams } from "@/features/biometrics/types/biometric.types"

export function usePatientBiometrics(
  patientId: number,
  params: PatientBiometricsParams,
) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => biometricsApi.listByPatient(patientId, params, signal),
    queryKey: biometricKeys.history(patientId, params),
  })
}
