"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardBreadcrumbs } from "@/components/common/DashboardBreadcrumbs"
import ThemeToggle from "@/components/common/ThemeToggle"
import { UserMenu } from "@/components/common/UserMenu"
import type { AuthenticatedUser } from "@/features/auth/types/auth.types"

interface DashboardHeaderProps {
  onOpenNavigation: () => void
  user: AuthenticatedUser
}

export function DashboardHeader({
  onOpenNavigation,
  user,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Button
        aria-label="Abrir navegación"
        className="lg:hidden"
        size="icon"
        type="button"
        variant="ghost"
        onClick={onOpenNavigation}
      >
        <Menu aria-hidden="true" className="size-5" />
      </Button>
      <DashboardBreadcrumbs />
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
