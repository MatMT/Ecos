import Link from "next/link"
import { CalendarDays, TriangleAlert } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import type { AlertListItem } from "@/features/alerts/types/alert.types"
import {
  formatAlertType,
  getAlertPriorityPresentation,
  getAlertStatusPresentation,
} from "@/features/alerts/utils/alert-formatters"
import { formatOverviewDateTime } from "@/features/patients/utils/patient-overview-formatters"

interface AlertTimelineProps {
  alerts: readonly AlertListItem[]
  patientId: number
  timeZone: string
}

export function AlertTimeline({ alerts, patientId, timeZone }: AlertTimelineProps) {
  return (
    <ol aria-label="Historial de alertas" className="space-y-4">
      {alerts.map((alert) => (
        <AlertTimelineItem
          alert={alert}
          key={alert.id}
          patientId={patientId}
          timeZone={timeZone}
        />
      ))}
    </ol>
  )
}

function AlertTimelineItem({
  alert,
  patientId,
  timeZone,
}: {
  alert: AlertListItem
  patientId: number
  timeZone: string
}) {
  const status = getAlertStatusPresentation(alert.status)
  const priority = getAlertPriorityPresentation(alert.priority)

  return (
    <li>
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                <time dateTime={alert.createdAt}>
                  {formatOverviewDateTime(alert.createdAt, timeZone)}
                </time>
              </div>
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  {formatAlertType(alert.alertType)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Alerta persistida asociada al paciente.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge label={status.label} tone={status.tone} />
              {priority ? <StatusBadge label={priority.label} tone={priority.tone} /> : null}
              <PermissionGate permission="alerts.view">
                <Button asChild size="sm" type="button" variant="outline">
                  <Link href={patientRoutes.alertDetail(patientId, alert.id)}>
                    Ver alerta
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
