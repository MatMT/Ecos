"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, type Path, type UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { FormError } from "@/components/common/FormError"
import { FormSection } from "@/components/common/FormSection"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateClinicalRecord,
  useUpdateClinicalRecord,
} from "@/features/clinical-record/hooks/use-clinical-record"
import { clinicalRecordFormSchema } from "@/features/clinical-record/schemas/clinical-record.schema"
import type {
  ClinicalRecord,
  ClinicalRecordFormValues,
} from "@/features/clinical-record/types/clinical-record.types"
import {
  EMPTY_CLINICAL_RECORD_FORM_VALUES,
  toClinicalRecordFormValues,
  toCreateClinicalRecordInput,
  toUpdateClinicalRecordInput,
} from "@/features/clinical-record/utils/clinical-record-mappers"
import { ApiError } from "@/lib/api"
import {
  applyApiFieldErrors,
  type ApiFieldErrorMap,
  isApiErrorStatus,
} from "@/lib/forms/api-field-errors"

type ClinicalRecordFormMode = "create" | "edit"

interface ClinicalRecordFormProps {
  mode: ClinicalRecordFormMode
  onCancel: () => void
  onConflict: () => void
  onSaved: () => void
  record?: ClinicalRecord
  studentId: number
}

const clinicalRecordFieldErrors = {
  "El motivo inicial debe ser un texto válido.": "initialReason",
  "El historial psicológico debe ser un texto válido.": "psychologicalHistory",
  "El historial psiquiátrico debe ser un texto válido.": "psychiatricHistory",
  "Los antecedentes familiares deben ser un texto válido.": "relevantFamilyHistory",
  "Los tratamientos previos deben ser un texto válido.": "previousTreatments",
  "La medicación actual debe ser un texto válido.": "currentMedication",
  "Las observaciones generales deben ser un texto válido.": "generalObservations",
} as const satisfies ApiFieldErrorMap<ClinicalRecordFormValues>

export function ClinicalRecordForm({
  mode,
  onCancel,
  onConflict,
  onSaved,
  record,
  studentId,
}: ClinicalRecordFormProps) {
  const createRecord = useCreateClinicalRecord(studentId)
  const updateRecord = useUpdateClinicalRecord(studentId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<ClinicalRecordFormValues>({
    defaultValues:
      mode === "edit" && record
        ? toClinicalRecordFormValues(record)
        : EMPTY_CLINICAL_RECORD_FORM_VALUES,
    resolver: zodResolver(clinicalRecordFormSchema),
  })
  const isPending = createRecord.isPending || updateRecord.isPending

  function handleSubmit(values: ClinicalRecordFormValues) {
    setSubmitError(null)
    form.clearErrors()

    const handleError = (error: unknown) => {
      const unmappedMessages = applyApiFieldErrors(
        form.setError,
        error,
        clinicalRecordFieldErrors,
      )
      setSubmitError(
        unmappedMessages.join(" ") || getClinicalRecordErrorMessage(error),
      )

      if (mode === "create" && isApiErrorStatus(error, 409)) {
        onConflict()
      }
    }

    if (mode === "create") {
      createRecord.mutate(toCreateClinicalRecordInput(values), {
        onError: handleError,
        onSuccess: () => {
          toast.success("El expediente clínico ha sido creado correctamente.")
          onSaved()
        },
      })
      return
    }

    updateRecord.mutate(toUpdateClinicalRecordInput(values), {
      onError: (error) => {
        handleError(error)
      },
      onSuccess: () => {
        toast.success("El expediente clínico ha sido actualizado correctamente.")
        onSaved()
      },
    })
  }

  return (
    <form className="space-y-8" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm"
        description="Registre la información longitudinal que fundamenta el acompañamiento clínico."
        title="Motivo inicial de consulta"
      >
        <ClinicalRecordTextarea
          error={form.formState.errors.initialReason?.message}
          form={form}
          id="initialReason"
          label="Motivo inicial"
          name="initialReason"
          placeholder="Describa el motivo inicial de consulta."
          rows={4}
        />
      </FormSection>

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm"
        description="Documente antecedentes pertinentes para el seguimiento longitudinal."
        title="Historial y antecedentes"
      >
        <ClinicalRecordTextarea
          error={form.formState.errors.psychologicalHistory?.message}
          form={form}
          id="psychologicalHistory"
          label="Historial psicológico"
          name="psychologicalHistory"
          placeholder="Registre los antecedentes psicológicos relevantes."
          rows={4}
        />
        <ClinicalRecordTextarea
          error={form.formState.errors.psychiatricHistory?.message}
          form={form}
          id="psychiatricHistory"
          label="Historial psiquiátrico"
          name="psychiatricHistory"
          placeholder="Registre los antecedentes psiquiátricos relevantes."
          rows={4}
        />
        <ClinicalRecordTextarea
          error={form.formState.errors.relevantFamilyHistory?.message}
          form={form}
          id="relevantFamilyHistory"
          label="Antecedentes familiares relevantes"
          name="relevantFamilyHistory"
          placeholder="Registre los antecedentes familiares relevantes."
          rows={4}
        />
        <ClinicalRecordTextarea
          error={form.formState.errors.previousTreatments?.message}
          form={form}
          id="previousTreatments"
          label="Tratamientos previos"
          name="previousTreatments"
          placeholder="Registre tratamientos o intervenciones previas relevantes."
          rows={4}
        />
      </FormSection>

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm" title="Información clínica general">
        <ClinicalRecordTextarea
          error={form.formState.errors.currentMedication?.message}
          form={form}
          id="currentMedication"
          label="Medicación actual"
          name="currentMedication"
          placeholder="Registre la medicación referida por el paciente, si corresponde."
          rows={3}
        />
        <ClinicalRecordTextarea
          error={form.formState.errors.generalObservations?.message}
          form={form}
          id="generalObservations"
          label="Observaciones generales"
          name="generalObservations"
          placeholder="Registre observaciones clínicas longitudinales relevantes."
          rows={5}
        />
      </FormSection>

      {submitError ? <FormError message={submitError} /> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button aria-busy={isPending} disabled={isPending} type="submit">
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}

interface ClinicalRecordTextareaProps {
  error: string | undefined
  form: UseFormReturn<ClinicalRecordFormValues>
  id: string
  label: string
  name: Path<ClinicalRecordFormValues>
  placeholder: string
  rows: number
}

function ClinicalRecordTextarea({
  error,
  form,
  id,
  label,
  name,
  placeholder,
  rows,
}: ClinicalRecordTextareaProps) {
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea className="bg-background"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        id={id}
        placeholder={placeholder}
        rows={rows}
        {...form.register(name)}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function getClinicalRecordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return "Ha ocurrido un error al guardar el expediente clínico. Por favor, intente nuevamente."
}
