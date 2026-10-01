import { z } from "zod"

export const TherapistAssignmentResponseSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  therapistId: z.string().uuid(),
  assignedById: z.string().uuid().nullable().optional(),
  startsAt: z.string(),
  endsAt: z.string().nullable().optional(),
  isPrimary: z.boolean(),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type TherapistAssignmentResponse = z.infer<typeof TherapistAssignmentResponseSchema>

export const CreateTherapistAssignmentSchema = z.object({
  studentId: z.number().min(1, "Debe seleccionar un paciente"),
  therapistId: z.string().uuid("El terapeuta es requerido"),
  reason: z.string().optional(),
})

export type CreateTherapistAssignmentDto = z.infer<typeof CreateTherapistAssignmentSchema>
