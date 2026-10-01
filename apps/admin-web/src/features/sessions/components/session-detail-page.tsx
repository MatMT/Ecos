"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { useState, type ReactNode } from "react"
import { CalendarDays, Clock3, UserRound } from "lucide-react"
import { useDashboardBreadcrumbLabel } from "@/components/common/DashboardBreadcrumbs"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { useSession } from "@/features/auth/hooks/use-session"
import type { AuthenticatedUser } from "@/features/auth/types/auth.types"
import { SessionForm } from "@/features/sessions/components/session-form"
import { useSessionDetail } from "@/features/sessions/hooks/use-session-detail"
import type { SessionDetail } from "@/features/sessions/types/session.types"
import {
  formatObservedEmotionalState,
  formatSessionDateTime,
  formatSessionModality,
  formatSessionType,
} from "@/features/sessions/utils/session-formatters"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import { ApiError } from "@/lib/api"
import { can } from "@/lib/permissions"

interface SessionDetailPageProps {
  noteId: number
  patientId: number
}

export function SessionDetailPage({ noteId, patientId }: SessionDetailPageProps) {
  const session = useSession()

  if (session.isPending) {
    return <SessionDetailSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar el detalle clínico. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar la sesión"
      />
    )
  }

  if (!session.isAuthenticated || !session.data) {
    return <ForbiddenState variant="embedded" />
  }

  return (
    <SessionDetailData
      currentUser={session.data}
      noteId={noteId}
      patientId={patientId}
    />
  )
}

function SessionDetailData({
  currentUser,
  noteId,
  patientId,
}: SessionDetailPageProps & { currentUser: AuthenticatedUser }) {
  const detailQuery = useSessionDetail(patientId, noteId)

  if (detailQuery.isPending) {
    return <SessionDetailSkeleton />
  }

  if (detailQuery.isError) {
    if (detailQuery.error instanceof ApiError) {
      if (detailQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (detailQuery.error.status === 404) {
        notFound()
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el detalle de la sesión clínica. Por favor, intente nuevamente."
        onRetry={() => void detailQuery.refetch()}
        title="No fue posible cargar la sesión"
      />
    )
  }

  if (!detailQuery.data) {
    return <SessionDetailSkeleton />
  }

  const detail = detailQuery.data
  const context: PatientWorkspaceContext = {
    email: detail.patient.email,
    fullName: detail.patient.fullName,
    patientId: detail.patient.id,
    studentCode: detail.patient.studentCode,
    therapist: detail.patient.assignedTherapist,
  }

  return (
    <PatientWorkspace context={context} role={currentUser.role}>
      <SessionDetailContent currentUser={currentUser} detail={detail} />
    </PatientWorkspace>
  )
}

function SessionDetailContent({
  currentUser,
  detail,
}: {
  currentUser: AuthenticatedUser
  detail: SessionDetail
}) {
  const [isEditing, setIsEditing] = useState(false)
  const patientId = detail.patient.id
  const timeZone = detail.patient.institutionTimezone
  const detailPath = patientRoutes.sessionDetail(patientId, detail.id)
  useDashboardBreadcrumbLabel(
    formatSessionDateTime(detail.sessionDate, timeZone),
    detailPath,
  )

  const canEdit =
    can(currentUser.role, "clinical-notes.manage") &&
    currentUser.id === detail.therapist.id &&
    !detail.isVoided

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={patientRoutes.sessions(patientId)}>Volver a sesiones</Link>
            </Button>
            {canEdit && !isEditing ? (
              <PermissionGate permission="clinical-notes.manage">
                <Button onClick={() => setIsEditing(true)} type="button">
                  Editar sesión
                </Button>
              </PermissionGate>
            ) : null}
          </div>
        }
        description="Consulte la información profesional documentada para esta sesión clínica."
        title="Sesión clínica"
      />

      {isEditing ? (
        <SessionForm
          key={`${detail.id}-${detail.updatedAt}`}
          mode="edit"
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
          patientId={patientId}
          patientName={detail.patient.fullName?.trim() || "Paciente sin nombre registrado"}
          session={detail}
          timeZone={timeZone}
        />
      ) : (
        <SessionReadView detail={detail} timeZone={timeZone} />
      )}
    </div>
  )
}

