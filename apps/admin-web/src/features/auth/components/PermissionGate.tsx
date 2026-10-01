"use client"

import type { ReactNode } from "react"
import type { Permission } from "@/lib/permissions"
import { usePermission } from "@/features/auth/hooks/use-permission"

interface PermissionGateProps {
  children: ReactNode
  fallback?: ReactNode
  permission: Permission
}

export function PermissionGate({
  children,
  fallback = null,
  permission,
}: PermissionGateProps) {
  return usePermission(permission) ? children : fallback
}
