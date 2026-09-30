"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useAssignTherapist } from "@/features/patients/hooks/use-assign-therapist"
import type { PatientListItem } from "@/features/patients/types/patient.types"

interface TherapistOption {
  fullName: string
  id: string
}

interface AssignTherapistDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
  patient: PatientListItem | null
}

export function AssignTherapistDialog({
  onOpenChange,
  open,
  patient,
}: AssignTherapistDialogProps) {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")
  const assignMutation = useAssignTherapist()

  const therapistsQuery = useQuery({
    enabled: open,
    queryFn: () =>
      api.get<Array<{ id: string; user: { fullName: string; id: string } }>>("/psychologists"),
    queryKey: ["psychologists", "list"],
  })

  function handleAssign() {
    if (!patient || !selectedTherapistId) return

    assignMutation.mutate(
      {
        studentId: patient.id,
        therapistId: selectedTherapistId,
      },
      {
        onError: () => {
          toast.error("No fue posible asignar el terapeuta. Por favor, intente nuevamente.")
        },
        onSuccess: () => {
          toast.success("Terapeuta asignado correctamente.")
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar terapeuta</DialogTitle>
          <DialogDescription>
            Seleccione el terapeuta responsable para {patient?.user.fullName ?? "el paciente"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="therapist-select">Terapeuta</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              id="therapist-select"
              onChange={(e) => setSelectedTherapistId(e.target.value)}
              value={selectedTherapistId}
            >
              <option value="">Seleccione un terapeuta...</option>
              {therapistsQuery.data?.map((t) => (
                <option key={t.user.id} value={t.user.id}>
                  {t.user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={!selectedTherapistId || assignMutation.isPending}
            onClick={handleAssign}
          >
            {assignMutation.isPending ? "Asignando..." : "Confirmar asignación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}