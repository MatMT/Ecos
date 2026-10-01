import { api } from "@/lib/api/client"
import type {
  ScheduleResponse,
  CreateScheduleInput,
  ScheduleExceptionResponse,
  CreateScheduleExceptionInput,
  AvailabilitySlotResponse,
} from "../dto/schedules.dto"

export const schedulesApi = {
  getSchedules: (therapistId: string) =>
    api.get<ScheduleResponse[]>(`/psychologists/${therapistId}/schedules`),

  createSchedule: (therapistId: string, data: CreateScheduleInput) =>
    api.post<ScheduleResponse, CreateScheduleInput>(`/psychologists/${therapistId}/schedules`, data),

  updateSchedule: (id: number, data: Partial<CreateScheduleInput>) =>
    api.patch<ScheduleResponse, Partial<CreateScheduleInput>>(`/schedules/${id}`, data),

  deleteSchedule: (id: number) =>
    api.delete<ScheduleResponse>(`/schedules/${id}`),

  getExceptions: (therapistId: string, params?: { from?: string; to?: string }) =>
    api.get<ScheduleExceptionResponse[]>(`/psychologists/${therapistId}/schedule-exceptions`, { params }),

  createException: (therapistId: string, data: CreateScheduleExceptionInput) =>
    api.post<ScheduleExceptionResponse, CreateScheduleExceptionInput>(`/psychologists/${therapistId}/schedule-exceptions`, data),

  deleteException: (id: number) =>
    api.delete<ScheduleExceptionResponse>(`/schedule-exceptions/${id}`),

  getAvailability: (therapistId: string, date: string) =>
    api.get<AvailabilitySlotResponse[]>(`/psychologists/${therapistId}/availability`, { params: { date } }),
}
