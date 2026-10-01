import Link from "next/link"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { PatientAvatar } from "@/features/patients/components/patient-avatar"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import type { PatientListItem } from "@/features/patients/types/patient.types"

interface PatientCardProps {
  patient: PatientListItem
}

export function PatientCard({ patient }: PatientCardProps) {
  const fullName = patient.user.fullName?.trim() || "Nombre no registrado"

  return (
    <Card
      aria-labelledby={`patient-${patient.id}-name`}
      className="min-w-0 transition-colors"
    >
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <PatientAvatar
            fullName={patient.user.fullName}
            patientId={patient.id}
          />
          <div className="min-w-0">
            <CardTitle className="truncate" id={`patient-${patient.id}-name`}>
              {fullName}
            </CardTitle>
            {patient.user.email ? (
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {patient.user.email}
              </p>
            ) : null}
          </div>
        </div>
        <CardAction>
          <div className="flex items-center gap-1">
            <PermissionGate permission="patients.view">
              <Button asChild size="xs" variant="ghost">
                <Link
                  aria-label={`Ver paciente ${fullName}`}
                  href={patientRoutes.overview(patient.id)}
                >
                  Ver
                </Link>
              </Button>
            </PermissionGate>
            <PermissionGate permission="patients.manage">
              <Button asChild size="xs" variant="ghost">
                <Link
                  aria-label={`Editar paciente ${fullName}`}
                  href={patientRoutes.edit(patient.id)}
                >
                  Editar
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <PatientDetail
            label="Diagnóstico principal"
            value={patient.primaryDiagnosis ?? "Sin diagnóstico registrado"}
          />
        </dl>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          Código institucional
        </span>
        <span className="min-w-0 truncate text-right text-sm font-medium text-foreground">
          {patient.studentCode ?? "Sin código asignado"}
        </span>
      </CardFooter>
    </Card>
  )
}

export function PatientCardsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-3 w-2/5" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
          <CardFooter className="justify-between">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-4 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

interface PatientDetailProps {
  label: string
  value: string
}

function PatientDetail({ label, value }: PatientDetailProps) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="line-clamp-2 text-sm text-foreground">{value}</dd>
    </div>
  )
}
