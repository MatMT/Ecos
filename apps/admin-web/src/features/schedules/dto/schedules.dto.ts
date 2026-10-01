import { z } from "zod"

export const ScheduleResponseSchema = z.object({
  id: z.number(),
  therapistId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(), // "HH:mm"
  endTime: z.string(),   // "HH:mm"
  sessionDurationMinutes: z.number().int().min(1),
  breakMinutes: z.number().int().min(0),
  validFrom: z.string().nullable().optional(),
  validTo: z.string().nullable().optional(),
  active: z.boolean(),
})

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>

export const CreateScheduleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1, "Día requerido").max(7),
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de fin requerida"),
  sessionDurationMinutes: z.coerce.number().int().min(1, "Mínimo 1 minuto"),
  breakMinutes: z.coerce.number().int().min(0, "Mínimo 0 minutos").default(0),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
})

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>

export const ScheduleExceptionResponseSchema = z.object({
  id: z.number(),
  therapistId: z.string().uuid(),
  date: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  available: z.boolean(),
  reason: z.string().nullable().optional(),
})

export type ScheduleExceptionResponse = z.infer<typeof ScheduleExceptionResponseSchema>

export const CreateScheduleExceptionSchema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  available: z.boolean(),
  reason: z.string().optional(),
})

export type CreateScheduleExceptionInput = z.infer<typeof CreateScheduleExceptionSchema>

export const AvailabilitySlotResponseSchema = z.object({
  start: z.string(),
  end: z.string(),
})

export type AvailabilitySlotResponse = z.infer<typeof AvailabilitySlotResponseSchema>
