import {
  CalendarDays,
  ClipboardList,
  FileHeart,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Share2,
  Stethoscope,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/features/auth/types/auth.types"
import {
  patientRoutes,
  type PatientRouteSection,
} from "@/features/patients/routes/patient-routes"
import { can, type Permission } from "@/lib/permissions"

export type PatientModuleAvailability = "available" | "future"

export interface PatientNavigationItem {
  activeMatch: "exact" | "prefix"
  availability: PatientModuleAvailability
  getHref: (patientId: number) => string
  icon: LucideIcon
  label: string
  permission: Permission
  section: PatientRouteSection
}

export interface AvailablePatientNavigationItem extends PatientNavigationItem {
  href: string
}

export const patientNavigation: readonly PatientNavigationItem[] = [
  {
    activeMatch: "exact",
    availability: "available",
    getHref: patientRoutes.overview,
    icon: LayoutDashboard,
    label: "Resumen",
    permission: "patients.view",
    section: "overview",
  },
  {
    activeMatch: "exact",
    availability: "available",
    getHref: patientRoutes.clinicalRecord,
    icon: FileHeart,
    label: "Expediente",
    permission: "clinical-record.view",
    section: "clinicalRecord",
  },
  {
    activeMatch: "prefix",
    availability: "available",
    getHref: patientRoutes.sessions,
    icon: FileText,
    label: "Sesiones",
    permission: "clinical-notes.view",
    section: "sessions",
  },
  {
    activeMatch: "exact",
    availability: "future",
    getHref: patientRoutes.appointments,
    icon: CalendarDays,
    label: "Citas",
    permission: "appointments.view",
    section: "appointments",
  },
  {
    activeMatch: "exact",
    availability: "available",
    getHref: patientRoutes.biometrics,
    icon: HeartPulse,
    label: "BiometrÃ­a",
    permission: "biometrics.view",
    section: "biometrics",
  },
  {
    activeMatch: "prefix",
    availability: "available",
    getHref: patientRoutes.alerts,
    icon: TriangleAlert,
    label: "Alertas",
    permission: "alerts.view",
    section: "alerts",
  },
  {
    activeMatch: "exact",
    availability: "future",
    getHref: patientRoutes.treatmentPlan,
    icon: Stethoscope,
    label: "Plan terapÃ©utico",
    permission: "treatment-plans.view",
    section: "treatmentPlan",
  },
  {
    activeMatch: "exact",
    availability: "future",
    getHref: patientRoutes.activities,
    icon: ClipboardList,
    label: "Actividades",
    permission: "patient-activities.view",
    section: "activities",
  },
  {
    activeMatch: "exact",
    availability: "future",
    getHref: patientRoutes.sharedContent,
    icon: Share2,
    label: "Contenido compartido",
    permission: "shared-content.view",
    section: "sharedContent",
  },
  {
    activeMatch: "exact",
    availability: "available",
    getHref: patientRoutes.timeline,
    icon: CalendarDays,
    label: "Timeline",
    permission: "patients.view",
    section: "timeline",
  },
]

export function getAvailablePatientNavigation(
  patientId: number,
  role: UserRole,
): readonly AvailablePatientNavigationItem[] {
  return patientNavigation
    .filter(
      (item) => item.availability === "available" && can(role, item.permission),
    )
    .map((item) => ({ ...item, href: item.getHref(patientId) }))
}

export function isPatientNavigationItemActive(
  pathname: string,
  item: AvailablePatientNavigationItem,
): boolean {
  return item.activeMatch === "exact"
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

