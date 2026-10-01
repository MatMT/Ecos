import type {
  CreatePatientInput,
  PatientDetail,
  PatientFormValues,
  UpdatePatientInput,
} from "@/features/patients/types/patient.types"

export function toCreatePatientInput(
  values: PatientFormValues,
): CreatePatientInput {
  return {
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    password: values.password,
    studentCode: toOptionalString(values.studentCode),
  }
}

export function toPatientFormValues(patient: PatientDetail): PatientFormValues {
  return {
    email: patient.user.email ?? "",
    fullName: patient.user.fullName ?? "",
    password: "",
    studentCode: patient.studentCode ?? "",
  }
}

export function toUpdatePatientInput(
  values: PatientFormValues,
): UpdatePatientInput {
  return {
    studentCode: toOptionalString(values.studentCode),
  }
}

function toOptionalString(value: string): string | undefined {
  const normalizedValue = value.trim()

  return normalizedValue.length > 0 ? normalizedValue : undefined
}
