import type {
  ClinicalRecord,
  ClinicalRecordFormValues,
  CreateClinicalRecordInput,
  UpdateClinicalRecordInput,
} from "@/features/clinical-record/types/clinical-record.types"

export const EMPTY_CLINICAL_RECORD_FORM_VALUES: ClinicalRecordFormValues = {
  initialReason: "",
  psychologicalHistory: "",
  psychiatricHistory: "",
  relevantFamilyHistory: "",
  previousTreatments: "",
  currentMedication: "",
  generalObservations: "",
}

export function toClinicalRecordFormValues(
  record: ClinicalRecord,
): ClinicalRecordFormValues {
  return {
    initialReason: record.initialReason ?? "",
    psychologicalHistory: record.psychologicalHistory ?? "",
    psychiatricHistory: record.psychiatricHistory ?? "",
    relevantFamilyHistory: record.relevantFamilyHistory ?? "",
    previousTreatments: record.previousTreatments ?? "",
    currentMedication: record.currentMedication ?? "",
    generalObservations: record.generalObservations ?? "",
  }
}

export function toCreateClinicalRecordInput(
  values: ClinicalRecordFormValues,
): CreateClinicalRecordInput {
  return omitEmptyValues(values)
}

export function toUpdateClinicalRecordInput(
  values: ClinicalRecordFormValues,
): UpdateClinicalRecordInput {
  return {
    initialReason: toNullableText(values.initialReason),
    psychologicalHistory: toNullableText(values.psychologicalHistory),
    psychiatricHistory: toNullableText(values.psychiatricHistory),
    relevantFamilyHistory: toNullableText(values.relevantFamilyHistory),
    previousTreatments: toNullableText(values.previousTreatments),
    currentMedication: toNullableText(values.currentMedication),
    generalObservations: toNullableText(values.generalObservations),
  }
}

function omitEmptyValues(
  values: ClinicalRecordFormValues,
): CreateClinicalRecordInput {
  const initialReason = toOptionalText(values.initialReason)
  const psychologicalHistory = toOptionalText(values.psychologicalHistory)
  const psychiatricHistory = toOptionalText(values.psychiatricHistory)
  const relevantFamilyHistory = toOptionalText(values.relevantFamilyHistory)
  const previousTreatments = toOptionalText(values.previousTreatments)
  const currentMedication = toOptionalText(values.currentMedication)
  const generalObservations = toOptionalText(values.generalObservations)

  return {
    ...(initialReason ? { initialReason } : {}),
    ...(psychologicalHistory ? { psychologicalHistory } : {}),
    ...(psychiatricHistory ? { psychiatricHistory } : {}),
    ...(relevantFamilyHistory ? { relevantFamilyHistory } : {}),
    ...(previousTreatments ? { previousTreatments } : {}),
    ...(currentMedication ? { currentMedication } : {}),
    ...(generalObservations ? { generalObservations } : {}),
  }
}

function toOptionalText(value: string): string | undefined {
  return value.trim() || undefined
}

function toNullableText(value: string): string | null {
  return value.trim() || null
}
