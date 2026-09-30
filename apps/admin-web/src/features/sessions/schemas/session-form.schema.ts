import { z } from "zod"

export const sessionFormSchema = z.object({
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
  sessionDate: z.string().min(1, "La fecha clínica es obligatoria."),
  sessionDiagnosis: z.string().max(255, "El diagnóstico registrado no puede exceder 255 caracteres."),
  sessionSummary: z.string(),
  sessionType: z.string().max(255, "El tipo de sesión no puede exceder 255 caracteres."),
})

export type SessionFormValues = z.infer<typeof sessionFormSchema>
