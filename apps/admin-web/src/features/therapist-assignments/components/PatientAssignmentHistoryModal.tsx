"use client"

import { useState } from "react"
import { useStudentAssignments, useCreateTherapistAssignment } from "../hooks/use-therapist-assignments"
import type { TherapistAssignmentResponse } from "../dto/therapist-assignments.dto"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { TherapistResponse } from "@/features/therapists/dto/therapists.dto"

interface PatientAssignmentHistoryModalProps {
  patientId: number | null
  onClose: () => void
  therapists: TherapistResponse[]
}

export function PatientAssignmentHistoryModal({ patientId, onClose, therapists }: PatientAssignmentHistoryModalProps) {
  const { data: assignments, isLoading } = useStudentAssignments(patientId)
  const createMutation = useCreateTherapistAssignment()

  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")
  const [reason, setReason] = useState("")
  // default startsAt to today in YYYY-MM-DD
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().split("T")[0])
  const [endsAt, setEndsAt] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)

  const activeAssignment = assignments?.find(a => !a.endsAt)
  const hasActive = !!activeAssignment

  // Si cerramos, limpiamos los estados locales
  const handleClose = () => {
    setIsAssigning(false)
    setSelectedTherapistId("")
    setReason("")
    setStartsAt(new Date().toISOString().split("T")[0])
    setEndsAt("")
    onClose()
  }

  const handleConfirmReassign = () => {
    if (!patientId || !selectedTherapistId) return

    createMutation.mutate(
      {
        studentId: patientId,
        therapistId: selectedTherapistId,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Terapeuta asignado correctamente")
          setShowConfirm(false)
          setIsAssigning(false)
          setSelectedTherapistId("")
          setReason("")
          setStartsAt(new Date().toISOString().split("T")[0])
          setEndsAt("")
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Ocurrió un error al asignar")
          setShowConfirm(false)
        }
      }
    )
  }

  const columns: DataTableColumn<TherapistAssignmentResponse>[] = [
    {
      id: "professional",
      header: "Profesional",
      cell: (row) => {
        const t = therapists.find(t => t.userId === row.therapistId)
        return <span className="text-sm font-medium">{t?.user.fullName || t?.user.email || row.therapistId}</span>
      },
    },
    {
      id: "startsAt",
      header: "Inicio",
      cell: (row) => <span className="text-sm">{new Date(row.startsAt).toLocaleDateString()}</span>,
    },
    {
      id: "endsAt",
      header: "Fin",
      cell: (row) => <span className="text-sm">{row.endsAt ? new Date(row.endsAt).toLocaleDateString() : "-"}</span>,
    },
    {
      id: "reason",
      header: "Motivo",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.reason || "-"}</span>,
    },
    {
      id: "status",
      header: "Estado",
      cell: (row) => (
        <StatusBadge
          tone={row.endsAt ? "neutral" : "success"}
          label={row.endsAt ? "Finalizada" : "Vigente"}
        />
      ),
    },
  ]

  return (
    <>
      <Dialog open={patientId !== null} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Asignaciones</DialogTitle>
            <DialogDescription>
              Revisa el historial de terapeutas de este paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <DataTable
              columns={columns}
              data={assignments ?? []}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              emptyState={
                <div className="py-6 text-center text-sm text-muted-foreground">
                  El paciente no tiene historial de asignaciones.
                </div>
              }
            />

            {!isAssigning ? (
              <div className="flex justify-end">
                <Button onClick={() => setIsAssigning(true)}>
                  {hasActive ? "Reasignar Terapeuta" : "Nueva Asignación"}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-4 mt-6">
                <h4 className="font-semibold text-sm">Configurar Nueva Asignación</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Seleccionar Profesional *</Label>
                    <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Elige un terapeuta" />
                      </SelectTrigger>
                      <SelectContent>
                        {therapists.map(t => (
                          <SelectItem key={t.userId} value={t.userId}>
                            {t.user.fullName || t.user.email} {t.specialty ? `- ${t.specialty}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Inicio *</Label>
                    <Input 
                      type="date"
                      value={startsAt} 
                      onChange={e => setStartsAt(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Fin (Opcional)</Label>
                    <Input 
                      type="date"
                      value={endsAt} 
                      onChange={e => setEndsAt(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Motivo (Opcional)</Label>
                    <Input 
                      value={reason} 
                      onChange={e => setReason(e.target.value)} 
                      placeholder="Ej. Cambio de especialista, continuación..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAssigning(false)}>Cancelar</Button>
                  <Button 
                    disabled={!selectedTherapistId || !startsAt || createMutation.isPending}
                    onClick={() => setShowConfirm(true)}
                  >
                    Confirmar Asignación
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={hasActive ? "Confirmar Reasignación" : "Confirmar Asignación"}
        description={
          hasActive 
            ? "El paciente ya cuenta con un terapeuta activo. Al confirmar, la asignación anterior se finalizará automáticamente y el nuevo terapeuta asumirá la atención principal del paciente. ¿Deseas proceder?"
            : "¿Estás seguro que deseas asignar este terapeuta al paciente?"
        }
        confirmLabel={hasActive ? "Reasignar" : "Asignar"}
        variant="default"
        isPending={createMutation.isPending}
        onConfirm={handleConfirmReassign}
      />
    </>
  )
}
