"use client"

import { useMutation } from "@tanstack/react-query"
import { authApi } from "@/features/auth/api/auth.api"
import { useAuthSessionLifecycle } from "@/features/auth/components/AuthSessionProvider"

export function useLogout() {
  const { endSession } = useAuthSessionLifecycle()

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } finally {
        endSession({ reason: "logout" })
      }
    },
  })
}
