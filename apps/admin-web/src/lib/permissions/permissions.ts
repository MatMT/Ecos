import type { UserRole } from "@/features/auth/types/auth.types"

export const permissions = [
  "administration.view",
  "alerts.manage",
  "alerts.view",
  "appointments.manage",
  "appointments.view",
  "activities.catalog.manage",
  "activities.catalog.view",
  "assignments.manage",
  "assignments.view",
  "biometrics.view",
  "clinical-notes.manage",
  "clinical-notes.view",
  "clinical-record.manage",
  "clinical-record.view",
  "dashboard.view",
  "patient-activities.manage",
  "patient-activities.view",
  "patients.manage",
  "patients.view",
  "schedules.manage",
  "schedules.view",
  "shared-content.view",
  "therapists.manage",
  "therapists.view",
  "treatment-plans.manage",
  "treatment-plans.view",
  "users.manage",
  "users.view",
] as const

export type Permission = (typeof permissions)[number]

type KnownRole = Exclude<UserRole, null>

export interface RouteAccessRule {
  path: string
  permission: Permission
}

export const rolePermissions: Readonly<
  Record<KnownRole, readonly Permission[]>
> = {
  administrator: [
    "administration.view",
    "appointments.manage",
    "appointments.view",
    "activities.catalog.manage",
    "activities.catalog.view",
    "assignments.manage",
    "assignments.view",
    "dashboard.view",
    "patients.manage",
    "patients.view",
    "schedules.manage",
    "schedules.view",
    "therapists.manage",
    "therapists.view",
    "users.manage",
    "users.view",
  ],
  psychologist: [
    "alerts.manage",
    "alerts.view",
    "appointments.manage",
    "appointments.view",
    "activities.catalog.view",
    "biometrics.view",
    "clinical-notes.manage",
    "clinical-notes.view",
    "clinical-record.manage",
    "clinical-record.view",
    "dashboard.view",
    "patient-activities.manage",
    "patient-activities.view",
    "patients.view",
    "shared-content.view",
    "treatment-plans.manage",
    "treatment-plans.view",
  ],
  student: [],
}

export const routeAccess: readonly RouteAccessRule[] = [
  { path: "/", permission: "dashboard.view" },
  { path: "/dashboard", permission: "dashboard.view" },
  { path: "/patients/new", permission: "patients.manage" },
  { path: "/patients/:id/edit", permission: "patients.manage" },
  { path: "/patients/:id/clinical-record", permission: "clinical-record.view" },
  { path: "/patients/:id/sessions/new", permission: "clinical-notes.manage" },
  { path: "/patients/:id/sessions/:noteId", permission: "clinical-notes.view" },
  { path: "/patients/:id/sessions", permission: "clinical-notes.view" },
  { path: "/patients", permission: "patients.view" },
  { path: "/administration", permission: "administration.view" },
  { path: "/therapists", permission: "therapists.view" },
  { path: "/assignments", permission: "assignments.view" },
  { path: "/schedules", permission: "schedules.view" },
  { path: "/appointments", permission: "appointments.view" },
  { path: "/users", permission: "users.view" },
  { path: "/activities", permission: "activities.catalog.view" },
  { path: "/alerts", permission: "alerts.view" },
  { path: "/clinical-record", permission: "clinical-record.view" },
  { path: "/clinical-notes", permission: "clinical-notes.view" },
  { path: "/treatment-plans", permission: "treatment-plans.view" },
  { path: "/shared-content", permission: "shared-content.view" },
  { path: "/biometrics", permission: "biometrics.view" },
]
