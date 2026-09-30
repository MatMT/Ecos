import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  CalendarDays,
  Calendar,
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
    href: "/appointments",
    icon: Calendar,
    label: "Citas",
    permission: "dashboard.view",
  },
  {
    activeMatch: "prefix",
    href: "/patients",
    icon: Users,
    label: "Pacientes",
    permission: "patients.view",
  },
  {
    activeMatch: "prefix",
    href: "/therapists",
    icon: Stethoscope,
    label: "Terapeutas",
    permission: "therapists.view",
  },
  {
    activeMatch: "prefix",
    href: "/assignments",
    icon: ClipboardList,
    label: "Asignaciones",
    permission: "assignments.view",
  },
  {
    activeMatch: "prefix",
    href: "/schedules",
    icon: CalendarDays,
    label: "Horarios",
    permission: "therapists.view",
  },
]

const breadcrumbDefinitions: readonly BreadcrumbDefinition[] = [
  { href: "/dashboard", label: "Inicio", path: "/dashboard" },
  { href: "/appointments", label: "Citas", path: "/appointments" },
  { href: "/patients", label: "Pacientes", path: "/patients" },
  { href: "/therapists", label: "Terapeutas", path: "/therapists" },
  { href: "/assignments", label: "Asignaciones", path: "/assignments" },
  { href: "/schedules", label: "Horarios", path: "/schedules" },
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
    return [breadcrumbDefinitions[0], breadcrumbDefinitions[2]]
  }

  if (pathname === "/patients/new") {
    return [
      breadcrumbDefinitions[0], breadcrumbDefinitions[2],
      { label: "Nuevo paciente", path: pathname },
    ]
  }

  const editMatch = pathname.match(/^\/patients\/([^/]+)\/edit$/)
  if (editMatch) {
    const patientPath = `/patients/${editMatch[1]}`

    return [
      breadcrumbDefinitions[0], breadcrumbDefinitions[2],
      { href: patientPath, label: "Detalle", path: patientPath },
      { label: "Editar", path: pathname },
    ]
  }

  const clinicalRecordMatch = pathname.match(
    /^\/patients\/([^/]+)\/clinical-record$/,
  )
  if (clinicalRecordMatch) {
    const patientPath = `/patients/${clinicalRecordMatch[1]}`
    return [
      breadcrumbDefinitions[0],
      breadcrumbDefinitions[2],
      { href: patientPath, label: "Detalle", path: patientPath },
      { label: "Expediente", path: pathname },
    ]
  }

  const sessionsMatch = pathname.match(/^\/patients\/([^/]+)\/sessions$/)
  if (sessionsMatch) {
    const patientPath = `/patients/${sessionsMatch[1]}`
    return [
      breadcrumbDefinitions[0],
      breadcrumbDefinitions[2],
      { href: patientPath, label: "Detalle", path: patientPath },
      { label: "Sesiones", path: pathname },
    ]
  }

  const newSessionMatch = pathname.match(
    /^\/patients\/([^/]+)\/sessions\/new$/,
  )
  if (newSessionMatch) {
    const patientPath = `/patients/${newSessionMatch[1]}`
    const sessionsPath = `${patientPath}/sessions`
    return [
      breadcrumbDefinitions[0],
      breadcrumbDefinitions[2],
      { href: patientPath, label: "Detalle", path: patientPath },
      { href: sessionsPath, label: "Sesiones", path: sessionsPath },
      { label: "Nueva sesión", path: pathname },
    ]
  }

  if (/^\/patients\/[^/]+$/.test(pathname)) {
    return [breadcrumbDefinitions[0], breadcrumbDefinitions[2], { label: "Detalle", path: pathname }]
  }

  if (pathname === "/therapists") {
    return [breadcrumbDefinitions[0], breadcrumbDefinitions[3]]
  }

  if (pathname === "/therapists/new") {
    return [
      breadcrumbDefinitions[0],
      breadcrumbDefinitions[3],
      { label: "Nuevo terapeuta", path: pathname },
    ]
  }

  const scheduleMatch = pathname.match(/^\/therapists\/([^/]+)\/schedule$/)
  if (scheduleMatch) {
    const therapistPath = `/therapists/${scheduleMatch[1]}`
    return [
      breadcrumbDefinitions[0],
      breadcrumbDefinitions[3],
      { href: therapistPath, label: "Detalle", path: therapistPath },
      { label: "Horario", path: pathname }
    ]
  }

  if (/^\/therapists\/[^/]+$/.test(pathname)) {
    return [
      breadcrumbDefinitions[0],
      breadcrumbDefinitions[3],
      { label: "Detalle", path: pathname }
    ]
  }

  if (pathname === "/assignments") {
    return [breadcrumbDefinitions[0], breadcrumbDefinitions[4]]
  }

  if (pathname === "/schedules") {
    return [breadcrumbDefinitions[0], breadcrumbDefinitions[5]]
  }

  if (pathname === "/appointments") {
    return [breadcrumbDefinitions[0], breadcrumbDefinitions[1]]
  }

  return [{ label: "Inicio", path: "/dashboard", href: "/dashboard" }]
}
