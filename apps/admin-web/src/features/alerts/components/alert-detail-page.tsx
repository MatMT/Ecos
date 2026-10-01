"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { useState, type ReactNode } from "react"
import { CalendarDays, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
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
import {
  useAlertDetail,
  useCloseAlert,
  useReviewAlert,
} from "@/features/alerts/hooks/use-alert-detail"
import type { AlertDetail } from "@/features/alerts/types/alert.types"
import {
  formatAlertType,
  getAlertPriorityPresentation,
  getAlertStatusPresentation,
} from "@/features/alerts/utils/alert-formatters"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import { formatOverviewDateTime } from "@/features/patients/utils/patient-overview-formatters"
import { ApiError } from "@/lib/api"
import { can } from "@/lib/permissions"
import { useDashboardBreadcrumbLabel } from "@/components/common/DashboardBreadcrumbs"

interface AlertDetailPageProps {
  alertId: number
  patientId: number
}

export function AlertDetailPage({ alertId, patientId }: AlertDetailPageProps) {
  const session = useSession()

  if (session.isPending) {
    return <AlertDetailSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar la alerta. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar la alerta"
      />
    )
  }

  if (!session.isAuthenticated || !session.data || !can(session.data.role, "alerts.view")) {
    return <ForbiddenState variant="embedded" />
  }

  return (
    <AlertDetailData
      alertId={alertId}
      currentUser={session.data}
      patientId={patientId}
    />
  )
}

function AlertDetailData({
  alertId,
  currentUser,
  patientId,
}: AlertDetailPageProps & { currentUser: AuthenticatedUser }) {
  const detailQuery = useAlertDetail(patientId, alertId)

  if (detailQuery.isPending) {
    return <AlertDetailSkeleton />
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
        description="No fue posible cargar el detalle de la alerta. Por favor, intente nuevamente."
        onRetry={() => void detailQuery.refetch()}
        title="No fue posible cargar la alerta"
      />
    )
  }

  if (!detailQuery.data) {
    return <AlertDetailSkeleton />
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
      <AlertDetailContent
        currentUser={currentUser}
        detail={detail}
        onConflictRefresh={detailQuery.refetch}
      />
    </PatientWorkspace>
  )
}

function AlertDetailContent({
  currentUser,
  detail,
  onConflictRefresh,
}: {
  currentUser: AuthenticatedUser
  detail: AlertDetail
  onConflictRefresh: () => Promise<unknown>
}) {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const patientId = detail.patient.id
  const timeZone = detail.patient.institutionTimezone
  const reviewAlert = useReviewAlert(patientId, detail.id)
  const closeAlert = useCloseAlert(patientId, detail.id)
  const detailPath = patientRoutes.alertDetail(patientId, detail.id)
  const status = getAlertStatusPresentation(detail.status)
  const priority = getAlertPriorityPresentation(detail.priority)
  const canManage = can(currentUser.role, "alerts.manage")
  const canReview = canManage && detail.status === "new"
  const canClose =
    canManage &&
    (detail.status === "reviewed" || detail.status === "in_follow_up")

  useDashboardBreadcrumbLabel(
    `${formatAlertType(detail.alertType)} · ${formatAlertDate(detail.createdAt, timeZone)}`,
    detailPath,
  )

  const handleMutationError = async (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      await onConflictRefresh()
      toast.error("La alerta cambió de estado. Se actualizó la información disponible.")
      return
    }

    toast.error("No fue posible actualizar la alerta. Por favor, intente nuevamente.")
  }

  const handleReview = async () => {
    try {
      await reviewAlert.mutateAsync()
      toast.success("La alerta fue marcada como revisada.")
    } catch (error) {
      await handleMutationError(error)
    }
  }

  const handleClose = async () => {
    try {
      await closeAlert.mutateAsync()
      setIsCloseDialogOpen(false)
      toast.success("La alerta fue cerrada correctamente.")
    } catch (error) {
      await handleMutationError(error)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={patientRoutes.alerts(patientId)}>Volver a alertas</Link>
            </Button>
            {canReview ? (
              <PermissionGate permission="alerts.manage">
                <Button
                  aria-busy={reviewAlert.isPending}
                  disabled={reviewAlert.isPending || closeAlert.isPending}
                  onClick={() => void handleReview()}
                  type="button"
                >
                  {reviewAlert.isPending ? "Marcando…" : "Marcar como revisada"}
                </Button>
              </PermissionGate>
            ) : null}
            {canClose ? (
              <PermissionGate permission="alerts.manage">
                <Button
                  disabled={reviewAlert.isPending || closeAlert.isPending}
                  onClick={() => setIsCloseDialogOpen(true)}
                  type="button"
                  variant="destructive"
                >
                  Cerrar alerta
                </Button>
              </PermissionGate>
            ) : null}
          </div>
        }
        description="Consulte la información registrada y el estado de seguimiento de esta alerta persistida."
        title="Detalle de alerta"
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                <time dateTime={detail.createdAt}>
                  Registrada el {formatOverviewDateTime(detail.createdAt, timeZone)}
                </time>
              </div>
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
                <ShieldAlert aria-hidden="true" className="size-5 shrink-0 text-primary" />
                {formatAlertType(detail.alertType)}
              </h2>
              {detail.alertType === "panic_button" ? (
                <p className="text-sm text-muted-foreground">
                  Origen: Aplicación móvil / Botón SOS
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge label={status.label} tone={status.tone} />
              {priority ? <StatusBadge label={priority.label} tone={priority.tone} /> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <ReadSection title="Información de la alerta">
        <ReadText label="Descripción registrada" value={detail.description} />
        {detail.contextSummary ? (
          <ReadText label="Contexto registrado" value={detail.contextSummary} />
        ) : null}
      </ReadSection>

      <ReadSection title="Gestión">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <ReadDefinition label="Estado actual" value={status.label} />
          <ReadDefinition label="Prioridad" value={priority?.label ?? null} />
          <ReadDefinition
            label="Revisada el"
            value={detail.reviewedAt ? formatOverviewDateTime(detail.reviewedAt, timeZone) : null}
          />
          <ReadDefinition
            label="Revisada por"
            value={detail.reviewedBy?.fullName ?? null}
          />
          <ReadDefinition
            label="Cerrada el"
            value={detail.closedAt ? formatOverviewDateTime(detail.closedAt, timeZone) : null}
          />
          <ReadDefinition
            label="Cerrada por"
            value={detail.closedBy?.fullName ?? null}
          />
        </dl>
      </ReadSection>

      <Card>
        <CardContent className="space-y-1 p-5 text-xs text-muted-foreground">
          <p>Registrada el {formatOverviewDateTime(detail.createdAt, timeZone)}.</p>
          <p>Última actualización: {formatOverviewDateTime(detail.updatedAt, timeZone)}.</p>
        </CardContent>
      </Card>

      <ConfirmDialog
        confirmLabel="Cerrar alerta"
        description="Esta alerta quedará registrada como cerrada en el historial."
        isPending={closeAlert.isPending}
        onConfirm={() => void handleClose()}
        onOpenChange={setIsCloseDialogOpen}
        open={isCloseDialogOpen}
        title="Cerrar alerta"
        variant="destructive"
      />
    </div>
  )
}

function ReadSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
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

function formatAlertDate(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "short",
    timeZone,
  }).format(new Date(value))
}

function AlertDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
