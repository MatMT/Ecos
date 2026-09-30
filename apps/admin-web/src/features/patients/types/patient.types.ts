export type PatientUserRole = "administrator" | "psychologist" | "student" | null

export interface PatientAccount {
  createdAt: string
  email: string | null
  fullName: string | null
  id: string
  institutionId: number | null
  role: PatientUserRole
  updatedAt: string
}

export interface AssignedTherapistSummary {
  email: string | null
  fullName: string | null
  id: string
  specialty?: string | null
}
export interface PatientListItem {
  assignedDoctor?: AssignedTherapistSummary | null
  assignedDoctorId: string | null
  createdAt: string
  id: number
  primaryDiagnosis: string | null
  studentCode: string | null
  updatedAt: string
  user: PatientAccount
  userId: string
}

export type PatientDetail = PatientListItem

export interface CreatePatientInput {
  assignedDoctorId?: string
  email: string
  fullName: string
  password: string
  studentCode?: string
}

export interface UpdatePatientInput {
  primaryDiagnosis?: string
  studentCode?: string
}
export interface PatientFormValues {
  assignedDoctorId?: string
  email: string
  fullName: string
  password: string
  studentCode: string
}

export interface PatientsListParams {
  search?: string
  skip: number
  take: number
  therapistId?: string
}

export const INITIAL_PATIENTS_LIST_PARAMS: PatientsListParams = {
  skip: 0,
  take: 20,
}

export const EMPTY_PATIENT_FORM_VALUES: PatientFormValues = {
  assignedDoctorId: "",
  email: "",
  fullName: "",
  password: "",
  studentCode: "",
}

export interface OverviewStudent {
  email: string | null
  fullName: string | null
  id: number
  studentCode: string | null
}

export interface OverviewAppointment {
  appointmentDate: string | null
  durationMinutes: number | null
  endAt: string | null
  id: number
  modality: string | null
  sessionType: string | null
  status: string | null
}

export interface OverviewTreatmentPlan {
  endsAt: string | null
  generalGoal: string | null
  id: number
  startsAt: string
  status: string
  title: string | null
}

export interface OverviewBiometrics {
  avgHeartRate: number | null
  bloodOxygen: number | null
  bodyTemperature: number | null
  id: number
  sleepQualityHours: number | null
  stressLevel: number | null
  timestamp: string | null
}

export interface OverviewAlert {
  alertType: string | null
  createdAt: string
  description: string | null
  id: number
  priority: string | null
  status: string
}

export interface OverviewActivity {
  activityId: number
  assignedAt: string
  dueAt: string | null
  id: number
  origin: string
  status: string
  title: string
}

export interface OverviewFollowUp {
  appointmentId: number | null
  createdAt: string
  id: number
  sessionDate: string | null
  sessionType: string | null
  status: string | null
  therapist: AssignedTherapistSummary | null
}

export interface OverviewSharedContent {
  contentType: string
  id: number
  sharedAt: string
}

export interface StudentOverview {
  activeTreatmentPlan: OverviewTreatmentPlan | null
  currentTherapist: AssignedTherapistSummary | null
  institutionTimezone: string
  nextAppointment: OverviewAppointment | null
  openAlerts: OverviewAlert[]
  pendingActivities: OverviewActivity[]
  recentBiometricSummary: OverviewBiometrics | null
  recentFollowUps: OverviewFollowUp[]
  recentSharedContent: OverviewSharedContent[]
  student: OverviewStudent
}
