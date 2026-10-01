import { z } from "zod"

const sessionFormValuesSchema = z.object({
  agreements: z.string(),
  clinicalImpression: z.string(),
  durationMinutes: z
    .string()
    .refine(
      (value) => {
        const normalized = value.trim()
        return !normalized || (Number.isSafeInteger(Number(normalized)) && Number(normalized) > 0)
      },
      "La duración debe ser un número entero mayor que cero.",
    ),
  followUpPlan: z.string(),
  interventions: z.string(),
  modality: z.enum(["", "in_person", "virtual"]),
  observations: z.string(),
  observedEmotionalState: z.enum(["", "calm", "anxious", "sad", "euphoric", "other"]),
  sessionDate: z.string(),
  sessionDiagnosis: z.string().max(255, "El diagnóstico registrado no puede exceder 255 caracteres."),
  sessionSummary: z.string(),
  sessionType: z.string().max(255, "El tipo de sesión no puede exceder 255 caracteres."),
})

export const createSessionFormSchema = sessionFormValuesSchema.refine(
  (values) => values.sessionDate.trim().length > 0,
  {
    message: "La fecha clínica es obligatoria.",
    path: ["sessionDate"],
  },
)

export const editSessionFormSchema = sessionFormValuesSchema

export type SessionFormValues = z.infer<typeof sessionFormValuesSchema>
