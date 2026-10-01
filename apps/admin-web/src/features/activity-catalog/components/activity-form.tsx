"use client";

import type { SubmitHandler, UseFormReturn } from "react-hook-form";
import { FormError } from "@/components/common/FormError";
import { FormSection } from "@/components/common/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityFormValues } from "@/features/activity-catalog/types/activity-catalog.types";

interface ActivityFormProps {
  form: UseFormReturn<ActivityFormValues>;
  isPending: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: SubmitHandler<ActivityFormValues>;
  submitError: string | null;
}

export function ActivityForm({
  form,
  isPending,
  mode,
  onCancel,
  onSubmit,
  submitError,
}: ActivityFormProps) {
  const isCreate = mode === "create";

  return (
    <form
      className="space-y-8"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FormSection
        className="rounded-2xl border bg-card p-5 shadow-sm"
        description="Defina el contenido que estará disponible para los profesionales de la institución."
        title="Contenido de la actividad"
      >
        <div className="space-y-2">
          <Label htmlFor="activity-title">Título</Label>
          <Input
            aria-describedby={
              form.formState.errors.title ? "activity-title-error" : undefined
            }
            aria-invalid={Boolean(form.formState.errors.title)}
            autoComplete="off"
            id="activity-title"
            maxLength={255}
            placeholder="Ejemplo: Registro diario de emociones"
            {...form.register("title")}
          />
          {form.formState.errors.title?.message ? (
            <p
              className="text-sm font-medium text-destructive"
              id="activity-title-error"
              role="alert"
            >
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>
        <TextField
          error={form.formState.errors.description?.message}
          id="activity-description"
          label="Descripción"
          placeholder="Describa brevemente el propósito de la actividad."
          registration={form.register("description")}
        />
        <TextField
          error={form.formState.errors.instructions?.message}
          id="activity-instructions"
          label="Instrucciones"
          placeholder="Indique las instrucciones que se mostrarán al paciente en una fase posterior."
          registration={form.register("instructions")}
        />
      </FormSection>

      {submitError ? <FormError message={submitError} /> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          disabled={isPending}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button aria-busy={isPending} disabled={isPending} type="submit">
          {isPending
            ? isCreate
              ? "Creando…"
              : "Guardando…"
            : isCreate
              ? "Crear actividad"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

interface TextFieldProps {
  error: string | undefined;
  id: string;
  label: string;
  placeholder: string;
  registration: ReturnType<UseFormReturn<ActivityFormValues>["register"]>;
}

function TextField({
  error,
  id,
  label,
  placeholder,
  registration,
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        id={id}
        placeholder={placeholder}
        rows={5}
        {...registration}
      />
      {error ? (
        <p
          className="text-sm font-medium text-destructive"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
