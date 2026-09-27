"use client"

import { useState, type ReactNode } from "react"
import { DashboardHeader } from "@/components/common/DashboardHeader"
import { DashboardBreadcrumbProvider } from "@/components/common/DashboardBreadcrumbs"
import { DashboardSidebar } from "@/components/common/Sidebar"
import { useSession } from "@/features/auth/hooks/use-session"
import { getNavigationForRole } from "@/lib/navigation"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const session = useSession()

  if (!session.data) {
    return null
  }

  const navigationItems = getNavigationForRole(session.data.role)

  return (
    <DashboardBreadcrumbProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <DashboardSidebar
          isMobileOpen={isMobileNavigationOpen}
          items={navigationItems}
          onMobileOpenChange={setIsMobileNavigationOpen}
        />
        <div className="min-h-dvh lg:pl-64">
          <DashboardHeader
            user={session.data}
            onOpenNavigation={() => setIsMobileNavigationOpen(true)}
          />
          <main id="main-content" className="min-w-0">
            <div className="w-full p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </DashboardBreadcrumbProvider>
  )
}
