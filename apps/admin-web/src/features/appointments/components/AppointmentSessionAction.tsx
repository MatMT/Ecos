"use client"

import { Button } from "@/components/ui/button"
import type { AuthenticatedUser } from "@/features/auth/types/auth.types"
import type { AppointmentResponse } from "@/features/appointments/dto/appointments.dto"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import { canRegisterSessionForAppointment } from "@/features/appointments/utils/appointment-session"
import { useRouter } from "next/navigation"

interface AppointmentSessionActionProps {
  appointment: AppointmentResponse
  currentUser: AuthenticatedUser | undefined
  variant?: "default" | "outline"
}

export function AppointmentSessionAction({
  appointment,
  currentUser,
  variant = "outline",
}: AppointmentSessionActionProps) {
  const router = useRouter()

  if (appointment.hasClinicalNote) {
    return (
      <span className="text-sm font-medium text-muted-foreground">
        Sesión registrada
      </span>
    )
  }

  if (!canRegisterSessionForAppointment(appointment, currentUser)) {
    return null
  }

  const patientId = appointment.studentId
  if (patientId === null) {
    return null
  }

  return (
    <Button
      onClick={() =>
        router.push(
          patientRoutes.newSessionFromAppointment(patientId, appointment.id),
        )
      }
      size="sm"
      type="button"
      variant={variant}
    >
      Registrar sesión
    </Button>
  )
}
