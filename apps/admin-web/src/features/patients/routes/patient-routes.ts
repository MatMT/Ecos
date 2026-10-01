export const patientRoutes = {
  activities: (patientId: number) => `/patients/${patientId}/activities`,
  appointments: (patientId: number) => `/patients/${patientId}/appointments`,
  biometrics: (patientId: number) => `/patients/${patientId}/biometrics`,
  clinicalRecord: (patientId: number) =>
    `/patients/${patientId}/clinical-record`,
  create: () => "/patients/new",
  edit: (patientId: number) => `/patients/${patientId}/edit`,
  list: () => "/patients",
  overview: (patientId: number) => `/patients/${patientId}`,
  sessions: (patientId: number) => `/patients/${patientId}/sessions`,
  newSession: (patientId: number) => `/patients/${patientId}/sessions/new`,
  newSessionFromAppointment: (patientId: number, appointmentId: number) =>
    `/patients/${patientId}/sessions/new?appointmentId=${appointmentId}`,
  sessionDetail: (patientId: number, noteId: number) =>
    `/patients/${patientId}/sessions/${noteId}`,
  sharedContent: (patientId: number) => `/patients/${patientId}/shared-content`,
  treatmentPlan: (patientId: number) => `/patients/${patientId}/treatment-plan`,
  alerts: (patientId: number) => `/patients/${patientId}/alerts`,
  alertDetail: (patientId: number, alertId: number) =>
    `/patients/${patientId}/alerts/${alertId}`,
} as const

export type PatientRouteSection = "overview" | "clinicalRecord" | "sessions" | "appointments" | "biometrics" | "alerts" | "treatmentPlan" | "activities" | "sharedContent"
