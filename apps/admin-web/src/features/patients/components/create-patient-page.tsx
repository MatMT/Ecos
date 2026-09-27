"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { PatientForm } from "@/features/patients/components/patient-form"
import { useCreatePatient } from "@/features/patients/hooks/use-create-patient"
import { createPatientFormSchema } from "@/features/patients/schemas/patient-form.schema"
import {
  EMPTY_PATIENT_FORM_VALUES,
  type PatientFormValues,
} from "@/features/patients/types/patient.types"
import { getPatientFormErrorMessage } from "@/features/patients/utils/patient-form-errors"
import { toCreatePatientInput } from "@/features/patients/utils/patient-form-mappers"
import { useForm } from "react-hook-form"

export function CreatePatientPage() {
  const router = useRouter()
  const createPatient = useCreatePatient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<PatientFormValues>({
    defaultValues: EMPTY_PATIENT_FORM_VALUES,
    resolver: zodResolver(createPatientFormSchema),
  })

  function handleSubmit(values: PatientFormValues) {
    setSubmitError(null)
    createPatient.mutate(toCreatePatientInput(values), {
      onError: (error) => setSubmitError(getPatientFormErrorMessage(error)),
      onSuccess: () => {
        toast.success("Paciente creado correctamente.")
        router.push("/patients")
      },
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Complete la información administrativa requerida para registrar un paciente."
        title="Nuevo paciente"
      />
      <PatientForm
        form={form}
        isPending={createPatient.isPending}
        mode="create"
        onCancel={() => router.push("/patients")}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </div>
  )
}
