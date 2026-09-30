import { api } from "@/lib/api/client"
import type { 
  AppointmentResponse, 
  CreateAppointmentInput, 
  CancelAppointmentInput, 
  RescheduleAppointmentInput 
} from "../dto/appointments.dto"

export interface FindAllAppointmentsParams {
  studentId?: number
  doctorId?: string
  status?: string
  skip?: number
  take?: number
  [key: string]: any
}

export const appointmentsApi = {
  findAll: (params?: FindAllAppointmentsParams) => 
    api.get<AppointmentResponse[]>("/appointments", { params }),

  findOne: (id: number) => 
    api.get<AppointmentResponse>(`/appointments/${id}`),

  create: (data: CreateAppointmentInput) => 
    api.post<AppointmentResponse, CreateAppointmentInput>("/appointments", data),

  confirm: (id: number) => 
    api.patch<AppointmentResponse, undefined>(`/appointments/${id}/confirm`, undefined),

  complete: (id: number) => 
    api.patch<AppointmentResponse, undefined>(`/appointments/${id}/complete`, undefined),

  noShow: (id: number) => 
    api.patch<AppointmentResponse, undefined>(`/appointments/${id}/no-show`, undefined),

  cancel: (id: number, data: CancelAppointmentInput) => 
    api.patch<AppointmentResponse, CancelAppointmentInput>(`/appointments/${id}/cancel`, data),

  reschedule: (id: number, data: RescheduleAppointmentInput) => 
    api.patch<AppointmentResponse, RescheduleAppointmentInput>(`/appointments/${id}/reschedule`, data),
}
