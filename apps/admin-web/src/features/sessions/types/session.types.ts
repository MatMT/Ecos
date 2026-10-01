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

export interface SessionDetailTherapist {
  fullName: string | null
  id: string
}

export interface SessionDetailPatient {
  assignedTherapist: (SessionDetailTherapist & { email: string | null }) | null
  email: string | null
  fullName: string | null
  id: number
  institutionTimezone: string
  studentCode: string | null
}

export interface SessionAppointmentContext {
  appointmentDate: string | null
  durationMinutes: number | null
  id: number
  modality: string | null
  sessionType: string | null
}

export interface SessionDetail {
  agreements: string | null
  aiAssistantAnalysis: string | null
  appointment: SessionAppointmentContext | null
  clinicalImpression: string | null
  createdAt: string
  durationMinutes: number | null
  followUpPlan: string | null
  id: number
  interventions: string | null
  isVoided: boolean
  modality: string | null
  observations: string | null
  observedEmotionalState: ObservedEmotionalState | null
  patient: SessionDetailPatient
  sessionDate: string | null
  sessionDiagnosis: string | null
  sessionSummary: string | null
  sessionType: string | null
  therapist: SessionDetailTherapist
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

export interface ClinicalSessionContentInput {
  agreements?: string
  clinicalImpression?: string
  followUpPlan?: string
  interventions?: string
  observations?: string
  observedEmotionalState?: ObservedEmotionalState
  sessionDiagnosis?: string
  sessionSummary?: string
}

export interface UpdateSessionInput {
  agreements: string | null
  clinicalImpression: string | null
  followUpPlan: string | null
  interventions: string | null
  observations: string | null
  observedEmotionalState: ObservedEmotionalState | null
  sessionDiagnosis: string | null
  sessionSummary: string | null
}

export interface CreateManualSessionInput extends ClinicalSessionContentInput {
  durationMinutes?: number
  modality?: SessionModality
  sessionDate: string
  sessionType?: string
}

export interface CreateAppointmentSessionInput extends ClinicalSessionContentInput {
  appointmentId: number
}

export type CreateSessionInput =
  | { data: CreateManualSessionInput; kind: "manual" }
  | { data: CreateAppointmentSessionInput; kind: "appointment" }

export interface CreatedSession {
  id: number
}

export const DEFAULT_SESSIONS_PAGE = 1
export const DEFAULT_SESSIONS_TAKE = 20
export const SESSIONS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
