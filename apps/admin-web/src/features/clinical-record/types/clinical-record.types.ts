export interface ClinicalRecord {
  id: number
  studentId: number
  openedAt: string
  initialReason: string | null
  psychologicalHistory: string | null
  psychiatricHistory: string | null
  relevantFamilyHistory: string | null
  previousTreatments: string | null
  currentMedication: string | null
  generalObservations: string | null
  createdAt: string
  updatedAt: string
}

export interface ClinicalRecordFormValues {
  initialReason: string
  psychologicalHistory: string
  psychiatricHistory: string
  relevantFamilyHistory: string
  previousTreatments: string
  currentMedication: string
  generalObservations: string
}

export interface CreateClinicalRecordInput {
  initialReason?: string
  psychologicalHistory?: string
  psychiatricHistory?: string
  relevantFamilyHistory?: string
  previousTreatments?: string
  currentMedication?: string
  generalObservations?: string
}

export interface UpdateClinicalRecordInput {
  initialReason?: string | null
  psychologicalHistory?: string | null
  psychiatricHistory?: string | null
  relevantFamilyHistory?: string | null
  previousTreatments?: string | null
  currentMedication?: string | null
  generalObservations?: string | null
}
