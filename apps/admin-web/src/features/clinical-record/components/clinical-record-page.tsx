"use client"

import { notFound } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { FileHeart, Pencil } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/features/auth/components/PermissionGate"
import { useSession } from "@/features/auth/hooks/use-session"
import { ClinicalRecordForm } from "@/features/clinical-record/components/clinical-record-form"
import { clinicalRecordKeys } from "@/features/clinical-record/api/clinical-record.keys"
import { useClinicalRecord } from "@/features/clinical-record/hooks/use-clinical-record"
import type { ClinicalRecord } from "@/features/clinical-record/types/clinical-record.types"
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { ApiError } from "@/lib/api"

interface ClinicalRecordPageProps {
  patientId: number
}

type ClinicalRecordMode = "create" | "edit" | "read"

export function ClinicalRecordPage({ patientId }: ClinicalRecordPageProps) {
  const session = useSession()
  const patientQuery = usePatient(patientId)

  if (session.isPending || patientQuery.isPending) {
    return <ClinicalRecordPageSkeleton />
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar el expediente clínico. Por favor, intente nuevamente."
        onRetry={() => void session.refetch()}
        title="No fue posible cargar el expediente clínico"
      />
    )
  }

  if (!session.isAuthenticated || session.data?.role !== "psychologist") {
    return <ForbiddenState variant="embedded" />
  }

  if (patientQuery.isError) {
    if (patientQuery.error instanceof ApiError) {
      if (patientQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (patientQuery.error.status === 404) {
        notFound()
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el contexto del paciente. Por favor, intente nuevamente."
        onRetry={() => void patientQuery.refetch()}
        title="No fue posible cargar el expediente clínico"
      />
    )
  }

  const patient = patientQuery.data
  const context: PatientWorkspaceContext = {
    email: patient.user.email,
    fullName: patient.user.fullName,
    patientId: patient.id,
    studentCode: patient.studentCode,
    therapist: patient.assignedDoctor ?? null,
  }

  return (
    <PatientWorkspace context={context} role={session.data.role}>
      <ClinicalRecordContent studentId={patientId} />
    </PatientWorkspace>
  )
}

function ClinicalRecordContent({ studentId }: { studentId: number }) {
  const recordQuery = useClinicalRecord(studentId)
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<ClinicalRecordMode>("read")

  if (recordQuery.isPending) {
    return <ClinicalRecordContentSkeleton />
  }

  if (recordQuery.isError) {
    if (recordQuery.error instanceof ApiError) {
      if (recordQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />
      }

      if (recordQuery.error.status === 404) {
        if (mode === "create") {
          return (
            <ClinicalRecordEditor
              mode="create"
              onCancel={() => setMode("read")}
              onConflict={() => {
                void queryClient
                  .invalidateQueries({
                    queryKey: clinicalRecordKeys.byPatient(studentId),
                  })
                  .then(() => recordQuery.refetch())
                  .then((result) => {
                    if (result.data) {
                      setMode("read")
                    }
                  })
              }}
              onSaved={() => setMode("read")}
              studentId={studentId}
            />
          )
        }

        return (
          <>
            <PageHeader
              description="Consulte y mantenga la información clínica longitudinal del paciente."
              title="Expediente clínico"
            />
            <Card>
              <EmptyState
                action={
                  <PermissionGate permission="clinical-record.manage">
                    <Button onClick={() => setMode("create")} type="button">
                      Crear expediente
                    </Button>
                  </PermissionGate>
                }
                icon={FileHeart}
                description="El expediente clínico de este paciente aún no ha sido registrado."
                title="Expediente clínico no registrado"
              />
            </Card>
          </>
        )
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el expediente clínico. Por favor, intente nuevamente."
        onRetry={() => void recordQuery.refetch()}
        title="No fue posible cargar el expediente clínico"
      />
    )
  }

  const record = recordQuery.data
  if (mode === "edit") {
    return (
      <ClinicalRecordEditor
        mode="edit"
        onCancel={() => setMode("read")}
        onConflict={() => undefined}
        onSaved={() => setMode("read")}
        record={record}
        studentId={studentId}
      />
    )
  }

  return <ClinicalRecordReadView onEdit={() => setMode("edit")} record={record} />
}

function ClinicalRecordEditor({
  mode,
  onCancel,
  onConflict,
  onSaved,
  record,
  studentId,
}: {
  mode: Exclude<ClinicalRecordMode, "read">
  onCancel: () => void
  onConflict: () => void
  onSaved: () => void
  record?: ClinicalRecord
  studentId: number
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        description={
          mode === "create"
            ? "Registre la información clínica longitudinal disponible del paciente."
            : "Actualice la información clínica longitudinal cuando sea necesario."
        }
        title={mode === "create" ? "Crear expediente clínico" : "Editar expediente clínico"}
      />
      <ClinicalRecordForm
        mode={mode}
        onCancel={onCancel}
        onConflict={onConflict}
        onSaved={onSaved}
        record={record}
        studentId={studentId}
      />
    </div>
  )
}

function ClinicalRecordReadView({
  onEdit,
  record,
}: {
  onEdit: () => void
  record: ClinicalRecord
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <PermissionGate permission="clinical-record.manage">
            <Button onClick={onEdit} type="button">
              <Pencil aria-hidden="true" />
              Editar expediente
            </Button>
          </PermissionGate>
        }
        description="Información clínica longitudinal registrada para el acompañamiento del paciente."
        title="Expediente clínico"
      />
      <Card>
        <CardContent className="divide-y divide-border p-6">
          <ClinicalRecordSection label="Motivo inicial de consulta" value={record.initialReason} />
          <ClinicalRecordSection label="Historial psicológico" value={record.psychologicalHistory} />
          <ClinicalRecordSection label="Historial psiquiátrico" value={record.psychiatricHistory} />
          <ClinicalRecordSection
            label="Antecedentes familiares relevantes"
            value={record.relevantFamilyHistory}
          />
          <ClinicalRecordSection label="Tratamientos previos" value={record.previousTreatments} />
          <ClinicalRecordSection label="Medicación actual" value={record.currentMedication} />
          <ClinicalRecordSection label="Observaciones generales" value={record.generalObservations} />
          <p className="pt-5 text-xs text-muted-foreground">
            Última actualización: {formatUpdatedAt(record.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ClinicalRecordSection({ label, value }: { label: string; value: string | null }) {
  return (
    <section className="py-5 first:pt-0">
      <h2 className="font-display text-base font-semibold text-foreground">{label}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
        {value?.trim() || "Sin información registrada."}
      </p>
    </section>
  )
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function ClinicalRecordPageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-44 w-full" />
      <ClinicalRecordContentSkeleton />
    </div>
  )
}

function ClinicalRecordContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
