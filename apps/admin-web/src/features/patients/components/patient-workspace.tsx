"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useDashboardBreadcrumbLabel } from "@/components/common/DashboardBreadcrumbs"
import type { UserRole } from "@/features/auth/types/auth.types"
import { PatientHeader } from "@/features/patients/components/patient-header"
import { PatientSectionNav } from "@/features/patients/components/patient-section-nav"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import type { AssignedTherapistSummary } from "@/features/patients/types/patient.types"

export interface PatientWorkspaceContext {
  email: string | null
  fullName: string | null
  patientId: number
  studentCode: string | null
  therapist: AssignedTherapistSummary | null
}

interface PatientWorkspaceProps {
  children: ReactNode
  context: PatientWorkspaceContext
  role: UserRole
}

export function PatientWorkspace({
  children,
  context,
  role,
}: PatientWorkspaceProps) {
  const pathname = usePathname()
  const isOverview = pathname === patientRoutes.overview(context.patientId)
  
  const displayName = context.fullName?.trim() || "Nombre no registrado"
  useDashboardBreadcrumbLabel(
    displayName,
    patientRoutes.overview(context.patientId),
  )

  return (
    <div className={isOverview ? "space-y-6" : "space-y-4"}>
      <PatientHeader {...context} isCompact={!isOverview} />
      <PatientSectionNav patientId={context.patientId} role={role} />
      {children}
    </div>
  )
}
