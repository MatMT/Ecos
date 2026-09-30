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

export interface AssignedTherapistSummary{
  email: string | null
  fullName: string | null
  id: string
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

// PATIENT OVERVIEW (FICHA DEL PACIENTE) TYPE --- By Will-Trucker
export interface OverviewStudent{
  email: string | null
  fullName: string | null
  id: number
  primaryDiagnosis: string | null
  studentCode: string | null
}

export interface OverviewAppointment {
  appointmentDate: string
  id: number
  notes: string | null
  reason: string | null
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

export interface OverviewTreatmentPlan {
  diagnosis: string | null
  endsAt: string | null
  id: number
  objective: string | null
  startsAt: string
  status: string
}

export interface OverviewBiometrics {
  createdAt: string
  deviceId: number
  heartRate: number | null
  id: number
  oxygenLevel: number | null
  stressLevel: number | null
  temperature: number | null
  timestamp: string
}

export interface OverviewAlert {
  alertType: string
  createdAt: string
  id: number
  message: string
  priority: "low" | "medium" | "high" | "critical"
  status: "open" | "acknowledged" | "resolved" | "closed"
}

export interface OverviewActivity {
  assignedAt: string
  dueDate: string | null
  id: number
  status: "assigned" | "in_progress" | "completed"
  title: string
}

export interface OverviewClinicalNote {
  createdAt: string
  id: number
  sessionDate: string
  title: string
}

export interface StudentOverview {
   activeTreatmentPlan: OverviewTreatmentPlan | null
  currentTherapist: AssignedTherapistSummary | null
  nextAppointment: OverviewAppointment | null
  openAlerts: OverviewAlert[]
  pendingActivities: OverviewActivity[]
  recentBiometricSummary: OverviewBiometrics | null
  recentClinicalNotes: OverviewClinicalNote[]
  student: OverviewStudent
}
