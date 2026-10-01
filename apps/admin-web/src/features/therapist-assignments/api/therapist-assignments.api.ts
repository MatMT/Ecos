import { api } from "@/lib/api/client"
import type { 
  TherapistAssignmentResponse, 
  CreateTherapistAssignmentDto 
} from "../dto/therapist-assignments.dto"

export const therapistAssignmentsApi = {
  getByTherapist: async (therapistId: string, signal?: AbortSignal): Promise<TherapistAssignmentResponse[]> => {
    return api.get(`/psychologists/${therapistId}/assignments`, { signal })
  },

  getByStudent: async (studentId: number, signal?: AbortSignal): Promise<TherapistAssignmentResponse[]> => {
    return api.get(`/students/${studentId}/therapist-assignments`, { signal })
  },

  create: async (data: CreateTherapistAssignmentDto): Promise<TherapistAssignmentResponse> => {
    return api.post('/therapist-assignments', data)
  },

  end: async (id: number, reason?: string): Promise<TherapistAssignmentResponse> => {
    return api.patch(`/therapist-assignments/${id}/end`, { reason })
  }
}
