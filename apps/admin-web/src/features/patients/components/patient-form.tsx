"use client"

import type { SubmitHandler, UseFormReturn } from "react-hook-form"
import { FormError } from "@/components/common/FormError"
import { FormSection } from "@/components/common/FormSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { PatientFormValues } from "@/features/patients/types/patient.types"

interface PatientFormProps {
  form: UseFormReturn<PatientFormValues>
  isPending: boolean
  mode: "create" | "edit"
  onCancel: () => void
  onSubmit: SubmitHandler<PatientFormValues>
  submitError: string | null
}

export function PatientForm({
  form,
  isPending,
  mode,
  onCancel,
  onSubmit,
  submitError,
}: PatientFormProps) {
  const isCreate = mode === "create"

  return (
    <form className="space-y-8" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      {isCreate ? (
        <FormSection
          className="rounded-2xl border bg-card p-5 shadow-sm"
          description="Registre los datos necesarios para habilitar el acceso inicial del paciente."
          title="Información de acceso"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              autoComplete="name"
              error={form.formState.errors.fullName?.message}
              form={form}
              id="fullName"
              label="Nombre completo"
              name="fullName"
              placeholder="Nombre completo del paciente"
            />
            <FormField
              autoComplete="email"
              error={form.formState.errors.email?.message}
              form={form}
              id="email"
              inputMode="email"
              label="Correo electrónico"
              name="email"
              placeholder="nombre@institucion.edu"
              type="email"
            />
          </div>
          <FormField
            autoComplete="new-password"
            error={form.formState.errors.password?.message}
            form={form}
            id="password"
            label="Contraseña inicial"
            name="password"
            placeholder="Mínimo 6 caracteres"
            type="password"
          />
        </FormSection>
      ) : null}

      <FormSection
          className="rounded-2xl border bg-card p-5 shadow-sm"
        description="Este código es opcional. Si se deja vacío, no se enviará una modificación del código actual."
        title="Información institucional"
      >
        <FormField
          error={form.formState.errors.studentCode?.message}
          form={form}
          id="studentCode"
          label="Código institucional"
          name="studentCode"
          placeholder="Ejemplo: UDB-2026-001"
        />
      </FormSection>

      {submitError ? <FormError message={submitError} /> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button aria-busy={isPending} disabled={isPending} type="submit">
          {isPending
            ? isCreate
              ? "Creando…"
              : "Guardando…"
            : isCreate
              ? "Crear paciente"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}

export function PatientFormSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  )
}

interface FormFieldProps {
  autoComplete?: string
  error: string | undefined
  form: UseFormReturn<PatientFormValues>
  id: string
  inputMode?: "email" | "text"
  label: string
  name: keyof PatientFormValues
  placeholder: string
  type?: "email" | "password" | "text"
}

function FormField({
  autoComplete,
  error,
  form,
  id,
  inputMode,
  label,
  name,
  placeholder,
  type = "text",
}: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input className="bg-background"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        inputMode={inputMode}
        placeholder={placeholder}
        type={type}
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
