import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { appointmentsApi, type FindAllAppointmentsParams } from "../api/appointments.api"
import type { 
  CreateAppointmentInput, 
  CancelAppointmentInput, 
  RescheduleAppointmentInput 
} from "../dto/appointments.dto"

export const appointmentsKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentsKeys.all, "list"] as const,
  list: (filters: FindAllAppointmentsParams) => [...appointmentsKeys.lists(), filters] as const,
  details: () => [...appointmentsKeys.all, "detail"] as const,
  detail: (id: number) => [...appointmentsKeys.details(), id] as const,
}

export function useAppointments(filters: FindAllAppointmentsParams = {}) {
  return useQuery({
    queryKey: appointmentsKeys.list(filters),
    queryFn: async () => {
      return await appointmentsApi.findAll(filters)
    },
  })
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentsKeys.detail(id),
    queryFn: ({ signal }) => {
      return appointmentsApi.findOne(id, signal)
    },
    enabled: !!id,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAppointmentInput) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() })
    },
  })
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.confirm(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.detail(id) })
    },
  })
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.noShow(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.detail(id) })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelAppointmentInput }) => 
      appointmentsApi.cancel(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.detail(id) })
    },
  })
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RescheduleAppointmentInput }) => 
      appointmentsApi.reschedule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.detail(id) })
    },
  })
}
