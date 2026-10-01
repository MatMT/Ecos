import type { ReactNode } from "react"
import { DashboardShell } from "@/components/common/DashboardShell"
import { AuthBoundary } from "@/features/auth/components/AuthBoundary"
import { RouteAccessBoundary } from "@/features/auth/components/RouteAccessBoundary"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <AuthBoundary>
      <RouteAccessBoundary>
        <DashboardShell>{children}</DashboardShell>
      </RouteAccessBoundary>
    </AuthBoundary>
  )
}
