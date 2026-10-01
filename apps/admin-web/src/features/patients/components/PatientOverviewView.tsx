"use client"

import { notFound } from "next/navigation"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { useSession } from "@/features/auth/hooks/use-session"
import {
  BiometricSummary,
  NextAppointment,
  OpenAlerts,
  PendingActivities,
  RecentFollowUp,
  RecentSharedContent,
  TreatmentPlan,
} from "@/features/patients/components/patient-overview-blocks"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { usePatientOverview } from "@/features/patients/hooks/use-patient-overview"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { ApiError } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PatientOverviewViewProps {
  patientId: number
}

export function PatientOverviewView({ patientId }: PatientOverviewViewProps) {
  const session = useSession()

  if (session.isPending) {
    return <PatientOverviewSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No se pudo validar la sesión actual para cargar la ficha del paciente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar la ficha"
      />
    )
  }

  if (!session.isAuthenticated || !session.data) {
    return <ForbiddenState variant="embedded" />
  }

  if (session.data.role === "administrator") {
    return (
      <AdministrativePatientDetail
        patientId={patientId}
        role={session.data.role}
      />
    )
  }

  if (session.data.role === "psychologist") {
    return (
      <ClinicalPatientOverview patientId={patientId} role={session.data.role} />
    )
  }

  return <ForbiddenState variant="embedded" />
}

interface PatientDetailViewProps extends PatientOverviewViewProps {
  role: "administrator" | "psychologist"
}

function AdministrativePatientDetail({
  patientId,
  role,
}: PatientDetailViewProps) {
  const patientQuery = usePatient(patientId)

  if (patientQuery.isPending) {
    return <PatientOverviewSkeleton />
  }

  if (patientQuery.isError) {
    return (
      <PatientQueryError
        error={patientQuery.error}
        onRetry={patientQuery.refetch}
      />
    )
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
    <PatientWorkspace context={context} role={role}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Información administrativa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailItem
            label="Correo electrónico"
            value={patient.user.email ?? "Sin correo electrónico registrado"}
          />
          <DetailItem
            label="Código institucional"
            value={patient.studentCode ?? "Sin código institucional asignado"}
          />
        </CardContent>
      </Card>
    </PatientWorkspace>
  )
}

function ClinicalPatientOverview({ patientId, role }: PatientDetailViewProps) {
  const overviewQuery = usePatientOverview(patientId)

  if (overviewQuery.isPending) {
    return <PatientOverviewSkeleton />
  }

  if (overviewQuery.isError) {
    return (
      <PatientQueryError
        error={overviewQuery.error}
        onRetry={overviewQuery.refetch}
      />
    )
  }

  const overview = overviewQuery.data
  const context: PatientWorkspaceContext = {
    email: overview.student.email,
    fullName: overview.student.fullName,
    patientId: overview.student.id,
    studentCode: overview.student.studentCode,
    therapist: overview.currentTherapist,
  }

  return (
    <PatientWorkspace context={context} role={role}>
      <PermissionGate permission="biometrics.view">
        <BiometricSummary
          biometrics={overview.recentBiometricSummary}
          patientId={overview.student.id}
          timeZone={overview.institutionTimezone}
        />
      </PermissionGate>

      <div className="grid gap-4 lg:grid-cols-2">
        <PermissionGate permission="appointments.view">
          <NextAppointment overview={overview} />
        </PermissionGate>
        <PermissionGate permission="alerts.view">
          <OpenAlerts overview={overview} />
        </PermissionGate>
        <PermissionGate permission="treatment-plans.view">
          <TreatmentPlan overview={overview} />
        </PermissionGate>
        <PermissionGate permission="patient-activities.view">
          <PendingActivities overview={overview} />
        </PermissionGate>
        <PermissionGate permission="clinical-notes.view">
          <RecentFollowUp overview={overview} />
        </PermissionGate>
        <PermissionGate permission="shared-content.view">
          <RecentSharedContent overview={overview} />
        </PermissionGate>
      </div>
    </PatientWorkspace>
  )
}

function PatientQueryError({
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
      description="No se pudo cargar la información del paciente. Por favor, intente nuevamente."
      onRetry={() => void onRetry()}
      title="No fue posible cargar la ficha"
    />
  )
}

function PatientOverviewSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-44 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-44" key={index} />
        ))}
      </div>
    </div>
  )
}

interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-foreground">{value}</dd>
    </div>
  )
}
