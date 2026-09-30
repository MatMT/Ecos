import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileText,
  HeartPulse,
  Share2,
  Stethoscope,
} from "lucide-react"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StudentOverview } from "@/features/patients/types/patient.types"
import {
  formatAppointmentModality,
  formatAppointmentType,
  formatOverviewDate,
  formatOverviewDateTime,
  formatOverviewNumber,
  formatSharedContentType,
  getActivityOriginPresentation,
  getOverviewStatusPresentation,
  getPriorityPresentation,
} from "@/features/patients/utils/patient-overview-formatters"

const MAX_RECENT_ITEMS = 3

export function BiometricSummary({
  biometrics,
  timeZone,
}: {
  biometrics: StudentOverview["recentBiometricSummary"]
  timeZone: string
}) {
  const metrics = biometrics
    ? [
        {
          icon: HeartPulse,
          label: "Frecuencia cardíaca",
          suffix: " bpm",
          value: biometrics.avgHeartRate,
        },
        {
          icon: Activity,
          label: "Nivel de estrés",
          suffix: "",
          value: biometrics.stressLevel,
        },
        {
          icon: HeartPulse,
          label: "Oxígeno en sangre",
          suffix: "%",
          value: biometrics.bloodOxygen,
        },
        {
          icon: Activity,
          label: "Sueño",
          suffix: " h",
          value: biometrics.sleepQualityHours,
        },
        {
          icon: HeartPulse,
          label: "Temperatura corporal",
          suffix: " °C",
          value: biometrics.bodyTemperature,
        },
      ].filter((metric) => metric.value !== null)
    : []

  return (
    <section aria-labelledby="biometrics-heading" className="space-y-3">
      <div>
        <h2
          className="text-lg font-semibold tracking-tight"
          id="biometrics-heading"
        >
          Seguimiento biométrico reciente
        </h2>
        <p className="text-sm text-muted-foreground">
          Información de seguimiento; no constituye un diagnóstico.
        </p>
      </div>
      {metrics.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <StatCard
              description={
                biometrics?.timestamp
                  ? `Registrado ${formatOverviewDateTime(biometrics.timestamp, timeZone)}`
                  : "Fecha de registro no disponible"
              }
              icon={metric.icon}
              key={metric.label}
              label={metric.label}
              value={`${formatOverviewNumber(metric.value)}${metric.suffix}`}
            />
          ))}
        </div>
      ) : (
        <CompactEmptyState message="Sin datos biométricos recientes." />
      )}
    </section>
  )
}

export function NextAppointment({ overview }: { overview: StudentOverview }) {
  const appointment = overview.nextAppointment

  return (
    <OverviewSection icon={CalendarClock} title="Próxima cita">
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
  const { institutionTimezone, openAlerts: alerts } = overview
  const recentAlerts = alerts.slice(0, MAX_RECENT_ITEMS)

  return (
    <OverviewSection
      description={
        alerts.length > 0
          ? `${recentAlerts.length} alertas recientes mostradas.`
          : undefined
      }
      icon={AlertTriangle}
      title="Alertas abiertas"
    >
      {recentAlerts.length > 0 ? (
        <ul className="space-y-3">
          {recentAlerts.map((alert) => {
            const priority = getPriorityPresentation(alert.priority)
            const status = getOverviewStatusPresentation(alert.status)

            return (
              <li
                className="flex items-start justify-between gap-3"
                key={alert.id}
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {alert.description ?? "Alerta sin descripción disponible"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Registrada{" "}
                    {formatOverviewDateTime(
                      alert.createdAt,
                      institutionTimezone,
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge {...priority} />
                  <StatusBadge {...status} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <CompactEmptyState message="Sin alertas pendientes." />
      )}
    </OverviewSection>
  )
}

export function TreatmentPlan({ overview }: { overview: StudentOverview }) {
  const plan = overview.activeTreatmentPlan

  return (
    <OverviewSection icon={Stethoscope} title="Plan terapéutico activo">
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
  const recentActivities = overview.pendingActivities.slice(0, MAX_RECENT_ITEMS)

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
  const recentFollowUps = overview.recentFollowUps.slice(0, MAX_RECENT_ITEMS)

  return (
    <OverviewSection icon={FileText} title="Seguimiento reciente">
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
  const recentContent = overview.recentSharedContent.slice(0, MAX_RECENT_ITEMS)

  return (
    <OverviewSection icon={Share2} title="Contenido compartido reciente">
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
  children: ReactNode
  description?: string
  icon: LucideIcon
  title: string
}

export function OverviewSection({
  children,
  description,
  icon: Icon,
  title,
}: OverviewSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-2 space-y-0">
        <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" />
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function CompactEmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>
}
