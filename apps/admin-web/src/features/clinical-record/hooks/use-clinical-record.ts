"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clinicalRecordApi } from "@/features/clinical-record/api/clinical-record.api"
import { clinicalRecordKeys } from "@/features/clinical-record/api/clinical-record.keys"
import type {
  CreateClinicalRecordInput,
  UpdateClinicalRecordInput,
} from "@/features/clinical-record/types/clinical-record.types"

export function useClinicalRecord(studentId: number, enabled = true) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => clinicalRecordApi.getByPatient(studentId, signal),
    queryKey: clinicalRecordKeys.byPatient(studentId),
  })
}

export function useCreateClinicalRecord(studentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateClinicalRecordInput) =>
      clinicalRecordApi.create(studentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: clinicalRecordKeys.byPatient(studentId),
      })
    },
  })
}

export function useUpdateClinicalRecord(studentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateClinicalRecordInput) =>
      clinicalRecordApi.update(studentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: clinicalRecordKeys.byPatient(studentId),
      })
    },
  })
}
