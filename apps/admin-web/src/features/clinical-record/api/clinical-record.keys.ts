export const clinicalRecordKeys = {
  all: ["clinical-records"] as const,
  details: () => [...clinicalRecordKeys.all, "detail"] as const,
  byPatient: (studentId: number) =>
    [...clinicalRecordKeys.details(), studentId] as const,
}
