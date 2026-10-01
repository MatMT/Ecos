"use client"

import { useState } from "react"
import { useAvailability } from "../hooks/use-schedules"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarSearch } from "lucide-react"

interface AvailabilityPreviewProps {
  therapistId: string
}

export function AvailabilityPreview({ therapistId }: AvailabilityPreviewProps) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const { data: slots, isLoading, isError } = useAvailability(therapistId, date)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarSearch className="size-5 text-primary" />
          Simulador de Disponibilidad
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Utiliza esta herramienta para comprobar cómo el motor calcula los espacios disponibles en una fecha específica, aplicando los horarios fijos y restando las excepciones y descansos.
        </p>

        <div className="max-w-xs space-y-2 mb-8">
          <Label>Selecciona una Fecha a consultar</Label>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>

        <div>
          <h4 className="font-medium mb-4">Espacios Libres Calculados:</h4>
          
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Calculando...</div>
          ) : isError ? (
            <div className="text-sm text-destructive">Error al consultar disponibilidad. Verifica la fecha.</div>
          ) : !slots || slots.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg border border-dashed border-border text-center">
              No hay espacios disponibles para esta fecha.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slots.map((slot: any, index: number) => (
                <div 
                  key={index} 
                  className="bg-primary/5 text-primary border border-primary/20 rounded-md p-3 flex flex-col items-center justify-center text-sm font-medium"
                >
                  <span>{new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-xs opacity-70">a</span>
                  <span>{new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


