"use client"

import { useState } from "react"
import { useExceptions, useCreateException, useDeleteException } from "../hooks/use-schedules"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, AlertTriangle, Plus } from "lucide-react"
import { toast } from "sonner"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ExceptionsManagerProps {
  therapistId: string
}

export function ExceptionsManager({ therapistId }: ExceptionsManagerProps) {
  const { data: exceptions, isLoading } = useExceptions(therapistId)
  const createMutation = useCreateException()
  const deleteMutation = useDeleteException()

  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [available, setAvailable] = useState<string>("false")
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  const handleCreate = () => {
    if (!date) return

    createMutation.mutate(
      {
        therapistId,
        data: {
          date,
          available: available === "true",
          startTime: startTime ? startTime : undefined,
          endTime: endTime ? endTime : undefined,
          reason: reason || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Excepción registrada")
          setReason("")
          setStartTime("")
          setEndTime("")
          setIsOpen(false)
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Error al registrar excepción")
        },
      }
    )
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Excepción eliminada"),
      onError: () => toast.error("Error al eliminar excepción"),
    })
  }

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return ""
    const d = new Date(`1970-01-01T${timeStr}`)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) return <div className="text-sm text-muted-foreground p-6">Cargando excepciones...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          Excepciones y Días Libres
        </h3>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" /> Agregar Excepción
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Excepción</DialogTitle>
              <DialogDescription>
                Bloquea un día de vacaciones o habilita un día de trabajo adicional.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={available} onValueChange={setAvailable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Bloquear (No labora)</SelectItem>
                    <SelectItem value="true">Habilitar (Día laborable extra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {available === "true" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio (Opcional)</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin (Opcional)</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Motivo (Opcional)</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Vacaciones, Día Festivo..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button 
                disabled={!date || createMutation.isPending}
                onClick={handleCreate}
              >
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {exceptions?.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 text-center">No hay excepciones registradas.</div>
        ) : (
          <div className="p-4 space-y-3">
            {exceptions?.map((exc: any) => (
              <div key={exc.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{new Date(exc.date).toLocaleDateString()}</p>
                    <StatusBadge 
                      tone={exc.available ? "success" : "neutral"} 
                      label={exc.available ? "Disponible" : "No Disponible"} 
                    />
                  </div>
                  {(exc.startTime || exc.endTime) && (
                    <p className="text-sm text-muted-foreground">
                      Horario especial: {formatTime(exc.startTime)} - {formatTime(exc.endTime)}
                    </p>
                  )}
                  {exc.reason && <p className="text-sm text-muted-foreground">Motivo: {exc.reason}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(exc.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
