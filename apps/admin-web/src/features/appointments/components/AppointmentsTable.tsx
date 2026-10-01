"use client"

import { useAppointments } from "../hooks/use-appointments"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ErrorState } from "@/components/common/ErrorState"
import { AppointmentSessionAction } from "@/features/appointments/components/AppointmentSessionAction"
import { useSession } from "@/features/auth/hooks/use-session"
import type { AppointmentResponse } from "../dto/appointments.dto"

export function AppointmentsTable() {
  const skip = 0
  const take = 20
  const session = useSession()

  const { data, isLoading, error, refetch } = useAppointments({ skip, take })

  if (error) {
    return (
      <ErrorState
        title="Error al cargar las citas"
        description="Hubo un problema al intentar obtener el listado de citas. Por favor intenta de nuevo."
        onRetry={() => refetch()}
      />
    )
  }

  const columns: DataTableColumn<AppointmentResponse>[] = [
    {
      id: "date",
      header: "Fecha y Hora",
      cell: (row) => {
        if (!row.appointmentDate) return "-"
        const dateObj = new Date(row.appointmentDate)
        const dateStr = new Intl.DateTimeFormat('es-MX', { 
          weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' 
        }).format(dateObj)
        const timeStr = new Intl.DateTimeFormat('es-MX', { 
          hour: 'numeric', minute: '2-digit', hour12: true 
        }).format(dateObj)

        return (
          <div className="font-medium">
            <span className="capitalize">{dateStr}</span>
            <span className="block text-xs text-muted-foreground">
              {timeStr} ({row.durationMinutes} min)
            </span>
          </div>
        )
      },
    },
    {
      id: "patient",
      header: "Paciente",
      cell: (row) => {
        if (!row.student) return <span className="text-muted-foreground">-</span>
        return (
          <div>
            <p className="font-medium text-sm">{row.student.user.fullName || "Sin nombre"}</p>
            <p className="text-xs text-muted-foreground">{row.student.studentCode || row.student.user.email}</p>
          </div>
        )
      },
    },
    {
      id: "therapist",
      header: "Terapeuta",
      cell: (row) => {
        if (!row.doctor) return <span className="text-muted-foreground">-</span>
        return <span className="text-sm">{row.doctor.fullName || row.doctor.email}</span>
      },
    },
    {
      id: "modality",
      header: "Modalidad",
      cell: (row) => (
        <span className="text-sm capitalize">
          {row.modality === "virtual" ? "Virtual" : row.modality === "in_person" ? "Presencial" : row.modality || "-"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => {
        let tone: "info" | "success" | "warning" | "danger" | "neutral" = "neutral"
        let label: string = row.status

        switch (row.status) {
          case "pending":
            tone = "warning"
            label = "Pendiente"
            break
          case "confirmed":
            tone = "info"
            label = "Confirmada"
            break
          case "completed":
            tone = "success"
            label = "Completada"
            break
          case "cancelled":
            tone = "danger"
            label = "Cancelada"
            break
          case "no_show":
            tone = "danger"
            label = "No asistió"
            break
          case "rescheduled":
            tone = "neutral"
            label = "Reagendada"
            break
        }

        return <StatusBadge tone={tone} label={label} />
      },
    },
    {
      id: "clinicalSession",
      header: "Sesión clínica",
      cell: (row) => (
        <AppointmentSessionAction
          appointment={row}
          currentUser={session.data}
        />
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No hay citas registradas en el sistema.</p>
        </div>
      }
    />
  )
}
