"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Smile, Meh, Frown, Sparkles, HelpCircle } from "lucide-react"
import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import { Controller, useForm, type Path, type UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { FormError } from "@/components/common/FormError"
import { FormSection } from "@/components/common/FormSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AppointmentResponse } from "@/features/appointments/dto/appointments.dto"
import { useCreateSession } from "@/features/sessions/hooks/use-create-session"
import { useUpdateSession } from "@/features/sessions/hooks/use-session-detail"
import {
  createSessionFormSchema,
  editSessionFormSchema,
  type SessionFormValues,
} from "@/features/sessions/schemas/session-form.schema"
import type { SessionDetail } from "@/features/sessions/types/session.types"
import {
  EMPTY_SESSION_FORM_VALUES,
  getAppointmentSessionDate,
  getDefaultSessionDate,
  toCreateAppointmentSessionInput,
  toCreateManualSessionInput,
  toSessionFormValues,
  toUpdateSessionInput,
} from "@/features/sessions/utils/session-form-mappers"
import {
  formatSessionDateTime,
  formatSessionModality,
  formatSessionType,
} from "@/features/sessions/utils/session-formatters"
import { ApiError } from "@/lib/api"
import {
  applyApiFieldErrors,
  type ApiFieldErrorMap,
} from "@/lib/forms/api-field-errors"

interface SessionFormSharedProps {
  onCancel: () => void
  patientName: string
  patientId: number
  timeZone: string
}

interface CreateSessionFormProps extends SessionFormSharedProps {
  appointmentContext?: AppointmentSessionContext
  mode: "create"
  onSaved: (sessionId: number) => void
}

interface EditSessionFormProps extends SessionFormSharedProps {
  mode: "edit"
  onSaved: () => void
  session: SessionDetail
}

type SessionFormProps = CreateSessionFormProps | EditSessionFormProps

type AppointmentSessionContext = Pick<
  AppointmentResponse,
  | "appointmentDate"
  | "durationMinutes"
  | "id"
  | "modality"
  | "sessionType"
>

const fieldErrors = {
  "La duración de la sesión debe ser un número entero.": "durationMinutes",
  "La duración de la sesión debe ser mayor que cero.": "durationMinutes",
  "La fecha clínica debe tener un formato válido.": "sessionDate",
  "La fecha clínica de la sesión no puede ser futura.": "sessionDate",
  "La modalidad de la sesión no es válida.": "modality",
  "El diagnóstico registrado debe ser un texto válido.": "sessionDiagnosis",
  "El diagnóstico registrado no puede exceder 255 caracteres.": "sessionDiagnosis",
  "El estado emocional observado no es válido.": "observedEmotionalState",
  "Las observaciones clínicas deben ser un texto válido.": "observations",
  "Las notas de la sesión deben ser un texto válido.": "sessionSummary",
  "La impresión clínica debe ser un texto válido.": "clinicalImpression",
  "Las intervenciones deben ser un texto válido.": "interventions",
  "Los acuerdos deben ser un texto válido.": "agreements",
  "El plan de seguimiento debe ser un texto válido.": "followUpPlan",
  "El tipo de sesión debe ser un texto válido.": "sessionType",
  "El tipo de sesión no puede exceder 255 caracteres.": "sessionType",
} as const satisfies ApiFieldErrorMap<SessionFormValues>

const emotionalStates = [
  { label: "Tranquilo", value: "calm", icon: Smile, color: "#10b981" },
  { label: "Ansioso", value: "anxious", icon: Meh, color: "#f59e0b" },
  { label: "Triste", value: "sad", icon: Frown, color: "#1a7dbf" },
  { label: "Eufórico", value: "euphoric", icon: Sparkles, color: "#8b5cf6" },
  { label: "Otro", value: "other", icon: HelpCircle, color: "#64748b" },
] as const

export function SessionForm({
  ...props
}: SessionFormProps) {
  const { mode, patientId, timeZone } = props
  const appointmentContext = mode === "create" ? props.appointmentContext : undefined
  const createSession = useCreateSession(patientId)
  const updateSession = useUpdateSession(
    patientId,
    mode === "edit" ? props.session.id : 0,
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<SessionFormValues>({
    defaultValues: mode === "edit"
      ? toSessionFormValues(props.session, timeZone)
      : {
          ...EMPTY_SESSION_FORM_VALUES,
          durationMinutes: appointmentContext?.durationMinutes
            ? String(appointmentContext.durationMinutes)
            : "",
          modality: getAppointmentModality(appointmentContext?.modality),
          sessionDate: appointmentContext?.appointmentDate
            ? getAppointmentSessionDate(appointmentContext.appointmentDate, timeZone)
            : getDefaultSessionDate(timeZone),
          sessionType: appointmentContext?.sessionType ?? "",
        },
    resolver: zodResolver(
      mode === "edit" ? editSessionFormSchema : createSessionFormSchema,
    ),
  })
  const isPending = mode === "edit" ? updateSession.isPending : createSession.isPending

  useEffect(() => {
    if (!form.formState.isDirty) {
      return undefined
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [form.formState.isDirty])

  function handleCancel() {
    if (
      form.formState.isDirty &&
      !window.confirm(
        mode === "edit"
          ? "Hay cambios sin guardar. ¿Desea descartar la edición de la sesión?"
          : "Hay cambios sin guardar. ¿Desea abandonar el registro de la sesión?",
      )
    ) {
      return
    }

    props.onCancel()
  }

  function handleSubmit(values: SessionFormValues) {
    setSubmitError(null)
    form.clearErrors()

    if (mode === "edit") {
      updateSession.mutate(toUpdateSessionInput(values), {
        onError: (error) => {
          const unmappedMessages = applyApiFieldErrors(
            form.setError,
            error,
            fieldErrors,
          )
          setSubmitError(
            unmappedMessages.join(" ") || getSessionFormErrorMessage(error, "actualizar"),
          )
        },
        onSuccess: () => {
          toast.success("La sesión ha sido actualizada correctamente.")
          props.onSaved()
        },
      })
      return
    }

    const input = appointmentContext
      ? {
          data: toCreateAppointmentSessionInput(values, appointmentContext.id),
          kind: "appointment" as const,
        }
      : {
          data: toCreateManualSessionInput(values, timeZone),
          kind: "manual" as const,
        }

    createSession.mutate(input, {
      onError: (error) => {
        const unmappedMessages = applyApiFieldErrors(
          form.setError,
          error,
          fieldErrors,
        )
        setSubmitError(
          unmappedMessages.join(" ") || getSessionFormErrorMessage(error, "registrar"),
        )
      },
      onSuccess: (session) => {
        toast.success("La sesión ha sido registrada correctamente.")
        props.onSaved(session.id)
      },
    })
  }

  return (
    <form className="space-y-8" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
      {mode === "edit" ? (
        <EditSessionContext session={props.session} timeZone={timeZone} />
      ) : appointmentContext ? (
        <AppointmentContext
          appointment={appointmentContext}
          patientName={props.patientName}
          timeZone={timeZone}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Registrando sesión para <span className="font-medium text-foreground">{props.patientName}</span>.
        </p>
      )}

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm"
        description="Documente el contexto clínico de la atención realizada."
        title="Información de la sesión"
      >
        {mode === "edit" ? (
          <SessionMetadata session={props.session} timeZone={timeZone} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <SessionInput
              error={form.formState.errors.sessionDate?.message}
              form={form}
              id="sessionDate"
              label="Fecha y hora clínica"
              name="sessionDate"
              required
              type="datetime-local"
              disabled={Boolean(appointmentContext)}
            />
            <SessionInput
              error={form.formState.errors.durationMinutes?.message}
              form={form}
              id="durationMinutes"
              label="Duración (minutos)"
              min={1}
              name="durationMinutes"
              type="number"
              disabled={Boolean(appointmentContext)}
            />
            <SessionInput
              error={form.formState.errors.sessionType?.message}
              form={form}
              id="sessionType"
              label="Tipo de sesión"
              name="sessionType"
              placeholder="Ej. Seguimiento"
              disabled={Boolean(appointmentContext)}
            />
            <SessionSelect
              error={form.formState.errors.modality?.message}
              form={form}
              id="modality"
              label="Modalidad"
              name="modality"
              options={[
                { label: "Presencial", value: "in_person" },
                { label: "Virtual", value: "virtual" },
              ]}
              placeholder="Seleccionar modalidad"
              disabled={Boolean(appointmentContext)}
            />
          </div>
        )}
        <SessionInput
          error={form.formState.errors.sessionDiagnosis?.message}
          form={form}
          id="sessionDiagnosis"
          label="Diagnóstico registrado"
          name="sessionDiagnosis"
          placeholder="Registre el diagnóstico observado, si corresponde."
        />
      </FormSection>

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm" title="Estado emocional observado">
        <Controller
          control={form.control}
          name="observedEmotionalState"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" role="group">
              {emotionalStates.map((state) => {
                const isSelected = field.value === state.value
                return (
                  <button
                    aria-pressed={isSelected}
                    key={state.value}
                    onClick={() => field.onChange(isSelected ? "" : state.value)}
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: isSelected ? state.color : 'var(--border)',
                      background: isSelected ? `${state.color}15` : 'var(--background)',
                    }}
                  >
                    <state.icon size={22} style={{ color: isSelected ? state.color : 'var(--muted-foreground)' }} />
                    <span className="text-xs font-medium" style={{ color: isSelected ? state.color : 'var(--muted-foreground)' }}>
                      {state.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />
      </FormSection>

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm" title="Notas y observaciones">
        <SessionTextarea
          error={form.formState.errors.sessionSummary?.message}
          form={form}
          id="sessionSummary"
          label="Notas de la sesión"
          name="sessionSummary"
          placeholder="Describa el desarrollo de la sesión, los temas abordados y la respuesta del paciente."
          rows={5}
        />
        <SessionTextarea
          error={form.formState.errors.observations?.message}
          form={form}
          id="observations"
          label="Observaciones clínicas"
          name="observations"
          placeholder="Registre observaciones y patrones clínicos relevantes."
          rows={4}
        />
      </FormSection>

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm" title="Impresión e intervención clínica">
        <SessionTextarea
          error={form.formState.errors.clinicalImpression?.message}
          form={form}
          id="clinicalImpression"
          label="Impresión clínica"
          name="clinicalImpression"
          placeholder="Registre la impresión profesional derivada de la sesión."
          rows={4}
        />
        <SessionTextarea
          error={form.formState.errors.interventions?.message}
          form={form}
          id="interventions"
          label="Intervenciones realizadas"
          name="interventions"
          placeholder="Describa las intervenciones terapéuticas realizadas."
          rows={4}
        />
      </FormSection>

      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm" title="Acuerdos y seguimiento">
        <SessionTextarea
          error={form.formState.errors.agreements?.message}
          form={form}
          id="agreements"
          label="Acuerdos establecidos"
          name="agreements"
          placeholder="Registre los acuerdos alcanzados durante la sesión."
          rows={3}
        />
        <SessionTextarea
          error={form.formState.errors.followUpPlan?.message}
          form={form}
          id="followUpPlan"
          label="Plan de seguimiento"
          name="followUpPlan"
          placeholder="Registre los próximos pasos clínicos acordados."
          rows={4}
        />
      </FormSection>

      {submitError ? <FormError message={submitError} /> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button disabled={isPending} onClick={handleCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button aria-busy={isPending} disabled={isPending} type="submit">
          {isPending ? "Guardando…" : mode === "edit" ? "Guardar cambios" : "Guardar sesión"}
        </Button>
      </div>
    </form>
  )
}

interface SessionInputProps {
  disabled?: boolean
  error: string | undefined
  form: UseFormReturn<SessionFormValues>
  id: string
  label: string
  min?: number
  name: Path<SessionFormValues>
  placeholder?: string
  required?: boolean
  type?: ComponentProps<typeof Input>["type"]
}

function SessionInput({
  disabled = false,
  error,
  form,
  id,
  label,
  min,
  name,
  placeholder,
  required = false,
  type = "text",
}: SessionInputProps) {
  return (
    <SessionField error={error} id={id} label={label} required={required}>
      <Input className="bg-background"
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        disabled={disabled}
        id={id}
        min={min}
        placeholder={placeholder}
        type={type}
        {...form.register(name)}
      />
    </SessionField>
  )
}

interface SessionSelectProps {
  disabled?: boolean
  error: string | undefined
  form: UseFormReturn<SessionFormValues>
  id: string
  label: string
  name: "modality"
  options: readonly { label: string; value: "in_person" | "virtual" }[]
  placeholder: string
}

function SessionSelect({
  disabled = false,
  error,
  form,
  id,
  label,
  name,
  options,
  placeholder,
}: SessionSelectProps) {
  return (
    <SessionField error={error} id={id} label={label}>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select disabled={disabled} onValueChange={field.onChange} value={field.value}>
            <SelectTrigger
              aria-describedby={error ? `${id}-error` : undefined}
              aria-invalid={Boolean(error)}
              id={id}
              className="w-full bg-background"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </SessionField>
  )
}

function AppointmentContext({
  appointment,
  patientName,
  timeZone,
}: {
  appointment: AppointmentSessionContext
  patientName: string
  timeZone: string
}) {
  return (
    <section aria-label="Cita asociada" className="rounded-xl border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">Cita asociada</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <ContextDetail label="Paciente" value={patientName} />
        <ContextDetail
          label="Fecha y hora"
          value={formatSessionDateTime(appointment.appointmentDate, timeZone)}
        />
        <ContextDetail label="Tipo" value={formatSessionType(appointment.sessionType)} />
        <ContextDetail
          label="Modalidad"
          value={
            appointment.modality
              ? formatSessionModality(appointment.modality)
              : "Sin modalidad registrada"
          }
        />
      </dl>
    </section>
  )
}

function EditSessionContext({
  session,
  timeZone,
}: {
  session: SessionDetail
  timeZone: string
}) {
  return (
    <section aria-label="Contexto de la sesión" className="rounded-xl border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">Editando sesión clínica</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <ContextDetail
          label="Fecha y hora clínica"
          value={formatSessionDateTime(session.sessionDate, timeZone)}
        />
        <ContextDetail label="Terapeuta registrado" value={session.therapist.fullName ?? "Terapeuta no registrado"} />
        {session.appointment ? (
          <ContextDetail label="Cita asociada" value={`Cita #${session.appointment.id}`} />
        ) : null}
      </dl>
    </section>
  )
}

function SessionMetadata({
  session,
  timeZone,
}: {
  session: SessionDetail
  timeZone: string
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <ContextDetail
        label="Fecha y hora clínica"
        value={formatSessionDateTime(session.sessionDate, timeZone)}
      />
      <ContextDetail
        label="Duración"
        value={
          session.durationMinutes === null
            ? "Sin información registrada."
            : `${session.durationMinutes} minutos`
        }
      />
      <ContextDetail label="Tipo" value={formatSessionType(session.sessionType)} />
      <ContextDetail
        label="Modalidad"
        value={
          session.modality
            ? formatSessionModality(session.modality)
            : "Sin información registrada."
        }
      />
    </dl>
  )
}

function ContextDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  )
}

function getAppointmentModality(
  modality: string | null | undefined,
): SessionFormValues["modality"] {
  return modality === "in_person" || modality === "virtual" ? modality : ""
}

interface SessionTextareaProps {
  error: string | undefined
  form: UseFormReturn<SessionFormValues>
  id: string
  label: string
  name: Path<SessionFormValues>
  placeholder: string
  rows: number
}

function SessionTextarea({
  error,
  form,
  id,
  label,
  name,
  placeholder,
  rows,
}: SessionTextareaProps) {
  return (
    <SessionField error={error} id={id} label={label}>
      <Textarea className="bg-background"
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        id={id}
        placeholder={placeholder}
        rows={rows}
        {...form.register(name)}
      />
    </SessionField>
  )
}

function SessionField({
  children,
  error,
  id,
  label,
  required = false,
}: {
  children: ReactNode
  error: string | undefined
  id: string
  label: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-destructive" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function getSessionFormErrorMessage(
  error: unknown,
  action: "actualizar" | "registrar",
): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return `Ha ocurrido un error al ${action} la sesión. Por favor, intente nuevamente.`
}
