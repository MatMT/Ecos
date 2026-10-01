"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCancelAppointment } from "../hooks/use-appointments"
import { toast } from "sonner"
import type { AppointmentResponse } from "../dto/appointments.dto"

interface CancelAppointmentDialogProps {
  appointment: AppointmentResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelAppointmentDialog({ appointment, open, onOpenChange }: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("")
  const cancelMutation = useCancelAppointment()

  const handleCancel = () => {
    if (!appointment) return
    if (!reason.trim()) {
      toast.error("Por favor, ingresa el motivo de la cancelación.")
      return
    }

    cancelMutation.mutate(
      {
        id: appointment.id,
        data: { cancelReason: reason }
      },
      {
        onSuccess: () => {
          toast.success("Cita cancelada correctamente.")
          onOpenChange(false)
          setReason("")
        },
        onError: () => {
          toast.error("Hubo un problema al cancelar la cita.")
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Cita</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas cancelar esta sesión? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Motivo de la cancelación <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Ej. El paciente reportó estar enfermo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelMutation.isPending}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending || !reason.trim()}>
            {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
