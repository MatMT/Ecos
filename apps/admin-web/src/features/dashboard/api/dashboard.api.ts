import { api } from '@/lib/api'
import type {
  AdministratorDashboard,
  PsychologistDashboard,
} from '../types/dashboard.types'

export const dashboardApi = {
  getPsychologistDashboard: (signal?: AbortSignal) =>
    api.get<PsychologistDashboard>('/dashboard/psychologist', { signal }),
  getAdministratorDashboard: (signal?: AbortSignal) =>
    api.get<AdministratorDashboard>('/dashboard/administrator', { signal }),
}
