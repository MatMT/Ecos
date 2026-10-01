"use client" /* Filter / Search Bar */ /* Content Rendering */ /* Pagination Controls */ /* Modal for Therapist Assignment */

// function getPatientsErrorMessage(error: Error): string {
//   if (error instanceof ApiError) {
//     return error.message
//   }

//   return "Ha ocurrido un problema temporal. Por favor, intente nuevamente."
// }

import { useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,

  Plus,
  Search,
  UserCheck,
} from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { AssignTherapistDialog } from "@/features/patients/components/AssignTherapistDialog"
import type { PatientListItem } from "@/features/patients/types/patient.types"
import { ApiError } from "@/lib/api"
import {

} from "@/features/patients/components/patient-card"
import { usePatients } from "@/features/patients/hooks/use-patients"
import { patientRoutes } from "@/features/patients/routes/patient-routes"


export function PatientsPage() {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedPatientForAssign, setSelectedPatientForAssign] =
    useState<PatientListItem | null>(null)
  const pageSize = 6
  const patientsQuery = usePatients({
    search:
      search.trim() ||
      undefined,
    skip:
      currentPage *
      pageSize,
    take: pageSize,
  })
  const patients =
    patientsQuery.data ??
    []

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <PermissionGate permission="patients.manage">
            <Button asChild>
              <Link href={patientRoutes.create()}>
                <Plus aria-hidden="true" className="mr-2 size-4" />
                Nuevo paciente
              </Link>
            </Button>
          </PermissionGate>
        }
        description="Gestión y supervisión de los pacientes de la institución."
        title="Pacientes"
      />
      {}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(0)
              }}
              placeholder="Buscar por nombre, código institucional o correo..."
              value={search}
            />
          </div>
          {search && (
            <Button onClick={() => setSearch("")} size="sm" variant="ghost">
              Limpiar búsqueda
            </Button>
          )}
        </CardContent>
      </Card>
      {}
      {patientsQuery.isError &&
        (patientsQuery.error instanceof
          ApiError &&
        patientsQuery.error.status ===
          403 ? (
          <ForbiddenState variant="embedded" />
        ) : (
          <ErrorState
            description="Ha ocurrido un problema al consultar el listado de pacientes."
            onRetry={() => void patientsQuery.refetch()}
            title="Error al cargar pacientes"
          />
        ))}
      {patientsQuery.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton className="h-44 w-full rounded-xl" key={i} />
          ))}
        </div>
      )}
      {patientsQuery.isSuccess &&
        patients.length ===
          0 && (
          <EmptyState
            description="No se han encontrado pacientes registrados que coincidan con la búsqueda."
            title="No se encontraron pacientes"
          />
        )}
      {patientsQuery.isSuccess &&
        patients.length >
          0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => {
              const fullName =
                patient.user.fullName?.trim() ||
                "Nombre no registrado"
              const therapistName =
                patient.assignedDoctor?.fullName ||
                "Sin terapeuta asignado"
              return (
                <Card
                  className="flex flex-col justify-between transition-shadow hover:shadow-md"
                  key={patient.id}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {fullName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {patient.user.email ||
                            "Sin correo"}
                        </p>
                      </div>
                      {patient.studentCode && (
                        <Badge variant="outline">{patient.studentCode}</Badge>
                      )}
                    </div>
                    <div className="mt-4 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Terapeuta:</span>
                        <span className="font-medium text-foreground">
                          {therapistName}
                        </span>
                      </div>
                      {patient.primaryDiagnosis && (
                        <div className="flex justify-between">
                          <span>Diagnóstico:</span>
                          <span className="truncate font-medium text-foreground">
                            {patient.primaryDiagnosis}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={patientRoutes.overview(patient.id)}>
                        Abrir ficha
                      </Link>
                    </Button>
                    <div className="flex items-center gap-1">
                      <PermissionGate permission="patients.manage">
                        <Button
                          onClick={() => setSelectedPatientForAssign(patient)}
                          size="sm"
                          title="Asignar terapeuta"
                          variant="ghost"
                        >
                          <UserCheck className="size-4" />
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={patientRoutes.edit(patient.id)}>
                            Editar
                          </Link>
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      {}
      {patientsQuery.isSuccess &&
        patients.length >
          0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Página{" "}
              {currentPage +
                1}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={
                  currentPage ===
                  0
                }
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.max(
                      0,
                      p -
                        1,
                    ),
                  )
                }
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="mr-1 size-4" />
                Anterior
              </Button>
              <Button
                disabled={
                  patients.length <
                  pageSize
                }
                onClick={() =>
                  setCurrentPage(
                    (p) =>
                      p +
                      1,
                  )
                }
                size="sm"
                variant="outline"
              >
                Siguiente
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}
      {}
      <AssignTherapistDialog
        onOpenChange={(open) => {
          if (!open) setSelectedPatientForAssign(null)
        }}
        open={Boolean(selectedPatientForAssign)}
        patient={selectedPatientForAssign}
      />
    </div>
  )
}

