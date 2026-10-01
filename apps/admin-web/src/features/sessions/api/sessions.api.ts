import { api } from "@/lib/api"
import type {
  CreatedSession,
  CreateAppointmentSessionInput,
  CreateManualSessionInput,
  PatientSessionsParams,
  PatientSessionsResponse,
  SessionDetail,
  UpdateSessionInput,
} from "@/features/sessions/types/session.types"

export const sessionsApi = {
  createForAppointment: (input: CreateAppointmentSessionInput) =>
    api.post<CreatedSession, CreateAppointmentSessionInput>(
      "/clinical-notes",
      input,
    ),
  createManual: (patientId: number, input: CreateManualSessionInput) =>
    api.post<CreatedSession, CreateManualSessionInput>(
      `/students/${patientId}/clinical-notes`,
      input,
    ),
  getByPatient: (patientId: number, noteId: number, signal?: AbortSignal) =>
    api.get<SessionDetail>(`/students/${patientId}/clinical-notes/${noteId}`, {
      signal,
    }),
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
  update: (noteId: number, input: UpdateSessionInput) =>
    api.patch<SessionDetail, UpdateSessionInput>(
      `/clinical-notes/${noteId}`,
      input,
    ),
}
