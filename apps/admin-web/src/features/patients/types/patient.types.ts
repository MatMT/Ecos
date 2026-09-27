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

export interface PatientListItem {
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
  email: string
  fullName: string
  password: string
  studentCode?: string
}

export interface UpdatePatientInput {
  studentCode?: string
}

export interface PatientFormValues {
  email: string
  fullName: string
  password: string
  studentCode: string
}

export interface PatientsListParams {
  skip: number
  take: number
}

export const INITIAL_PATIENTS_LIST_PARAMS: PatientsListParams = {
  skip: 0,
  take: 20,
}

export const EMPTY_PATIENT_FORM_VALUES: PatientFormValues = {
  email: "",
  fullName: "",
  password: "",
  studentCode: "",
}
