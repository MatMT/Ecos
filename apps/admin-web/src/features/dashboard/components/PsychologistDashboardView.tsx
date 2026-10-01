"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { usePsychologistDashboard } from '../hooks/use-dashboard'
import { Calendar, AlertTriangle, Activity, FileText, ChevronRight, Clock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useSession } from '@/features/auth/hooks/use-session'
import { formatOverviewDate, formatOverviewDateTime } from '@/features/patients/utils/patient-overview-formatters'
import { getAlertPriorityPresentation, getAlertStatusPresentation } from '@/features/alerts/utils/alert-formatters'
import { getOverviewStatusPresentation, getActivityOriginPresentation } from '@/features/patients/utils/patient-overview-formatters'
import { formatAppointmentType } from '@/features/patients/utils/patient-overview-formatters'
import { patientRoutes } from '@/features/patients/routes/patient-routes'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Buenos días, ${name}`
  if (hour < 19) return `Buenas tardes, ${name}`
  return `Buenas noches, ${name}`
}

export function PsychologistDashboardView() {
  const query = usePsychologistDashboard()
  const session = useSession()
  const sessionData = session.data

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Error al cargar el dashboard"
        description="No fue posible cargar su información clínica. Por favor, intente de nuevo."
        onRetry={() => query.refetch()}
      />
    )
  }

  const data = query.data
  const today = new Intl.DateTimeFormat('es', { dateStyle: 'full' }).format(new Date())
  const firstName = sessionData?.fullName?.split(' ')[0] || 'Terapeuta'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">{getGreeting(firstName)}</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Citas de hoy
              </CardTitle>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {data.todayAppointments.length}
            </div>
          </CardHeader>
          <CardContent>
            {data.todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No tiene citas programadas para hoy.</p>
              </div>
            ) : (
              <ul className="space-y-3 mt-2">
                {data.todayAppointments.slice(0, 5).map((apt, i) => (
                  <li key={i} className="text-sm p-3 border rounded-md hover:bg-slate-50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-foreground">{apt.student?.user?.fullName || 'Paciente'}</div>
                      <StatusBadge {...getOverviewStatusPresentation(apt.status)} />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatOverviewDateTime(apt.appointmentDate, 'America/Mexico_City')}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">{formatAppointmentType(apt.sessionType)}</span>
                      {apt.studentId && (
                        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600">
                          <Link href={patientRoutes.overview(apt.studentId)}>Ver ficha <ChevronRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Alertas prioritarias
              </CardTitle>
            </div>
            {data.priorityAlerts.length > 0 && (
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm animate-pulse">
                {data.priorityAlerts.length}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {data.priorityAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No hay alertas prioritarias activas.</p>
              </div>
            ) : (
              <ul className="space-y-3 mt-2">
                {data.priorityAlerts.slice(0, 5).map((alert, i) => {
                  const priority = getAlertPriorityPresentation(alert.priority)
                  const status = getAlertStatusPresentation(alert.status)
                  return (
                    <li key={i} className="text-sm p-3 border border-red-100 bg-red-50/30 rounded-md flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-foreground">{alert.student?.user?.fullName || 'Paciente'}</div>
                        <div className="flex gap-1">
                          {priority && <StatusBadge {...priority} />}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatOverviewDateTime(alert.createdAt, 'America/Mexico_City')}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <StatusBadge {...status} />
                        {alert.studentId && (
                          <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600">
                            <Link href={patientRoutes.alertDetail(alert.studentId, alert.id)}>Atender <ChevronRight className="h-3 w-3 ml-1" /></Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Próximas citas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No hay próximas citas agendadas.</p>
              </div>
            ) : (
              <ul className="space-y-3 mt-2">
                {data.upcomingAppointments.slice(0, 5).map((apt, i) => (
                  <li key={i} className="text-sm p-3 border rounded-md hover:bg-slate-50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-foreground">{apt.student?.user?.fullName || 'Paciente'}</div>
                      <StatusBadge {...getOverviewStatusPresentation(apt.status)} />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatOverviewDateTime(apt.appointmentDate, 'America/Mexico_City')}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">{formatAppointmentType(apt.sessionType)}</span>
                      {apt.studentId && (
                        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-600">
                          <Link href={patientRoutes.overview(apt.studentId)}>Ver ficha <ChevronRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                Actividades de pacientes
              </CardTitle>
            </div>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
              {data.pendingActivities.length}
            </div>
          </CardHeader>
          <CardContent>
            {data.pendingActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No hay actividades pendientes.</p>
              </div>
            ) : (
              <ul className="space-y-3 mt-2">
                {data.pendingActivities.slice(0, 5).map((activity, i) => (
                  <li key={i} className="text-sm p-3 border rounded-md flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-foreground">{activity.activity?.title || 'Actividad sin título'}</div>
                      <StatusBadge {...getOverviewStatusPresentation(activity.status)} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Paciente: {activity.student?.user?.fullName || 'Desconocido'}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <StatusBadge {...getActivityOriginPresentation(activity.origin)} />
                      {activity.studentId && (
                        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-600">
                          <Link href={patientRoutes.activities(activity.studentId)}>Revisar <ChevronRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