function SessionReadView({
  detail,
  timeZone,
}: {
  detail: SessionDetail
  timeZone: string
}) {
  const therapistName = detail.therapist.fullName?.trim() || "Terapeuta no registrado"

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                <time dateTime={detail.sessionDate ?? undefined}>
                  {formatSessionDateTime(detail.sessionDate, timeZone)}
                </time>
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {formatSessionType(detail.sessionType)}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <UserRound aria-hidden="true" className="size-4" />
                  Registrado por {therapistName}
                </span>
                {detail.durationMinutes !== null ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 aria-hidden="true" className="size-4" />
                    {detail.durationMinutes} minutos
                  </span>
                ) : null}
                {detail.modality ? <span>{formatSessionModality(detail.modality)}</span> : null}
              </div>
            </div>
            {detail.isVoided ? <StatusBadge label="Nota anulada" tone="danger" /> : null}
          </div>
        </CardContent>
      </Card>

      {detail.appointment ? (
        <ReadSection title="Cita asociada">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <ReadDefinition label="Fecha y hora" value={formatSessionDateTime(detail.appointment.appointmentDate, timeZone)} />
            <ReadDefinition label="Tipo" value={formatSessionType(detail.appointment.sessionType)} />
            <ReadDefinition
              label="Duración"
              value={detail.appointment.durationMinutes === null ? null : `${detail.appointment.durationMinutes} minutos`}
            />
            <ReadDefinition
              label="Modalidad"
              value={detail.appointment.modality ? formatSessionModality(detail.appointment.modality) : null}
            />
          </dl>
        </ReadSection>
      ) : null}

      <ReadSection title="Información de la sesión">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <ReadDefinition label="Diagnóstico registrado" value={detail.sessionDiagnosis} />
          <ReadDefinition
            label="Estado emocional observado"
            value={detail.observedEmotionalState ? formatObservedEmotionalState(detail.observedEmotionalState) : null}
          />
        </dl>
      </ReadSection>

      <ReadSection title="Notas y observaciones">
        <ReadText label="Notas de la sesión" value={detail.sessionSummary} />
        <ReadText label="Observaciones clínicas" value={detail.observations} />
      </ReadSection>

      <ReadSection title="Impresión e intervención clínica">
        <ReadText label="Impresión clínica" value={detail.clinicalImpression} />
        <ReadText label="Intervenciones realizadas" value={detail.interventions} />
      </ReadSection>

      <ReadSection title="Acuerdos y seguimiento">
        <ReadText label="Acuerdos establecidos" value={detail.agreements} />
        <ReadText label="Plan de seguimiento" value={detail.followUpPlan} />
      </ReadSection>

      {detail.aiAssistantAnalysis ? (
        <ReadSection
          description="Contenido complementario generado por ECOS; no sustituye la valoración profesional."
          title="Análisis complementario de ECOS"
        >
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {detail.aiAssistantAnalysis}
          </p>
        </ReadSection>
      ) : null}

      <Card>
        <CardContent className="space-y-1 p-5 text-xs text-muted-foreground">
          <p>Registrada el {formatSessionDateTime(detail.createdAt, timeZone)}.</p>
          <p>Última actualización: {formatSessionDateTime(detail.updatedAt, timeZone)}.</p>
          {detail.voidedAt ? <p>Nota anulada el {formatSessionDateTime(detail.voidedAt, timeZone)}.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ReadSection({
  children,
  description,
  title,
}: {
  children: ReactNode
  description?: string
  title: string
}) {
  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function ReadDefinition({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value ?? "Sin información registrada."}</dd>
    </div>
  )
}

function ReadText({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium text-foreground">{label}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value ?? "Sin información registrada."}
      </p>
    </div>
  )
}

function SessionDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
