"use client"

import { use } from "react"
import { useTherapist } from "@/features/therapists/hooks/use-therapists"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecurringScheduleManager } from "@/features/schedules/components/RecurringScheduleManager"
import { ExceptionsManager } from "@/features/schedules/components/ExceptionsManager"
import { AvailabilityPreview } from "@/features/schedules/components/AvailabilityPreview"
import { CalendarDays, AlertTriangle, CalendarSearch } from "lucide-react"

export default function TherapistSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: therapist, isLoading } = useTherapist(id)

  const title = isLoading 
    ? "Configuración de Horario" 
    : `Horario de ${therapist?.user?.fullName || therapist?.user?.email || "Terapeuta"}`

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Gestiona los horarios fijos de atención, días festivos y simula el cálculo de disponibilidad de citas."
      />

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
          <RecurringScheduleManager therapistId={id} />
        </TabsContent>

        <TabsContent value="exceptions" className="mt-0 outline-none">
          <ExceptionsManager therapistId={id} />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 outline-none">
          <AvailabilityPreview therapistId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
