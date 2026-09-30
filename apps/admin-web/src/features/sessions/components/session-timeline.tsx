import { CalendarDays, UserRound } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import type { SessionListItem } from "@/features/sessions/types/session.types"
import {
  formatObservedEmotionalState,
  formatSessionDateTime,
  formatSessionModality,
  formatSessionType,
  getAppointmentStatusPresentation,
} from "@/features/sessions/utils/session-formatters"

interface SessionTimelineProps {
  sessions: readonly SessionListItem[]
  timeZone: string
}

export function SessionTimeline({ sessions, timeZone }: SessionTimelineProps) {
  return (
    <ol aria-label="Historial de sesiones" className="space-y-4">
      {sessions.map((session) => (
        <SessionTimelineItem key={session.id} session={session} timeZone={timeZone} />
      ))}
    </ol>
  )
}

function SessionTimelineItem({
  session,
  timeZone,
}: {
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
            {session.isVoided ? <StatusBadge label="Nota anulada" tone="danger" /> : null}
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
