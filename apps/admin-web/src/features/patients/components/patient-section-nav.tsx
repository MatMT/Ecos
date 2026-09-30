"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { UserRole } from "@/features/auth/types/auth.types"
import {
  getAvailablePatientNavigation,
  isPatientNavigationItemActive,
} from "@/features/patients/navigation/patient-navigation"

interface PatientSectionNavProps {
  patientId: number
  role: UserRole
}

export function PatientSectionNav({ patientId, role }: PatientSectionNavProps) {
  const pathname = usePathname()
  const items = getAvailablePatientNavigation(patientId, role)

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Secciones del paciente" className="overflow-x-auto">
      <ul className="flex min-w-max gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {items.map((item) => {
          const isActive = isPatientNavigationItemActive(pathname, item)
          const Icon = item.icon

          return (
            <li key={item.section}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                }
                href={item.href}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
