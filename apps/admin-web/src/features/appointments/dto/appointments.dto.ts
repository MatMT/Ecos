import { z } from "zod"

export const appointmentModalitySchema = z.enum(["in_person", "virtual"])

export const createAppointmentSchema = z.object({
  studentId: z.number().min(1, "El paciente es requerido"),
  doctorId: z.string().uuid("El terapeuta es requerido"),
  sessionTitle: z.string().optional(),
  sessionType: z.string().optional(),
  appointmentDate: z.string().datetime("Fecha y hora inválidas"),
  durationMinutes: z.number().min(1).optional(),
  modality: appointmentModalitySchema,
  reason: z.string().optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  cancelReason: z.string().min(1, "El motivo de cancelación es requerido"),
})

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().datetime("Fecha y hora inválidas"),
  doctorId: z.string().uuid("El terapeuta es requerido"),
  reason: z.string().optional(),
})

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>

export interface AppointmentResponse {
  id: number
  studentId: number | null
  doctorId: string | null
  sessionTitle: string | null
  sessionType: string | null
  appointmentDate: string | null
  hasClinicalNote: boolean
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled"
  durationMinutes: number | null
  endAt: string | null
  modality: string | null
  reason: string | null
  cancelReason: string | null
  createdById: string | null
  rescheduledFromId: number | null
  createdAt: string
  updatedAt: string
  // relations
  student?: {
    id: number
    studentCode: string | null
    primaryDiagnosis: string | null
    user: {
      id: string
      fullName: string | null
      email: string
    }
  }
  doctor?: {
    id: string
    fullName: string | null
    email: string
  }
}
