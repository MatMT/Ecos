"use client"

import { useState } from "react"
import { useTherapists } from "@/features/therapists/hooks/use-therapists"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RecurringScheduleManager } from "@/features/schedules/components/RecurringScheduleManager"
import { ExceptionsManager } from "@/features/schedules/components/ExceptionsManager"
import { AvailabilityPreview } from "@/features/schedules/components/AvailabilityPreview"
import { CalendarDays, AlertTriangle, CalendarSearch } from "lucide-react"

export default function GlobalSchedulesPage() {
  const { data: therapists, isLoading: isLoadingTherapists } = useTherapists(0, 100) // load up to 100 therapists for the select
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("")

  const selectedTherapist = therapists?.find(t => t.userId === selectedTherapistId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Horarios"
        description="Selecciona un profesional para gestionar sus horarios fijos de atención, excepciones y consultar su disponibilidad."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="max-w-md space-y-2">
          <Label>Terapeuta</Label>
          <Select 
            value={selectedTherapistId} 
            onValueChange={setSelectedTherapistId}
            disabled={isLoadingTherapists}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingTherapists ? "Cargando profesionales..." : "Elige un terapeuta para comenzar"} />
            </SelectTrigger>
            <SelectContent>
              {therapists?.map(t => (
                <SelectItem key={t.userId} value={t.userId}>
                  {t.user?.fullName || t.user?.email || "Terapeuta"} {t.specialty ? `- ${t.specialty}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedTherapistId ? (
        <Tabs defaultValue="recurring" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Horarios Fijos
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Excepciones
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <CalendarSearch className="size-4" />
              Simulador de Citas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="mt-0 outline-none">
            <RecurringScheduleManager therapistId={selectedTherapistId} />
          </TabsContent>

          <TabsContent value="exceptions" className="mt-0 outline-none">
            <ExceptionsManager therapistId={selectedTherapistId} />
          </TabsContent>

          <TabsContent value="preview" className="mt-0 outline-none">
            <AvailabilityPreview therapistId={selectedTherapistId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground border rounded-xl bg-muted/20 border-dashed">
          Selecciona un terapeuta de la lista para gestionar su horario.
        </div>
      )}
    </div>
  )
}
