"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { useTherapists } from "@/features/therapists/hooks/use-therapists"
import { useCreateAppointment } from "../hooks/use-appointments"
import { useAvailability } from "@/features/schedules/hooks/use-schedules"
import { toast } from "sonner"

interface CreateAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAppointmentModal({ open, onOpenChange }: CreateAppointmentModalProps) {
  const [patientId, setPatientId] = useState<string>("")
  const [therapistId, setTherapistId] = useState<string>("")
  const [date, setDate] = useState<string>("")
  // time will store the exact UTC ISO string from the slot start
  const [timeIso, setTimeIso] = useState<string>("")
  const [modality, setModality] = useState<"virtual" | "in_person">("virtual")
  const [reason, setReason] = useState<string>("")

  // Fetch data
  const { data: patientsResponse, isLoading: isLoadingPatients } = usePatients({ skip: 0, take: 100 })
  const { data: therapistsResponse, isLoading: isLoadingTherapists } = useTherapists(0, 100)
  const { data: availableSlots = [], isLoading: isLoadingSlots } = useAvailability(therapistId, date)
  
  // React Query returns the array directly
  const patients: readonly import("@/features/patients/types/patient.types").PatientListItem[] = patientsResponse || []
  const therapists: import("@/features/therapists/dto/therapists.dto").TherapistResponse[] = therapistsResponse || []

  const createMutation = useCreateAppointment()

  const handleCreate = () => {
    if (!patientId || !therapistId || !date || !timeIso) {
      toast.error("Por favor completa los campos obligatorios.")
      return
    }

    const appointmentDate = new Date(timeIso)
    
    // Calculate exact duration from the slot to prevent availability mismatch
    const selectedSlot = availableSlots.find(s => s.start === timeIso)
    const exactDurationMinutes = selectedSlot 
      ? Math.round((new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / 60000)
      : undefined

    // Validate that the date is in the future
    if (appointmentDate < new Date()) {
      toast.error("La fecha de la cita no puede ser en el pasado.")
      return
    }

    createMutation.mutate(
      {
        studentId: Number(patientId),
        doctorId: therapistId, 
        appointmentDate: appointmentDate.toISOString(),
        durationMinutes: exactDurationMinutes,
        modality,
        reason: reason || undefined
      },
      {
        onSuccess: () => {
          toast.success("Cita agendada correctamente.")
          onOpenChange(false)
          
          // Reset form
          setPatientId("")
          setTherapistId("")
          setDate("")
          setTimeIso("")
          setModality("virtual")
          setReason("")
        },
        onError: (err: any) => {
          console.error("Error creating appointment:", err)
          const errorMsg = err?.response?.data?.message || err?.message || "Ocurrió un error al agendar la cita. Verifica la disponibilidad del terapeuta."
          toast.error(errorMsg)
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
          <DialogTitle>Nueva Cita Clínica</DialogTitle>
          <DialogDescription>
            Agenda una nueva sesión. Los horarios mostrados se basan en la disponibilidad en tiempo real del terapeuta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Paciente *</label>
            <Select value={patientId} onValueChange={setPatientId} disabled={isLoadingPatients}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPatients ? "Cargando..." : "Selecciona un paciente"} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.user.fullName} ({p.studentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Terapeuta *</label>
            <Select value={therapistId} onValueChange={(val) => {
              setTherapistId(val)
              setTimeIso("") // Reset time when therapist changes
            }} disabled={isLoadingTherapists}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTherapists ? "Cargando..." : "Selecciona un terapeuta"} />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((t) => (
                  <SelectItem key={t.id} value={t.userId}>
                    {t.user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => {
                  setDate(e.target.value)
                  setTimeIso("") // Reset time when date changes
                }} 
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Horario Disponible *</label>
              <Select value={timeIso} onValueChange={setTimeIso} disabled={!date || !therapistId || isLoadingSlots}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    !date || !therapistId ? "Selecciona terapeuta y fecha" :
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

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Modalidad *</label>
            <Select value={modality} onValueChange={(v: "virtual"|"in_person") => setModality(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="in_person">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Motivo / Notas adicionales (opcional)</label>
            <Textarea 
              placeholder="Escribe algún motivo o nota para el terapeuta..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={createMutation.isPending || !patientId || !therapistId || !date || !timeIso}
          >
            {createMutation.isPending ? "Agendando..." : "Agendar Cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
