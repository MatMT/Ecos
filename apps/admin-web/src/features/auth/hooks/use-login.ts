"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { authApi } from "@/features/auth/api/auth.api"
import { authKeys } from "@/features/auth/auth-keys"
import {
  clearAuthTokens,
  setAuthTokens,
} from "@/features/auth/auth-token-storage"
import { getSafeReturnTo } from "@/features/auth/return-to"
import { can } from "@/lib/permissions"
import {
  createAuthTokens,
  toAuthSession,
} from "@/features/auth/session-service"
import type { LoginInput } from "@/features/auth/types/auth.types"

export function useLogin(returnTo: string | null) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await authApi.login(input)
      setAuthTokens(createAuthTokens(response))

      try {
        const user = await authApi.getCurrentUser(response.user.id)
        const session = toAuthSession(user)

        return session
      } catch (error) {
        clearAuthTokens()
        queryClient.clear()
        throw error
      }
    },
    onSuccess: (session) => {
      queryClient.setQueryData(authKeys.session, session)
      router.replace(
        can(session.role, "dashboard.view")
          ? getSafeReturnTo(returnTo)
          : "/403",
      )
    },
  })
}
