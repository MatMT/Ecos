import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { PatientAvatar } from "@/features/patients/components/patient-avatar"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import type { AssignedTherapistSummary } from "@/features/patients/types/patient.types"

interface PatientHeaderProps {
  email: string | null
  fullName: string | null
  patientId: number
  studentCode: string | null
  therapist: AssignedTherapistSummary | null
}

export function PatientHeader({
  email,
  fullName,
  patientId,
  studentCode,
  therapist,
}: PatientHeaderProps) {
  const displayName = fullName?.trim() || "Nombre no registrado"

  return (
    <>
      <div>
        <Button asChild size="sm" variant="ghost">
          <Link href={patientRoutes.list()}>Volver a pacientes</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <PatientAvatar
              className="size-16 text-xl"
              fullName={fullName}
              patientId={patientId}
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">
                  {email ?? "Sin correo electrónico registrado"}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Código institucional: {studentCode ?? "Sin código asignado"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t pt-4 md:min-w-52 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Terapeuta asignado
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {therapist?.fullName?.trim() || "Sin terapeuta asignado"}
              </p>
              {therapist?.email ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {therapist.email}
                </p>
              ) : null}
              {therapist?.specialty ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Especialidad: {therapist.specialty}
                </p>
              ) : null}
            </div>
            <PermissionGate permission="patients.manage">
              <Button asChild size="sm" variant="outline">
                <Link href={patientRoutes.edit(patientId)}>Editar</Link>
              </Button>
            </PermissionGate>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
