"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"
import { can } from "@/lib/permissions"
import { authKeys } from "@/features/auth/auth-keys"
import {
  getAuthTokens,
  subscribeToAuthTokens,
} from "@/features/auth/auth-token-storage"
import { useAuthSessionLifecycle } from "@/features/auth/components/AuthSessionProvider"
import { resolveAuthSession } from "@/features/auth/session-service"

export function useSession() {
  const { endSession, isConfigured } = useAuthSessionLifecycle()
  const tokens = useSyncExternalStore(
    subscribeToAuthTokens,
    getAuthTokens,
    () => null,
  )
  const isBrowserReady = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false,
  )

  const sessionQuery = useQuery({
    enabled: isConfigured && isBrowserReady && tokens !== null,
    queryFn: ({ signal }) => resolveAuthSession(signal),
    queryKey: authKeys.session,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })

  const isUnauthorized =
    sessionQuery.error instanceof ApiError && sessionQuery.error.status === 401

  useEffect(() => {
    if (isUnauthorized) {
      endSession({ reason: "expired" })
    }
  }, [endSession, isUnauthorized])

  const isPending =
    !isConfigured ||
    !isBrowserReady ||
    (tokens !== null && sessionQuery.isPending)

  return {
    data: sessionQuery.data,
    error: sessionQuery.error,
    hasPortalAccess: sessionQuery.data
      ? can(sessionQuery.data.role, "dashboard.view")
      : false,
    isAuthenticated: sessionQuery.isSuccess,
    isError: sessionQuery.isError,
    isFetching: sessionQuery.isFetching,
    isPending,
    isUnauthenticated: isBrowserReady && (tokens === null || isUnauthorized),
    refetch: sessionQuery.refetch,
  }
}

function subscribeToBrowser(): () => void {
  return () => undefined
}
