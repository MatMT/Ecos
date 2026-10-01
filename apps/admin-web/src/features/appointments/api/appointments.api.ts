import { api } from "@/lib/api/client"
import type { QueryParams } from "@/lib/api/types"
import type { 
  AppointmentResponse, 
  CreateAppointmentInput, 
  CancelAppointmentInput, 
  RescheduleAppointmentInput 
} from "../dto/appointments.dto"

export interface FindAllAppointmentsParams extends QueryParams {
  studentId?: number
  doctorId?: string
  status?: string
  skip?: number
  take?: number
}

export const appointmentsApi = {
  findAll: (params?: FindAllAppointmentsParams) => 
    api.get<AppointmentResponse[]>("/appointments", { params }),

  findOne: (id: number, signal?: AbortSignal) =>
    api.get<AppointmentResponse>(`/appointments/${id}`, { signal }),

  create: (data: CreateAppointmentInput) => 
    api.post<AppointmentResponse, CreateAppointmentInput>("/appointments", data),

  confirm: (id: number) => 
    api.patch<AppointmentResponse, undefined>(`/appointments/${id}/confirm`, undefined),

  noShow: (id: number) => 
    api.patch<AppointmentResponse, undefined>(`/appointments/${id}/no-show`, undefined),

  cancel: (id: number, data: CancelAppointmentInput) => 
    api.patch<AppointmentResponse, CancelAppointmentInput>(`/appointments/${id}/cancel`, data),

  reschedule: (id: number, data: RescheduleAppointmentInput) => 
    api.patch<AppointmentResponse, RescheduleAppointmentInput>(`/appointments/${id}/reschedule`, data),
}
