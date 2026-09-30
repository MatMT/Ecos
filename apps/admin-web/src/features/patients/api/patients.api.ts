import { api } from "@/lib/api"
import type {
  CreatePatientInput,
  PatientDetail,
  PatientListItem,
  PatientsListParams,
  StudentOverview,
  UpdatePatientInput,
} from "@/features/patients/types/patient.types"

export interface AssignTherapistInput {
  notes?: string
  studentId: number
  therapistId: string
}

export const patientsApi = {
  assignTherapist: (input: AssignTherapistInput) =>
    api.post("/therapist-assignments", input),
  create: (input: CreatePatientInput) =>
    api.post<PatientDetail, CreatePatientInput>("/students", input),
  getById: (id: number, signal?: AbortSignal) =>
    api.get<PatientDetail>(`/students/${id}`, { signal }),
  getOverview: (studentId: number, signal?: AbortSignal) =>
    api.get<StudentOverview>(`/students/${studentId}/overview`, { signal }),
  list: (params: PatientsListParams, signal?: AbortSignal) =>
    api.get<readonly PatientListItem[]>("/students", {
      params: {
        skip: params.skip,
        take: params.take,
        ...(params.search ? { search: params.search } : {}),
        ...(params.therapistId ? { therapistId: params.therapistId } : {}),
      },
      signal,
    }),
  update: (id: number, input: UpdatePatientInput) =>
    api.patch<PatientDetail, UpdatePatientInput>(`/students/${id}`, input),
}
