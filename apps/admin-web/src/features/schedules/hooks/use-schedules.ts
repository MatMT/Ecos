import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { schedulesApi } from "../api/schedules.api"
import type { CreateScheduleInput, CreateScheduleExceptionInput } from "../dto/schedules.dto"

export const schedulesKeys = {
  all: ["schedules"] as const,
  byTherapist: (therapistId: string) => [...schedulesKeys.all, "therapist", therapistId] as const,
  exceptions: (therapistId: string) => [...schedulesKeys.all, "exceptions", therapistId] as const,
  availability: (therapistId: string, date: string) => [...schedulesKeys.all, "availability", therapistId, date] as const,
}

// --- Schedules ---

export function useSchedules(therapistId: string) {
  return useQuery({
    queryKey: schedulesKeys.byTherapist(therapistId),
    queryFn: () => schedulesApi.getSchedules(therapistId),
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ therapistId, data }: { therapistId: string; data: CreateScheduleInput }) =>
      schedulesApi.createSchedule(therapistId, data),
    onSuccess: (_, { therapistId }) => {
      queryClient.invalidateQueries({ queryKey: schedulesKeys.byTherapist(therapistId) })
      // Invalidar simulador general
      queryClient.invalidateQueries({ queryKey: schedulesKeys.all })
    },
  })
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => schedulesApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesKeys.all })
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateScheduleInput> }) =>
      schedulesApi.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesKeys.all })
    },
  })
}

// --- Exceptions ---

export function useExceptions(therapistId: string) {
  return useQuery({
    queryKey: schedulesKeys.exceptions(therapistId),
    queryFn: () => schedulesApi.getExceptions(therapistId),
  })
}

export function useCreateException() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ therapistId, data }: { therapistId: string; data: CreateScheduleExceptionInput }) =>
      schedulesApi.createException(therapistId, data),
    onSuccess: (_, { therapistId }) => {
      queryClient.invalidateQueries({ queryKey: schedulesKeys.exceptions(therapistId) })
      queryClient.invalidateQueries({ queryKey: schedulesKeys.all })
    },
  })
}

export function useDeleteException() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => schedulesApi.deleteException(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesKeys.all })
    },
  })
}

// --- Availability ---

export function useAvailability(therapistId: string, date: string) {
  return useQuery({
    queryKey: schedulesKeys.availability(therapistId, date),
    queryFn: () => schedulesApi.getAvailability(therapistId, date),
    enabled: !!date && !!therapistId,
  })
}
