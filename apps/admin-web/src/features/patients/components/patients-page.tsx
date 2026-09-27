"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { ApiError } from "@/lib/api"
import {
  PatientCard,
  PatientCardsSkeleton,
} from "@/features/patients/components/patient-card"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { INITIAL_PATIENTS_LIST_PARAMS } from "@/features/patients/types/patient.types"

export function PatientsPage() {
  const patientsQuery = usePatients(INITIAL_PATIENTS_LIST_PARAMS)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <PermissionGate permission="patients.manage">
            <Button asChild>
              <Link href="/patients/new">
                <Plus aria-hidden="true" />
                Nuevo paciente
              </Link>
            </Button>
          </PermissionGate>
        }
        description="Consulte los pacientes disponibles según el acceso autorizado."
        title="Pacientes"
      />
      <PatientsContent />
    </div>
  )

  function PatientsContent() {
    if (patientsQuery.isError) {
      if (
        patientsQuery.error instanceof ApiError &&
        patientsQuery.error.status === 403
      ) {
        return <ForbiddenState variant="embedded" />
      }

      return (
        <ErrorState
          description={getPatientsErrorMessage(patientsQuery.error)}
          onRetry={() => void patientsQuery.refetch()}
          title="No fue posible cargar los pacientes"
        />
      )
    }

    if (patientsQuery.isPending) {
      return <PatientCardsSkeleton />
    }

    if (!patientsQuery.data?.length) {
      return (
        <EmptyState
          description="No hay pacientes disponibles para mostrar."
          title="No se encontraron pacientes"
        />
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {patientsQuery.data.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>
    )
  }
}

function getPatientsErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return "Ha ocurrido un problema temporal. Por favor, intente nuevamente."
}
