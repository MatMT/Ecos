"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthLoading } from "@/features/auth/components/AuthLoading"
import { usePermission } from "@/features/auth/hooks/use-permission"
import { getRoutePermission } from "@/lib/permissions"

export function RouteAccessBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const requiredPermission = getRoutePermission(pathname)
  const isAllowed = usePermission(requiredPermission ?? undefined)

  useEffect(() => {
    if (!isAllowed) {
      router.replace("/403")
    }
  }, [isAllowed, router])

  if (!isAllowed) {
    return <AuthLoading />
  }

  return children
}
