import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileText,
  HeartPulse,
  Share2,
  Stethoscope,
  Waves,
} from "lucide-react"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMetric } from "@/features/biometrics/components/latest-biometric-metrics"
import {
  formatAlertType,
  getAlertPriorityPresentation,
  getAlertStatusPresentation,
} from "@/features/alerts/utils/alert-formatters"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import type { StudentOverview } from "@/features/patients/types/patient.types"
import {
  formatAppointmentModality,
  formatAppointmentType,
  formatOverviewDate,
  formatOverviewDateTime,
  formatSharedContentType,
  getActivityOriginPresentation,
  getOverviewStatusPresentation,
} from "@/features/patients/utils/patient-overview-formatters"

const MAX_RECENT_ITEMS = 3

export function BiometricSummary({
  biometrics,
  patientId,
  timeZone,
}: {
  biometrics: StudentOverview["recentBiometricSummary"]
  patientId: number
  timeZone: string
}) {
  const recordDate = biometrics?.timestamp
    ? formatOverviewDateTime(biometrics.timestamp, timeZone)
    : "Fecha y hora no registradas"

  return (
    <section aria-labelledby="biometrics-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="text-lg font-semibold tracking-tight"
            id="biometrics-heading"
          >
            Biometría reciente
          </h2>
          <p className="text-sm text-muted-foreground">
            Últimos datos biométricos sincronizados.
          </p>
        </div>
        <Button asChild size="sm" type="button" variant="outline">
          <Link href={patientRoutes.biometrics(patientId)}>Ver biometría</Link>
        </Button>
      </div>
      {biometrics ? (
        <>
          <p className="text-sm text-muted-foreground">
            Último registro: {recordDate}.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              description="Promedio registrado en la ventana sincronizada."
              icon={HeartPulse}
              label="Frecuencia cardíaca"
              value={formatMetric(biometrics.avgHeartRate, " bpm")}
            />
            <StatCard
              description="Índice numérico registrado en la ventana sincronizada."
              icon={Activity}
              label="Índice de estrés"
              value={formatMetric(biometrics.stressLevel)}
            />
            <StatCard
              description="Promedio registrado en la ventana sincronizada."
              icon={Waves}
              label="Oxígeno en sangre"
              value={formatMetric(biometrics.bloodOxygen, "%")}
            />
          </div>
        </>
      ) : (
        <CompactEmptyState message="Sin datos biométricos registrados." />
      )}
    </section>
  )
}

export function NextAppointment({ overview }: { overview: StudentOverview }) {
  const appointment = overview.nextAppointment

  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.appointments(overview.student.id)}>Ver citas</Link>
        </Button>
      }
      icon={CalendarClock}
      title="Próxima cita"
    >
      {appointment ? (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">
            {formatOverviewDateTime(
              appointment.appointmentDate,
              overview.institutionTimezone,
            )}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            {appointment.sessionType ? (
              <span>
                Tipo: {formatAppointmentType(appointment.sessionType)}
              </span>
            ) : null}
            {appointment.modality ? (
              <span>
                Modalidad: {formatAppointmentModality(appointment.modality)}
              </span>
            ) : null}
            {appointment.durationMinutes !== null ? (
              <span>Duración: {appointment.durationMinutes} minutos</span>
            ) : null}
          </div>
          {appointment.status ? (
            <StatusBadge
              {...getOverviewStatusPresentation(appointment.status)}
            />
          ) : null}
        </div>
      ) : (
        <CompactEmptyState message="Sin próxima cita programada." />
      )}
    </OverviewSection>
  )
}

export function OpenAlerts({ overview }: { overview: StudentOverview }) {
  const { institutionTimezone, alertsSummary } = overview
  const { openCount, recentAlerts } = alertsSummary

  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" type="button" variant="outline">
          <Link href={patientRoutes.alerts(overview.student.id)}>Ver alertas</Link>
        </Button>
      }
      description={`${openCount} ${openCount === 1 ? "alerta abierta" : "alertas abiertas"}.`}
      icon={AlertTriangle}
      title="Alertas"
    >
      {openCount > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {openCount === 1 ? "1 alerta abierta." : `${openCount} alertas abiertas.`}
          </p>
          <ul className="space-y-3">
          {recentAlerts.map((alert) => {
            const priority = getAlertPriorityPresentation(alert.priority)
            const status = getAlertStatusPresentation(alert.status)

            return (
              <li
                className="flex items-start justify-between gap-3"
                key={alert.id}
              >
                <div className="min-w-0">
                  <Link
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    href={patientRoutes.alertDetail(overview.student.id, alert.id)}
                  >
                    {formatAlertType(alert.alertType)}
                  </Link>
                  {alert.alertType === "panic_button" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Origen: Aplicación móvil / Botón SOS
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registrada{" "}
                    {formatOverviewDateTime(
                      alert.createdAt,
                      institutionTimezone,
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {priority ? <StatusBadge {...priority} /> : null}
                  <StatusBadge {...status} />
                </div>
              </li>
            )
          })}
          </ul>
        </div>
      ) : (
        <CompactEmptyState message="Sin alertas abiertas." />
      )}
    </OverviewSection>
  )
}

