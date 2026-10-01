import { CalendarDays, UserRound } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import type { SessionListItem } from "@/features/sessions/types/session.types"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import {
  formatObservedEmotionalState,
  formatSessionDateTime,
  formatSessionModality,
  formatSessionType,
  getAppointmentStatusPresentation,
} from "@/features/sessions/utils/session-formatters"

interface SessionTimelineProps {
  patientId: number
  sessions: readonly SessionListItem[]
  timeZone: string
}

export function SessionTimeline({ patientId, sessions, timeZone }: SessionTimelineProps) {
  return (
    <ol aria-label="Historial de sesiones" className="space-y-4">
      {sessions.map((session) => (
        <SessionTimelineItem
          key={session.id}
          patientId={patientId}
          session={session}
          timeZone={timeZone}
        />
      ))}
    </ol>
  )
}

function SessionTimelineItem({
  patientId,
  session,
  timeZone,
}: {
  patientId: number
  session: SessionListItem
  timeZone: string
}) {
  const appointmentStatus = getAppointmentStatusPresentation(session.appointmentStatus)
  const therapistName = session.therapist?.fullName?.trim() || "Terapeuta no registrado"

  return (
    <li>
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                <time dateTime={session.sessionDate ?? undefined}>
                  {formatSessionDateTime(session.sessionDate, timeZone)}
                </time>
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {formatSessionType(session.sessionType)}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <UserRound aria-hidden="true" className="size-4" />
                    {therapistName}
                  </span>
                  {session.modality ? <span>{formatSessionModality(session.modality)}</span> : null}
                  {session.observedEmotionalState ? (
                    <span>
                      Estado emocional observado: {formatObservedEmotionalState(session.observedEmotionalState)}
                    </span>
                  ) : null}
                  {session.appointmentStatus ? (
                    <span>Estado de la cita: {appointmentStatus.label}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {session.isVoided ? <StatusBadge label="Nota anulada" tone="danger" /> : null}
              <Button asChild size="sm" variant="outline">
                <Link href={patientRoutes.sessionDetail(patientId, session.id)}>
                  Ver sesión
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
