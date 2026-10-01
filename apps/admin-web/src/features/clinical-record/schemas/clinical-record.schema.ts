import { z } from "zod"

export const clinicalRecordFormSchema = z.object({
  initialReason: z.string().trim(),
  psychologicalHistory: z.string().trim(),
  psychiatricHistory: z.string().trim(),
  relevantFamilyHistory: z.string().trim(),
  previousTreatments: z.string().trim(),
  currentMedication: z.string().trim(),
  generalObservations: z.string().trim(),
})
