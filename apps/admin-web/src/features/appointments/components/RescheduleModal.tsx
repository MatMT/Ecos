"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRescheduleAppointment } from "../hooks/use-appointments"
import { useAvailability } from "@/features/schedules/hooks/use-schedules"
import { toast } from "sonner"
import type { AppointmentResponse } from "../dto/appointments.dto"

interface RescheduleModalProps {
  appointment: AppointmentResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RescheduleModal({ appointment, open, onOpenChange }: RescheduleModalProps) {
  const [date, setDate] = useState<string>("")
  const [timeIso, setTimeIso] = useState<string>("")

  const therapistId = appointment?.doctorId || ""
  const { data: availableSlots = [], isLoading: isLoadingSlots } = useAvailability(therapistId, date)
  const rescheduleMutation = useRescheduleAppointment()

  const handleReschedule = () => {
    if (!appointment || !date || !timeIso) return

    const selectedSlot = availableSlots.find(s => s.start === timeIso)
    const exactDurationMinutes = selectedSlot 
      ? Math.round((new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / 60000)
      : undefined

    const appointmentDate = new Date(timeIso)
    if (appointmentDate < new Date()) {
      toast.error("La nueva fecha no puede ser en el pasado.")
      return
    }

    rescheduleMutation.mutate(
      {
        id: appointment.id,
        data: {
          appointmentDate: appointmentDate.toISOString(),
          durationMinutes: exactDurationMinutes,
        }
      },
      {
        onSuccess: () => {
          toast.success("Cita reagendada correctamente.")
          onOpenChange(false)
          setDate("")
          setTimeIso("")
        },
        onError: (err: unknown) => {
          const msg = err?.response?.data?.message || "Ocurrió un error al reagendar la cita."
          toast.error(msg)
        }
      }
    )
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar Cita</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo horario. La cita original quedará marcada como reagendada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {appointment && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <span className="font-medium">Cita original: </span>
              {new Date(appointment.appointmentDate!).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })} a las {new Date(appointment.appointmentDate!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nueva Fecha *</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => {
                  setDate(e.target.value)
                  setTimeIso("")
                }} 
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nuevo Horario *</label>
              <Select value={timeIso} onValueChange={setTimeIso} disabled={!date || isLoadingSlots}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !date ? "Selecciona fecha" :
                    isLoadingSlots ? "Buscando..." : 
                    availableSlots.length === 0 ? "Sin horarios" : 
                    "Selecciona una hora"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot, index) => (
                    <SelectItem key={index} value={slot.start}>
                      {formatTime(slot.start)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={rescheduleMutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReschedule} 
            disabled={rescheduleMutation.isPending || !date || !timeIso}
          >
            {rescheduleMutation.isPending ? "Procesando..." : "Confirmar Reagendamiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

