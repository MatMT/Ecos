import type { AuthenticatedUser } from "@/features/auth/types/auth.types"
import type { AppointmentResponse } from "@/features/appointments/dto/appointments.dto"
import { can } from "@/lib/permissions"

export function canRegisterSessionForAppointment(
  appointment: AppointmentResponse,
  currentUser: AuthenticatedUser | undefined,
): boolean {
  return Boolean(
    currentUser &&
      currentUser.role === "psychologist" &&
      can(currentUser.role, "clinical-notes.manage") &&
      appointment.doctorId === currentUser.id &&
      appointment.studentId !== null &&
      appointment.appointmentDate !== null &&
      !appointment.hasClinicalNote &&
      (appointment.status === "confirmed" || appointment.status === "completed"),
  )
}

export function getAppointmentSessionAvailabilityMessage(
  appointment: AppointmentResponse,
  currentUser: AuthenticatedUser,
): string | null {
  if (appointment.studentId === null) {
    return "La cita no tiene un paciente asociado."
  }

  if (appointment.appointmentDate === null) {
    return "La cita no tiene una fecha clínica disponible."
  }

  if (appointment.doctorId !== currentUser.id) {
    return "La cita no está asignada al terapeuta autenticado."
  }

  if (appointment.hasClinicalNote) {
    return "Esta cita ya cuenta con una sesión registrada."
  }

  if (
    appointment.status !== "confirmed" &&
    appointment.status !== "completed"
  ) {
    return "La cita ya no se encuentra en un estado compatible para registrar una sesión."
  }

  return null
}
