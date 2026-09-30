export interface SessionTherapistSummary {
  fullName: string | null
  id: string
}

export interface SessionListItem {
  appointmentDate: string | null
  appointmentId: number | null
  appointmentStatus: string | null
  createdAt: string
  durationMinutes: number | null
  id: number
  isVoided: boolean
  modality: string | null
  observedEmotionalState: string | null
  sessionDate: string | null
  sessionType: string | null
  therapist: SessionTherapistSummary | null
  updatedAt: string
  voidedAt: string | null
}

export interface PatientSessionsMeta {
  institutionTimezone: string
  skip: number
  take: number
  total: number
  totalPages: number
}

export interface PatientSessionsResponse {
  data: SessionListItem[]
  meta: PatientSessionsMeta
}

export interface PatientSessionsParams {
  skip: number
  take: number
}

export type SessionModality = "in_person" | "virtual"

export type ObservedEmotionalState =
  | "calm"
  | "anxious"
  | "sad"
  | "euphoric"
  | "other"

export interface CreateManualSessionInput {
  agreements?: string
  clinicalImpression?: string
  durationMinutes?: number
  followUpPlan?: string
  interventions?: string
  modality?: SessionModality
  observations?: string
  observedEmotionalState?: ObservedEmotionalState
  sessionDate: string
  sessionDiagnosis?: string
  sessionSummary?: string
  sessionType?: string
}

export interface CreatedSession {
  id: number
}

export const DEFAULT_SESSIONS_PAGE = 1
export const DEFAULT_SESSIONS_TAKE = 20
export const SESSIONS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
