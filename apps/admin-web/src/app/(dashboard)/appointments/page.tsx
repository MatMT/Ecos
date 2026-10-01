import { PageHeader } from "@/components/common/PageHeader"
import { AppointmentsTable } from "@/features/appointments/components/AppointmentsTable"
import { AppointmentsCalendar } from "@/features/appointments/components/AppointmentsCalendar"
import { CreateAppointmentButton } from "@/features/appointments/components/CreateAppointmentButton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, Calendar as CalendarIcon } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gestión de Citas | ECOS",
}

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Citas Clínicas" 
        actions={<CreateAppointmentButton />}
      />
      
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="size-4" /> Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="size-4" /> Calendario
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="m-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <AppointmentsTable />
          </div>
        </TabsContent>
        
        <TabsContent value="calendar" className="m-0">
          <div className="h-[750px] w-full">
            <AppointmentsCalendar />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
