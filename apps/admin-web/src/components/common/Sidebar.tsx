"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  isNavigationItemActive,
  type NavigationItem,
} from "@/lib/navigation"

interface DashboardSidebarProps {
  isMobileOpen: boolean
  items: readonly NavigationItem[]
  onMobileOpenChange: (open: boolean) => void
}

export function DashboardSidebar({
  isMobileOpen,
  items,
  onMobileOpenChange,
}: DashboardSidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-navy-950 lg:flex">
        <SidebarContent items={items} />
      </aside>

      <Dialog open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <DialogContent
          className="top-0 left-0 h-dvh w-72 max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-navy-950 p-0 text-white sm:max-w-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Navegación principal</DialogTitle>
          <aside className="flex h-full min-h-0 flex-col">
            <div className="flex justify-end px-3 pt-3">
              <Button
                aria-label="Cerrar navegación"
                className="text-white hover:bg-white/10 hover:text-white"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => onMobileOpenChange(false)}
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </div>
            <SidebarContent
              items={items}
              onNavigate={() => onMobileOpenChange(false)}
            />
          </aside>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface SidebarContentProps {
  items: readonly NavigationItem[]
  onNavigate?: () => void
}

function SidebarContent({ items, onNavigate }: SidebarContentProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link
        className="flex items-center gap-3 border-b border-white/10 px-6 py-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300"
        href="/dashboard"
        onClick={onNavigate}
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Activity aria-hidden="true" className="size-[18px]" />
        </span>
        <span>
          <span className="block font-display text-sm font-bold text-white">
            ECOS
          </span>
          <span className="block text-xs text-white/55">Panel de gestión</span>
        </span>
      </Link>

      <nav
        aria-label="Navegación principal"
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-white/45">
          Principal
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = isNavigationItemActive(pathname, item)

            return (
              <li key={item.href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                    isActive
                      ? "bg-primary/25 text-teal-300"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
