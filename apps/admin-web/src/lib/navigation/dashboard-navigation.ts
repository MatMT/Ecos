import {
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/features/auth/types/auth.types"
import { can, type Permission } from "@/lib/permissions"

export interface NavigationItem {
  activeMatch?: "exact" | "prefix"
  href: string
  icon: LucideIcon
  label: string
  permission: Permission
}

interface BreadcrumbDefinition {
  href?: string
  label: string
  path: string
}

export const dashboardNavigation: readonly NavigationItem[] = [
  {
    activeMatch: "exact",
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Inicio",
    permission: "dashboard.view",
  },
  {
    activeMatch: "prefix",
    href: "/patients",
    icon: Users,
    label: "Pacientes",
    permission: "patients.view",
  },
]

const breadcrumbDefinitions: readonly BreadcrumbDefinition[] = [
  { href: "/dashboard", label: "Inicio", path: "/dashboard" },
  { href: "/patients", label: "Pacientes", path: "/patients" },
]

export function getNavigationForRole(
  role: UserRole | string | null | undefined,
): readonly NavigationItem[] {
  return dashboardNavigation.filter((item) => can(role, item.permission))
}

export function isNavigationItemActive(
  pathname: string,
  item: NavigationItem,
): boolean {
  if (item.activeMatch === "exact") {
    return pathname === item.href
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function getBreadcrumbDefinitions(
  pathname: string,
): readonly BreadcrumbDefinition[] {
  if (pathname === "/dashboard") {
    return breadcrumbDefinitions.slice(0, 1)
  }

  if (pathname === "/patients") {
    return breadcrumbDefinitions.slice(0, 2)
  }

  if (pathname === "/patients/new") {
    return [
      ...breadcrumbDefinitions,
      { label: "Nuevo paciente", path: pathname },
    ]
  }

  const editMatch = pathname.match(/^\/patients\/([^/]+)\/edit$/)
  if (editMatch) {
    const patientPath = `/patients/${editMatch[1]}`

    return [
      ...breadcrumbDefinitions,
      { href: patientPath, label: "Detalle", path: patientPath },
      { label: "Editar", path: pathname },
    ]
  }

  if (/^\/patients\/[^/]+$/.test(pathname)) {
    return [...breadcrumbDefinitions, { label: "Detalle", path: pathname }]
  }

  return [{ label: "Inicio", path: "/dashboard", href: "/dashboard" }]
}
