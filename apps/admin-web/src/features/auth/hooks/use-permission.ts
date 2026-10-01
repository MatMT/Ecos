"use client"

import { can, type Permission } from "@/lib/permissions"
import { useSession } from "@/features/auth/hooks/use-session"

export function usePermission(permission: Permission | undefined): boolean {
  const session = useSession()

  if (!permission || !session.data || !session.isAuthenticated) {
    return false
  }

  return can(session.data.role, permission)
}
