"use client"

import { notFound, useRouter } from "next/navigation"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { useSession } from "@/features/auth/hooks/use-session"
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
        />
      </PermissionGate>
    </PatientWorkspace>
  )
}

function NewSessionContent({
  patientId,
  patientName,
  timeZone,
}: {
  patientId: number
  patientName: string
  timeZone: string
}) {
  const router = useRouter()
  const sessionsPath = patientRoutes.sessions(patientId)

  return (
    <div className="space-y-6">
      <PageHeader
        description="Registre de forma explícita la información profesional de la sesión terapéutica."
        title="Nueva sesión"
      />
      <SessionForm
        onCancel={() => router.push(sessionsPath)}
        onSaved={() => router.push(sessionsPath)}
        patientId={patientId}
        patientName={patientName}
        timeZone={timeZone}
      />
    </div>
  )
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
