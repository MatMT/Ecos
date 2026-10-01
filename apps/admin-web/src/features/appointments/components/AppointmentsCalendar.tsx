"use client"

import { useState } from "react"
import { useAppointments } from "../hooks/use-appointments"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppointmentResponse } from "../dto/appointments.dto"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CancelAppointmentDialog } from "./CancelAppointmentDialog"
import { RescheduleModal } from "./RescheduleModal"
import { AppointmentSessionAction } from "./AppointmentSessionAction"
import { useSession } from "@/features/auth/hooks/use-session"

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function AppointmentsCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null)
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const session = useSession()
  
  const { data: appointments, isLoading } = useAppointments({ skip: 0, take: 100 })

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const startingDayIndex = firstDayOfMonth.getDay() // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  const handleDateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val) {
      const [year, month] = val.split('-')
      setCurrentDate(new Date(Number(year), Number(month) - 1, 1))
    }
  }

  const getAppointmentsForDay = (day: number) => {
    if (!appointments) return []
    return appointments.filter(app => {
      if (!app.appointmentDate) return false
      const date = new Date(app.appointmentDate)
      return date.getDate() === day && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear
    }).sort((a, b) => new Date(a.appointmentDate!).getTime() - new Date(b.appointmentDate!).getTime())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500"
      case "confirmed": return "bg-blue-500"
      case "completed": return "bg-emerald-500"
      case "cancelled": return "bg-destructive"
      case "no_show": return "bg-red-500"
      case "rescheduled": return "bg-muted-foreground"
      default: return "bg-muted"
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="size-5 text-muted-foreground" />
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            <span className="text-sm text-muted-foreground">Ir a:</span>
            <Input 
              type="month" 
              className="w-[160px] h-9" 
              value={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}
              onChange={handleDateSearch}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 rounded-xl border bg-card overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Cells */}
        <div className="grid grid-cols-7 auto-rows-fr min-h-[500px]">
          {/* Empty cells for previous month */}
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b bg-muted/10 p-2" />
          ))}
          
          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayAppointments = getAppointmentsForDay(day)
            const isToday = 
              day === new Date().getDate() && 
              currentMonth === new Date().getMonth() && 
              currentYear === new Date().getFullYear()

            return (
              <div key={`day-${day}`} className="border-r border-b p-2 min-h-[100px] flex flex-col hover:bg-muted/30 transition-colors">
                <span className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                }`}>
                  {day}
                </span>
                
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="h-1 w-full bg-muted animate-pulse rounded-full" />
                  ) : (
                    dayAppointments.map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedAppointment(app)}
                        className="text-[10px] sm:text-xs flex items-center gap-1.5 p-1 rounded-md border bg-background truncate shadow-sm cursor-pointer hover:bg-muted/80 transition-colors"
                        title={`${new Date(app.appointmentDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${app.student?.user.fullName} con ${app.doctor?.fullName}`}
                      >
                        <div className={`size-2 rounded-full shrink-0 ${getStatusColor(app.status)}`} />
                        <span className="truncate flex-1">
                          {new Date(app.appointmentDate!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {app.student?.user.fullName?.split(" ")[0] || "Paciente"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Appointment Details Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la sesión agendada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Estado</h4>
                <div className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${getStatusColor(selectedAppointment.status)}`} />
                  <span className="text-sm capitalize font-medium">
                    {selectedAppointment.status === "pending" ? "Pendiente" : 
                     selectedAppointment.status === "confirmed" ? "Confirmada" : 
                     selectedAppointment.status === "completed" ? "Completada" : 
                     selectedAppointment.status === "cancelled" ? "Cancelada" :
                     selectedAppointment.status === "no_show" ? "No Asistió" : "Reagendada"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs">Fecha y Hora</span>
                  <p className="font-medium">
                    {new Date(selectedAppointment.appointmentDate!).toLocaleDateString('es-MX', { 
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(selectedAppointment.appointmentDate!).toLocaleTimeString('es-MX', { 
                      hour: '2-digit', minute: '2-digit', hour12: true 
                    })} ({selectedAppointment.durationMinutes} min)
                  </p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs">Modalidad</span>
                  <p className="font-medium capitalize">
                    {selectedAppointment.modality === "virtual" ? "Virtual" : 
                     selectedAppointment.modality === "in_person" ? "Presencial" : "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs">Paciente</span>
                  <p className="font-medium">{selectedAppointment.student?.user.fullName || "Sin asignar"}</p>
                  <p className="text-muted-foreground text-xs">{selectedAppointment.student?.studentCode || ""}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs">Terapeuta</span>
                  <p className="font-medium">{selectedAppointment.doctor?.fullName || "Sin asignar"}</p>
                </div>
              </div>

              {selectedAppointment.reason && (
                <div className="space-y-1 border-t pt-4">
                  <span className="text-muted-foreground block text-xs">Motivo / Notas</span>
                  <p className="text-sm">{selectedAppointment.reason}</p>
                </div>
              )}
              
              {selectedAppointment.cancelReason && (
                <div className="space-y-1 border-t pt-4">
                  <span className="text-red-500 block text-xs font-medium">Motivo de Cancelación</span>
                  <p className="text-sm">{selectedAppointment.cancelReason}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
              Cerrar
            </Button>
            {selectedAppointment ? (
              <AppointmentSessionAction
                appointment={selectedAppointment}
                currentUser={session.data}
                variant="default"
              />
            ) : null}
            {(selectedAppointment?.status === "pending" || selectedAppointment?.status === "confirmed") && (
              <>
                <Button variant="outline" onClick={() => setIsRescheduleModalOpen(true)}>
                  Reagendar
                </Button>
                <Button variant="destructive" onClick={() => setIsCancelModalOpen(true)}>
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <CancelAppointmentDialog 
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
      />

      <RescheduleModal
        appointment={selectedAppointment}
        open={isRescheduleModalOpen}
        onOpenChange={setIsRescheduleModalOpen}
      />
    </div>
  )
}
