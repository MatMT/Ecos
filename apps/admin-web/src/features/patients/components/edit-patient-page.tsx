"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { notFound, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { ErrorState } from "@/components/common/ErrorState"
import { ForbiddenState } from "@/components/common/ForbiddenState"
import { PageHeader } from "@/components/common/PageHeader"
import { useDashboardBreadcrumbLabel } from "@/components/common/DashboardBreadcrumbs"
import {
  PatientForm,
  PatientFormSkeleton,
} from "@/features/patients/components/patient-form"
import { usePatient } from "@/features/patients/hooks/use-patient"
import { useUpdatePatient } from "@/features/patients/hooks/use-update-patient"
import { patientRoutes } from "@/features/patients/routes/patient-routes"
import { updatePatientFormSchema } from "@/features/patients/schemas/patient-form.schema"
import type {
  PatientDetail,
  PatientFormValues,
} from "@/features/patients/types/patient.types"
import { ApiError } from "@/lib/api"
import { getPatientFormErrorMessage } from "@/features/patients/utils/patient-form-errors"
import {
  toPatientFormValues,
  toUpdatePatientInput,
} from "@/features/patients/utils/patient-form-mappers"

interface EditPatientPageProps {
  patientId: number
}

export function EditPatientPage({ patientId }: EditPatientPageProps) {
  const patientQuery = usePatient(patientId)

  if (patientQuery.isPending) {
    return (
      <div className="space-y-8">
        <PageHeader title="Editar paciente" />
        <PatientFormSkeleton />
      </div>
    )
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
        description={getPatientFormErrorMessage(patientQuery.error)}
        onRetry={() => void patientQuery.refetch()}
        title="No fue posible cargar el paciente"
      />
    )
  }

  return <PatientEditForm patient={patientQuery.data} patientId={patientId} />
}

interface PatientEditFormProps {
  patient: PatientDetail
  patientId: number
}

function PatientEditForm({ patient, patientId }: PatientEditFormProps) {
  const router = useRouter()
  const updatePatient = useUpdatePatient(patientId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<PatientFormValues>({
    defaultValues: toPatientFormValues(patient),
    resolver: zodResolver(updatePatientFormSchema),
  })

  useDashboardBreadcrumbLabel(
    patient.user.fullName,
    patientRoutes.overview(patientId),
  )

  function handleSubmit(values: PatientFormValues) {
    setSubmitError(null)
    updatePatient.mutate(toUpdatePatientInput(values), {
      onError: (error) => setSubmitError(getPatientFormErrorMessage(error)),
      onSuccess: () => {
        toast.success("Información actualizada.")
        router.push(patientRoutes.list())
      },
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Modifique únicamente la información institucional autorizada."
        title="Editar paciente"
      />
      <PatientForm
        form={form}
        isPending={updatePatient.isPending}
        mode="edit"
        onCancel={() => router.push(patientRoutes.list())}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </div>
  )
}
