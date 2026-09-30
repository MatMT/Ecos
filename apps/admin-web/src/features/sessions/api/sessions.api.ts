import { api } from "@/lib/api"
import type {
  CreatedSession,
  CreateManualSessionInput,
  PatientSessionsParams,
  PatientSessionsResponse,
} from "@/features/sessions/types/session.types"

export const sessionsApi = {
  createManual: (patientId: number, input: CreateManualSessionInput) =>
    api.post<CreatedSession, CreateManualSessionInput>(
      `/students/${patientId}/clinical-notes`,
      input,
    ),
  listByPatient: (
    patientId: number,
    params: PatientSessionsParams,
    signal?: AbortSignal,
  ) =>
    api.get<PatientSessionsResponse>(`/students/${patientId}/clinical-notes`, {
      params: {
        skip: params.skip,
        take: params.take,
      },
      signal,
    }),
}
