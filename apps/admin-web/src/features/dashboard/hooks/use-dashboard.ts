import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import { dashboardKeys } from '../api/dashboard.keys'

export function usePsychologistDashboard() {
  return useQuery({
    queryKey: dashboardKeys.psychologist(),
    queryFn: ({ signal }) => dashboardApi.getPsychologistDashboard(signal),
  })
}

export function useAdministratorDashboard() {
  return useQuery({
    queryKey: dashboardKeys.administrator(),
    queryFn: ({ signal }) => dashboardApi.getAdministratorDashboard(signal),
  })
}
