export const ALERT_STATUS_VALUES = ["new", "reviewed", "in_follow_up", "closed"] as const
export const ALERT_TYPE_VALUES = ["panic_button", "biometric_anomaly", "ai_risk"] as const
export const ALERT_PRIORITY_VALUES = ["low", "medium", "high", "critical"] as const

export type AlertStatus = (typeof ALERT_STATUS_VALUES)[number]
export type AlertType = (typeof ALERT_TYPE_VALUES)[number]
export type AlertPriority = (typeof ALERT_PRIORITY_VALUES)[number]

export interface AlertListItem {
  alertType: AlertType | null
  closedAt: string | null
  createdAt: string
  id: number
  priority: AlertPriority | null
  reviewedAt: string | null
  status: AlertStatus
}

export interface AlertActorSummary {
  fullName: string | null
}

export interface AlertAssignedTherapistSummary extends AlertActorSummary {
  email: string | null
  id: string
}

export interface AlertDetailPatient {
  assignedTherapist: AlertAssignedTherapistSummary | null
  email: string | null
  fullName: string | null
  id: number
  institutionTimezone: string
  studentCode: string | null
}

export interface AlertDetail {
  alertType: AlertType | null
  closedAt: string | null
  closedBy: AlertActorSummary | null
  contextSummary: string | null
  createdAt: string
  description: string | null
  id: number
  patient: AlertDetailPatient
  priority: AlertPriority | null
  reviewedAt: string | null
  reviewedBy: AlertActorSummary | null
  status: AlertStatus
  updatedAt: string
}

export interface PatientAlertsMeta {
  institutionTimezone: string
  skip: number
  take: number
  total: number
  totalPages: number
}

export interface PatientAlertsResponse {
  data: AlertListItem[]
  meta: PatientAlertsMeta
}

export interface PatientAlertsParams {
  alertType?: AlertType
  priority?: AlertPriority
  skip: number
  status?: AlertStatus
  take: number
}

export const DEFAULT_ALERTS_PAGE = 1
export const DEFAULT_ALERTS_TAKE = 20
export const ALERTS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
