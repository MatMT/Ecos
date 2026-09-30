"use client"

import { useState } from "react"
import { Mail, Phone, Stethoscope, FileText, UserCircle } from "lucide-react"
import { useTherapist, useTherapistPatients, useUpdateTherapist } from "@/features/therapists/hooks/use-therapists"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { ErrorState } from "@/components/common/ErrorState"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { PatientListItem } from "@/features/patients/types/patient.types"

interface TherapistProfileProps {
  therapistId: string | number
}

export function TherapistProfile({ therapistId }: TherapistProfileProps) {
  const { data: therapist, isLoading: isLoadingProfile, error: errorProfile, refetch: refetchProfile } = useTherapist(therapistId)
  const { data: patients, isLoading: isLoadingPatients, error: errorPatients, refetch: refetchPatients } = useTherapistPatients(therapistId)
  
  const updateMutation = useUpdateTherapist()

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  if (errorProfile) {
    return (
      <ErrorState
        title="Error al cargar el perfil"
        description="No se pudo obtener la información del terapeuta."
        onRetry={() => refetchProfile()}
      />
    )
  }

  const handleToggleStatus = () => {
    if (!therapist) return

    updateMutation.mutate(
      { id: therapistId, data: { active: !therapist.active } },
      {
        onSuccess: () => {
          toast.success(`Cuenta ${therapist.active ? "desactivada" : "activada"} exitosamente`)
          setIsConfirmOpen(false)
        },
        onError: () => {
          toast.error("Error al actualizar el estado de la cuenta")
          setIsConfirmOpen(false)
        },
      }
    )
  }

  const patientColumns: DataTableColumn<PatientListItem>[] = [
    {
      id: "name",
      header: "Nombre del Paciente",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.user.fullName || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      id: "studentCode",
      header: "Código / Matrícula",
      cell: (row) => <span className="text-sm">{row.studentCode || "-"}</span>,
    },
    {
      id: "diagnosis",
      header: "Diagnóstico",
      cell: (row) => <span className="text-sm">{row.primaryDiagnosis || "No especificado"}</span>,
    },
  ]



  return (
    <div className="space-y-8">
      {/* Información principal */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isLoadingProfile ? "Cargando..." : therapist?.user.fullName || "Sin nombre"}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isLoadingProfile ? "..." : therapist?.specialty || "Terapeuta"}
              </span>
              {!isLoadingProfile && therapist && (
                <StatusBadge
                  tone={therapist.active ? "success" : "neutral"}
                  label={therapist.active ? "Cuenta Activa" : "Cuenta Inactiva"}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isLoadingProfile && therapist && (
            <Button 
              variant={therapist.active ? "destructive" : "outline"} 
              onClick={() => setIsConfirmOpen(true)}
            >
              {therapist.active ? "Desactivar Cuenta" : "Activar Cuenta"}
            </Button>
          )}
        </div>
      </div>

      {/* Detalles de Contacto y Profesionales */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Detalles de Contacto y Profesionales</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="size-4" />
              Correo Electrónico
            </dt>
            <dd className="text-sm text-foreground break-words font-medium">
              {isLoadingProfile ? "Cargando..." : therapist?.user.email || "-"}
            </dd>
          </div>
          
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="size-4" />
              Teléfono
            </dt>
            <dd className="text-sm text-foreground font-medium">
              {isLoadingProfile ? "Cargando..." : therapist?.phone || "-"}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="size-4" />
              Cédula Profesional
            </dt>
            <dd className="text-sm text-foreground font-medium">
              {isLoadingProfile ? "Cargando..." : therapist?.professionalLicense || "-"}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Stethoscope className="size-4" />
              Pacientes Activos
            </dt>
            <dd className="text-sm text-foreground font-semibold">
              {isLoadingPatients ? "Cargando..." : patients?.length || 0}
            </dd>
          </div>
        </dl>
      </div>

      {/* Pacientes Activos */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">Pacientes Activos</h3>
        </div>
        <div className="p-0">
          {errorPatients ? (
            <div className="p-6">
              <ErrorState
                title="Error"
                description="No se pudo cargar la lista de pacientes."
                onRetry={() => refetchPatients()}
                variant="compact"
              />
            </div>
          ) : (
            <DataTable
              columns={patientColumns}
              data={patients ?? []}
              getRowId={(row) => row.id}
              isLoading={isLoadingPatients}
              emptyState={
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No hay pacientes asignados actualmente.
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Modal de confirmación de estado */}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={therapist?.active ? "Desactivar Cuenta" : "Activar Cuenta"}
        description={
          therapist?.active
            ? "¿Estás seguro que deseas desactivar esta cuenta? El terapeuta no podrá iniciar sesión en el sistema."
            : "¿Estás seguro que deseas reactivar esta cuenta? El terapeuta recuperará su acceso al sistema."
        }
        confirmLabel={therapist?.active ? "Desactivar" : "Activar"}
        variant={therapist?.active ? "destructive" : "default"}
        isPending={updateMutation.isPending}
        onConfirm={handleToggleStatus}
      />
    </div>
  )
}
