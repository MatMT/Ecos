"use client"

import { notFound, useRouter, useSearchParams } from "next/navigation"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { useSession } from "@/features/auth/hooks/use-session"
import type { AuthenticatedUser } from "@/features/auth/types/auth.types"
import { useAppointment } from "@/features/appointments/hooks/use-appointments"
import { getAppointmentSessionAvailabilityMessage } from "@/features/appointments/utils/appointment-session"
import { SessionForm } from "@/features/sessions/components/session-form"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { usePatientOverview } from "@/features/patients/hooks/use-patient-overview"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import { ApiError } from "@/lib/api"

interface NewSessionPageProps {
  patientId: number
}

export function NewSessionPage({ patientId }: NewSessionPageProps) {
  const session = useSession()
  const patientQuery = usePatient(patientId)
  const overviewQuery = usePatientOverview(patientId)

  if (session.isPending || patientQuery.isPending || overviewQuery.isPending) {
    return <NewSessionPageSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para registrar la atención clínica. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar el registro de sesión"
      />
    )
  }

  if (!session.isAuthenticated || session.data?.role !== "psychologist") {
    return <ForbiddenState variant="embedded" />
  }

  if (patientQuery.isError) {
    return <PatientContextError error={patientQuery.error} onRetry={patientQuery.refetch} />
  }

  if (overviewQuery.isError) {
    return <PatientContextError error={overviewQuery.error} onRetry={overviewQuery.refetch} />
  }

  const patient = patientQuery.data
  const context: PatientWorkspaceContext = {
    email: patient.user.email,
    fullName: patient.user.fullName,
    patientId: patient.id,
    studentCode: patient.studentCode,
    therapist: patient.assignedDoctor ?? null,
  }

  return (
    <PatientWorkspace context={context} role={session.data.role}>
      <PermissionGate
        fallback={<ForbiddenState variant="embedded" />}
        permission="clinical-notes.manage"
      >
        <NewSessionContent
          patientId={patientId}
          patientName={patient.user.fullName?.trim() || "Paciente sin nombre registrado"}
          timeZone={overviewQuery.data.institutionTimezone}
          currentUser={session.data}
        />
      </PermissionGate>
    </PatientWorkspace>
  )
}

function NewSessionContent({
  currentUser,
  patientId,
  patientName,
  timeZone,
}: {
  currentUser: AuthenticatedUser
  patientId: number
  patientName: string
  timeZone: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionsPath = patientRoutes.sessions(patientId)
  const appointmentId = parseAppointmentId(searchParams.get("appointmentId"))

  return (
    <div className="space-y-6">
      <PageHeader
        description="Registre de forma explícita la información profesional de la sesión terapéutica."
        title="Nueva sesión"
      />
      {appointmentId === "invalid" ? (
        <ErrorState
          description="La cita indicada no es válida. Regrese a Agenda y seleccione una cita disponible."
          title="No fue posible identificar la cita"
        />
      ) : appointmentId ? (
        <AppointmentSessionForm
          appointmentId={appointmentId}
          currentUser={currentUser}
          onCancel={() => router.push(sessionsPath)}
          onSaved={(noteId) => router.push(patientRoutes.sessionDetail(patientId, noteId))}
          patientId={patientId}
          patientName={patientName}
          timeZone={timeZone}
        />
      ) : (
        <SessionForm
          mode="create"
          onCancel={() => router.push(sessionsPath)}
          onSaved={(noteId) => router.push(patientRoutes.sessionDetail(patientId, noteId))}
          patientId={patientId}
          patientName={patientName}
          timeZone={timeZone}
        />
      )}
    </div>
  )
}

function AppointmentSessionForm({
  appointmentId,
  currentUser,
  onCancel,
  onSaved,
  patientId,
  patientName,
  timeZone,
}: {
  appointmentId: number
  currentUser: AuthenticatedUser
  onCancel: () => void
  onSaved: (noteId: number) => void
  patientId: number
  patientName: string
  timeZone: string
}) {
  const appointmentQuery = useAppointment(appointmentId)

  if (appointmentQuery.isPending) {
    return <NewSessionPageSkeleton />
  }

  if (appointmentQuery.isError) {
    if (appointmentQuery.error instanceof ApiError) {
      if (appointmentQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (appointmentQuery.error.status === 404) {
        return (
          <ErrorState
            description="La cita solicitada ya no se encuentra disponible. Regrese a Agenda para seleccionar una cita vigente."
            title="No se encontró la cita"
          />
        )
      }

      if (appointmentQuery.error.status === 409) {
        return (
          <ErrorState
            description="La cita cambió de estado y no puede utilizarse para registrar una sesión."
            onRetry={() => void appointmentQuery.refetch()}
            title="La cita ya no está disponible"
          />
        )
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el contexto de la cita. Por favor, intente nuevamente."
        onRetry={() => void appointmentQuery.refetch()}
        title="No fue posible cargar la cita"
      />
    )
  }

  const appointment = appointmentQuery.data
  if (!appointment || appointment.studentId !== patientId) {
    return (
      <ErrorState
        description="La cita indicada no corresponde al paciente de esta ruta. Regrese a Agenda para iniciar el registro desde la cita correcta."
        title="La cita no corresponde al paciente"
      />
    )
  }

  const availabilityMessage = getAppointmentSessionAvailabilityMessage(
    appointment,
    currentUser,
  )
  if (availabilityMessage) {
    return (
      <ErrorState
        description={availabilityMessage}
        onRetry={() => void appointmentQuery.refetch()}
        title="La cita no está disponible para registro clínico"
      />
    )
  }

  return (
    <SessionForm
      appointmentContext={appointment}
      key={appointment.id}
      mode="create"
      onCancel={onCancel}
      onSaved={onSaved}
      patientId={patientId}
      patientName={patientName}
      timeZone={timeZone}
    />
  )
}

function parseAppointmentId(value: string | null): number | null | "invalid" {
  if (value === null) {
    return null
  }

  const appointmentId = Number(value)
  return Number.isSafeInteger(appointmentId) && appointmentId > 0
    ? appointmentId
    : "invalid"
}

function PatientContextError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return <ForbiddenState variant="embedded" />
    }

    if (error.status === 404) {
      notFound()
    }
  }

  return (
    <ErrorState
      description="No fue posible cargar el contexto del paciente. Por favor, intente nuevamente."
      onRetry={() => void onRetry()}
      title="No fue posible cargar el registro de sesión"
    />
  )
}

function NewSessionPageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
