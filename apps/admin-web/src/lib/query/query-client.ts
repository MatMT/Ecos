import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"

export const QUERY_GC_TIME_MS = 5 * 60 * 1_000
export const QUERY_STALE_TIME_MS = 60 * 1_000

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        gcTime: QUERY_GC_TIME_MS,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  })
}

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError) {
    if (
      error.code === "REQUEST_ABORTED" ||
      (error.status >= 400 && error.status < 500)
    ) {
      return false
    }
  }

  return failureCount < 1
}
