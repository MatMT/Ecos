import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { therapistAssignmentsApi } from "../api/therapist-assignments.api"
import type { CreateTherapistAssignmentDto } from "../dto/therapist-assignments.dto"
import { therapistsKeys } from "@/features/therapists/hooks/use-therapists"

export const therapistAssignmentsKeys = {
  all: ['therapist-assignments'] as const,
  byTherapist: (therapistId: string | number) => [...therapistAssignmentsKeys.all, 'therapist', therapistId] as const,
  byStudent: (studentId: number) => [...therapistAssignmentsKeys.all, 'student', studentId] as const,
}

export function useTherapistAssignments(therapistId: string) {
  return useQuery({
    queryKey: therapistAssignmentsKeys.byTherapist(therapistId),
    queryFn: ({ signal }) => therapistAssignmentsApi.getByTherapist(therapistId, signal),
    enabled: !!therapistId,
  })
}

export function useStudentAssignments(studentId: number | null) {
  return useQuery({
    queryKey: therapistAssignmentsKeys.byStudent(studentId as number),
    queryFn: ({ signal }) => therapistAssignmentsApi.getByStudent(studentId as number, signal),
    enabled: !!studentId,
  })
}

export function useCreateTherapistAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTherapistAssignmentDto) => therapistAssignmentsApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidar el historial de asignaciones
      queryClient.invalidateQueries({
        queryKey: therapistAssignmentsKeys.byTherapist(variables.therapistId),
      })
      queryClient.invalidateQueries({
        queryKey: therapistAssignmentsKeys.byStudent(variables.studentId),
      })
      // Invalidar la lista de pacientes activos del terapeuta
      queryClient.invalidateQueries({
        queryKey: therapistsKeys.patients(variables.therapistId),
      })
      // Invalidar a los pacientes globales para que sus detalles muestren al nuevo terapeuta.
      queryClient.invalidateQueries({
        queryKey: ['patients'],
      })
    },
  })
}

export function useEndTherapistAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => therapistAssignmentsApi.end(id, reason),
    onSuccess: () => {
      // Lo ideal aquí sería saber a qué therapistId correspondía para invalidar,
      // pero como simplificación podemos invalidar todo el árbol de asignaciones 
      // o pasar el therapistId desde el componente y usar onSuccess manual
      queryClient.invalidateQueries({
        queryKey: therapistAssignmentsKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: therapistsKeys.all, // Refresca las listas de pacientes de cualquier terapeuta afectado
      })
    },
  })
}
