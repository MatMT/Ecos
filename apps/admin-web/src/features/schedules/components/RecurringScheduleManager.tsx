"use client"

import { useState } from "react"
import { useSchedules, useCreateSchedule, useDeleteSchedule, useUpdateSchedule } from "../hooks/use-schedules"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Clock, CheckCircle2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"

interface RecurringScheduleManagerProps {
  therapistId: string
}

const DAYS_OF_WEEK = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "7", label: "Domingo" },
]

export function RecurringScheduleManager({ therapistId }: RecurringScheduleManagerProps) {
  const { data: schedules, isLoading } = useSchedules(therapistId)
  const createMutation = useCreateSchedule()
  const updateMutation = useUpdateSchedule()
  const deleteMutation = useDeleteSchedule()

  const [isOpen, setIsOpen] = useState(false)
  const [confirmReplaceId, setConfirmReplaceId] = useState<number | null>(null)

  const [dayOfWeek, setDayOfWeek] = useState<string>("")
  const [startTime, setStartTime] = useState<string>("08:00")
  const [endTime, setEndTime] = useState<string>("17:00")
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(60)
  const [breakMinutes, setBreakMinutes] = useState<number>(0)

  const handlePreSave = () => {
    if (!dayOfWeek || !startTime || !endTime) return
    const existing = schedules?.find((s: any) => s.dayOfWeek.toString() === dayOfWeek)
    if (existing) {
      setConfirmReplaceId(existing.id)
    } else {
      executeSave()
    }
  }

  const executeSave = (idToUpdate?: number) => {
    const payload = {
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      sessionDurationMinutes,
      breakMinutes,
    }

    if (idToUpdate) {
      updateMutation.mutate(
        { id: idToUpdate, data: payload },
        {
          onSuccess: () => {
            toast.success("Horario actualizado exitosamente")
            resetAndClose()
          },
          onError: () => toast.error("Error al actualizar horario"),
        }
      )
    } else {
      createMutation.mutate(
        { therapistId, data: payload },
        {
          onSuccess: () => {
            toast.success("Horario agregado")
            resetAndClose()
          },
          onError: (err: any) => toast.error(err?.response?.data?.message || "Error al agregar horario"),
        }
      )
    }
  }

  const resetAndClose = () => {
    setDayOfWeek("")
    setConfirmReplaceId(null)
    setIsOpen(false)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Horario eliminado"),
      onError: () => toast.error("Error al eliminar horario"),
    })
  }

  const formatTime = (timeStr: string) => {
    const d = new Date(`1970-01-01T${timeStr}`)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) return <div className="text-sm text-muted-foreground p-6">Cargando horarios...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          Horarios Fijos
        </h3>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" /> Agregar Horario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar nuevo horario fijo</DialogTitle>
              <DialogDescription>
                Configura un bloque de atención regular para el terapeuta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Día de la semana</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración (min)</Label>
                  <Input type="number" min={1} value={sessionDurationMinutes} onChange={(e) => setSessionDurationMinutes(parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Descanso (min)</Label>
                  <Input type="number" min={0} value={breakMinutes} onChange={(e) => setBreakMinutes(parseInt(e.target.value))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button 
                disabled={!dayOfWeek || !startTime || !endTime || createMutation.isPending || updateMutation.isPending}
                onClick={handlePreSave}
              >
                Guardar Horario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {schedules?.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 text-center">No tienes horarios configurados.</div>
        ) : (
          <div className="p-4 space-y-3">
            {schedules?.map((schedule: any) => {
              const dayLabel = DAYS_OF_WEEK.find((d) => d.value === schedule.dayOfWeek.toString())?.label
              return (
                <div key={schedule.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{dayLabel}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sesiones de {schedule.sessionDurationMinutes} min
                      {schedule.breakMinutes > 0 && ` con ${schedule.breakMinutes} min de descanso`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmReplaceId !== null}
        onOpenChange={(open) => !open && setConfirmReplaceId(null)}
        title="Horario ya existe"
        description={`Ya tienes un horario configurado para el día ${DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label}. ¿Deseas reemplazarlo con este nuevo horario?`}
        confirmLabel="Reemplazar"
        variant="default"
        isPending={updateMutation.isPending}
        onConfirm={() => {
          if (confirmReplaceId) executeSave(confirmReplaceId)
        }}
      />
    </div>
  )
}
