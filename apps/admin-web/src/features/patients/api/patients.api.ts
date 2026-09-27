import { api } from "@/lib/api"
import type {
  CreatePatientInput,
  PatientDetail,
  PatientListItem,
  PatientsListParams,
  UpdatePatientInput,
} from "@/features/patients/types/patient.types"

export const patientsApi = {
  create: (input: CreatePatientInput) =>
    api.post<PatientDetail, CreatePatientInput>("/students", input),
  getById: (id: number, signal?: AbortSignal) =>
    api.get<PatientDetail>(`/students/${id}`, { signal }),
  list: (params: PatientsListParams, signal?: AbortSignal) =>
    api.get<readonly PatientListItem[]>("/students", {
      params: {
        skip: params.skip,
        take: params.take,
      },
      signal,
    }),
  update: (id: number, input: UpdatePatientInput) =>
    api.patch<PatientDetail, UpdatePatientInput>(`/students/${id}`, input),
}
