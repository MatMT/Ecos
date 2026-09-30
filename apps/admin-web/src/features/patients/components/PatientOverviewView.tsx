"use client"

import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  Mail,
  User,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { usePatientOverview } from "@/features/patients/hooks/use-patient-overview"
import { usePatient } from "@/features/patients/hooks/use-patient"
import type { OverviewAlert } from "@/features/patients/types/patient.types"
import { ApiError } from "@/lib/api"

interface PatientOverviewViewProps {
  patientId: number
}

export function PatientOverviewView({ patientId }: PatientOverviewViewProps) {
  const patientQuery = usePatient(patientId)
  const overviewQuery = usePatientOverview(patientId)

  if (patientQuery.isPending || overviewQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    )
  }

  if (patientQuery.isError) {
    if (patientQuery.error instanceof ApiError && patientQuery.error.status === 403) {
      return <ForbiddenState variant="embedded" />
    }
    return (
      <ErrorState
        description="No se pudo cargar la información del paciente."
        onRetry={() => void patientQuery.refetch()}
        title="Error al cargar la ficha"
      />
    )
  }

  const patient = patientQuery.data
  const overview = overviewQuery.data

  const fullName = overview?.student.fullName || patient?.user.fullName || "Paciente"
  const email = overview?.student.email || patient?.user.email || ""
  const studentCode = overview?.student.studentCode || patient?.studentCode || "N/A"
  
  const therapist =
    overview?.currentTherapist?.fullName ||
    (patient?.assignedDoctor && typeof patient.assignedDoctor === "object"
      ? patient.assignedDoctor.fullName
      : null) ||
    "Sin asignar"

  const biometrics = overview?.recentBiometricSummary

  return (
    <div className="space-y-8">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link href="/patients">
            <ArrowLeft className="mr-2 size-4" />
            Volver a Pacientes
          </Link>
        </Button>
        <PermissionGate permission="patients.manage">
          <Button asChild size="sm" variant="outline">
            <Link href={`/patients/${patientId}/edit`}>Editar información</Link>
          </Button>
        </PermissionGate>
      </div>

      {/* Main Patient Header */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
                <Badge variant="outline">{studentCode}</Badge>
              </div>
              <p className="mt-1 flex items-center text-sm text-muted-foreground">
                <Mail className="mr-1.5 size-4" />
                {email || "Sin correo electrónico"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t pt-4 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <span className="text-xs text-muted-foreground">Terapeuta asignado:</span>
            <span className="font-semibold text-foreground">{therapist}</span>
            {overview?.student.primaryDiagnosis && (
              <span className="text-xs text-muted-foreground">
                Diagnóstico: {overview.student.primaryDiagnosis}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clinical Submodules Navigation Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { href: `/clinical-record?studentId=${patientId}`, label: "Expediente" },
          { href: `/appointments?studentId=${patientId}`, label: "Sesiones" },
          { href: `/treatment-plans?studentId=${patientId}`, label: "Plan" },
          { href: `/activities?studentId=${patientId}`, label: "Actividades" },
          { href: `/biometrics?studentId=${patientId}`, label: "Biometría" },
          { href: `/alerts?studentId=${patientId}`, label: "Alertas" },
          { href: `/shared-content?studentId=${patientId}`, label: "Compartido" },
        ].map((item) => (
          <Button asChild className="h-10 text-xs" key={item.href} variant="outline">
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>

      {/* Recent Biometrics Block */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Indicadores Biométricos Recientes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Frecuencia Cardíaca</CardTitle>
              <Heart className="size-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {biometrics?.heartRate ? `${biometrics.heartRate} bpm` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Última lectura registrada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Nivel de Estrés</CardTitle>
              <Zap className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {biometrics?.stressLevel ? `${biometrics.stressLevel} / 100` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Estimación de estrés fisiológico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Oxígeno (SpO2)</CardTitle>
              <Activity className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {biometrics?.oxygenLevel ? `${biometrics.oxygenLevel}%` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Saturación periférica</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Sincronización</CardTitle>
              <Clock className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">
                {biometrics?.timestamp
                  ? new Date(biometrics.timestamp).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Sin sincronización"}
              </div>
              <p className="text-xs text-muted-foreground">Dispositivo de pulsera</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Overview Grid: Next Appointment, Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Appointment Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Próxima Cita Agendada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {overview?.nextAppointment ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(overview.nextAppointment.appointmentDate).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Motivo: {overview.nextAppointment.reason || "Sesión regular de seguimiento"}
                    </p>
                  </div>
                  <Badge variant="outline">{overview.nextAppointment.status}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay citas programadas próximamente.</p>
            )}
          </CardContent>
        </Card>

        {/* Open Alerts Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              <CardTitle className="text-base font-semibold">Alertas Recientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {overview?.openAlerts && overview.openAlerts.length > 0 ? (
              <div className="space-y-2">
                {overview.openAlerts.map((alert: OverviewAlert) => (
                  <div className="flex items-center justify-between rounded-md border p-2 text-xs" key={alert.id}>
                    <span>{alert.message}</span>
                    <Badge variant={alert.priority === "high" ? "destructive" : "warning"}>
                      {alert.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No se registran alertas abiertas para este paciente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}