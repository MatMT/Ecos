import { api } from "@/lib/api"
import type {
  ClinicalRecord,
  CreateClinicalRecordInput,
  UpdateClinicalRecordInput,
} from "@/features/clinical-record/types/clinical-record.types"

export const clinicalRecordApi = {
  create: (studentId: number, input: CreateClinicalRecordInput) =>
    api.post<ClinicalRecord, CreateClinicalRecordInput>(
      `/students/${studentId}/clinical-record`,
      input,
    ),
  getByPatient: (studentId: number, signal?: AbortSignal) =>
    api.get<ClinicalRecord>(`/students/${studentId}/clinical-record`, { signal }),
  update: (studentId: number, input: UpdateClinicalRecordInput) =>
    api.patch<ClinicalRecord, UpdateClinicalRecordInput>(
      `/students/${studentId}/clinical-record`,
      input,
    ),
}
