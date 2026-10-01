"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { ApiError, api } from "@/lib/api"
import {
  clearAuthTokens,
  getAuthTokens,
  subscribeToAuthTokens,
} from "@/features/auth/auth-token-storage"
import { refreshStoredSession } from "@/features/auth/session-service"

type SessionEndReason = "expired" | "logout" | "unauthenticated"

interface EndSessionOptions {
  reason: SessionEndReason
  returnTo?: string
}

interface AuthSessionContextValue {
  endSession: (options: EndSessionOptions) => void
  isConfigured: boolean
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const router = useRouter()
  const isTerminatingRef = useRef(false)

  const endSession = useCallback(
    ({ reason, returnTo }: EndSessionOptions) => {
      if (isTerminatingRef.current) {
        return
      }

      isTerminatingRef.current = true
      clearAuthTokens()
      queryClient.clear()
      const protectedReturnTo =
        reason === "expired" || reason === "unauthenticated"
          ? returnTo ?? (pathname === "/login" ? undefined : pathname)
          : undefined

      router.replace(createLoginUrl(reason, protectedReturnTo))
    },
    [pathname, queryClient, router],
  )

  useEffect(() => {
    return subscribeToAuthTokens(() => {
      if (getAuthTokens()) {
        isTerminatingRef.current = false
      }
    })
  }, [])

  useEffect(() => {
    api.setAuthenticationHandler({
      getAccessToken: () => getAuthTokens()?.accessToken ?? null,
      onSessionExpired: () => endSession({ reason: "expired" }),
      refreshAccessToken: async () => {
        try {
          const refreshedSession = await refreshStoredSession()
          return refreshedSession?.access_token ?? null
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            return null
          }

          throw error
        }
      },
    })
    return () => {
      api.setAuthenticationHandler(undefined)
    }
  }, [endSession])

  return (
    <AuthSessionContext.Provider value={{ endSession, isConfigured: true }}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSessionLifecycle(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext)

  if (!context) {
    throw new Error(
      "useAuthSessionLifecycle debe utilizarse dentro de AuthSessionProvider.",
    )
  }

  return context
}

function createLoginUrl(reason: SessionEndReason, returnTo?: string): string {
  const searchParams = new URLSearchParams()

  if (reason === "expired") {
    searchParams.set("reason", "expired")
  }

  if (returnTo) {
    searchParams.set("returnTo", returnTo)
  }

  const search = searchParams.toString()
  return search ? `/login?${search}` : "/login"
}