export function TreatmentPlan({ overview }: { overview: StudentOverview }) {
  const plan = overview.activeTreatmentPlan
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.treatmentPlan(overview.student.id)}>Ver plan</Link>
        </Button>
      }
      icon={Stethoscope}
      title="Plan terapéutico activo"
    >
      {plan ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">
            {plan.title ?? "Plan terapéutico sin título"}
          </p>
          {plan.generalGoal ? (
            <p className="line-clamp-2 text-muted-foreground">
              {plan.generalGoal}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge {...getOverviewStatusPresentation(plan.status)} />
            <span className="text-xs text-muted-foreground">
              Inicio:{" "}
              {formatOverviewDate(plan.startsAt, overview.institutionTimezone)}
            </span>
          </div>
        </div>
      ) : (
        <CompactEmptyState message="Sin plan terapéutico activo." />
      )}
    </OverviewSection>
  )
}

export function PendingActivities({ overview }: { overview: StudentOverview }) {
  const recentActivities = (overview.pendingActivities || []).slice(0, MAX_RECENT_ITEMS)

  return (
    <OverviewSection
      description={
        recentActivities.length > 0
          ? `${recentActivities.length} actividades recientes mostradas.`
          : undefined
      }
      icon={ClipboardList}
      title="Actividades pendientes"
    >
      {recentActivities.length > 0 ? (
        <ul className="space-y-3">
          {recentActivities.map((activity) => (
            <li
              className="flex items-start justify-between gap-3"
              key={activity.id}
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {activity.title || "Actividad sin título registrado"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.dueAt
                    ? `Fecha límite: ${formatOverviewDate(activity.dueAt, overview.institutionTimezone)}`
                    : "Sin fecha límite registrada"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge
                  {...getActivityOriginPresentation(activity.origin)}
                />
                <StatusBadge
                  {...getOverviewStatusPresentation(activity.status)}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <CompactEmptyState message="Sin actividades pendientes." />
      )}
    </OverviewSection>
  )
}

export function RecentFollowUp({ overview }: { overview: StudentOverview }) {
  const recentFollowUps = (overview.recentFollowUps || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.sessions(overview.student.id)}>Ver sesiones</Link>
        </Button>
      }
      icon={FileText}
      title="Seguimiento reciente">
      {recentFollowUps.length > 0 ? (
        <ul className="space-y-2">
          {recentFollowUps.map((followUp) => (
            <li
              className="space-y-1 text-sm text-muted-foreground"
              key={followUp.id}
            >
              <p>
                Seguimiento registrado el{" "}
                {formatOverviewDate(
                  followUp.sessionDate ?? followUp.createdAt,
                  overview.institutionTimezone,
                )}
              </p>
              <p className="text-xs">
                {followUp.sessionType
                  ? `Tipo: ${formatAppointmentType(followUp.sessionType)}`
                  : "Tipo de sesión no registrado"}
                {followUp.status
                  ? ` · ${getOverviewStatusPresentation(followUp.status).label}`
                  : ""}
                {followUp.therapist?.fullName
                  ? ` · Terapeuta: ${followUp.therapist.fullName}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <CompactEmptyState message="Aún no hay seguimiento reciente registrado." />
      )}
    </OverviewSection>
  )
}

export function RecentSharedContent({
  overview,
}: {
  overview: StudentOverview
}) {
  const recentContent = (overview.recentSharedContent || []).slice(0, MAX_RECENT_ITEMS)
  return (
    <OverviewSection
      actions={
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={patientRoutes.sharedContent(overview.student.id)}>Ver contenido</Link>
        </Button>
      }
      icon={Share2}
      title="Contenido compartido reciente">
      {recentContent.length > 0 ? (
        <ul className="space-y-2">
          {recentContent.map((content) => (
            <li className="text-sm text-muted-foreground" key={content.id}>
              {formatSharedContentType(content.contentType)} compartido el{" "}
              {formatOverviewDate(
                content.sharedAt,
                overview.institutionTimezone,
              )}
            </li>
          ))}
        </ul>
      ) : (
        <CompactEmptyState message="Sin contenido compartido reciente." />
      )}
    </OverviewSection>
  )
}

interface OverviewSectionProps {
  actions?: ReactNode
  children: ReactNode
  description?: string
  icon: LucideIcon
  title: string
}

export function OverviewSection({
  actions,
  children,
  description,
  icon: Icon,
  title,
}: OverviewSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function CompactEmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>
}
