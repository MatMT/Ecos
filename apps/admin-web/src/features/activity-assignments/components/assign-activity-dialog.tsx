"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, LoaderCircle, Search } from "lucide-react";
import { FormError } from "@/components/common/FormError";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivityCatalog } from "@/features/activity-catalog/hooks/use-activity-catalog";
import type { ActivityCatalogItem } from "@/features/activity-catalog/types/activity-catalog.types";
import { useAssignActivity } from "@/features/activity-assignments/hooks/use-assign-activity";
import { assignActivityFormSchema } from "@/features/activity-assignments/schemas/assign-activity.schema";
import {
  EMPTY_ASSIGN_ACTIVITY_FORM_VALUES,
  type AssignActivityFormValues,
} from "@/features/activity-assignments/types/activity-assignment.types";
import { getAssignActivityErrorMessage } from "@/features/activity-assignments/utils/assign-activity-errors";
import { toAssignActivityInput } from "@/features/activity-assignments/utils/assign-activity-form";
import { ApiError } from "@/lib/api";

interface AssignActivityDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  patientId: number;
  timeZone: string;
}

const ACTIVE_CATALOG_TAKE = 20;

export function AssignActivityDialog({
  onOpenChange,
  open,
  patientId,
  timeZone,
}: AssignActivityDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityCatalogItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<AssignActivityFormValues>({
    defaultValues: EMPTY_ASSIGN_ACTIVITY_FORM_VALUES,
    resolver: zodResolver(assignActivityFormSchema),
  });
  const assignActivity = useAssignActivity(patientId);
  const catalogParams = useMemo(
    () => ({
      active: true,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      skip: 0,
      take: ACTIVE_CATALOG_TAKE,
    }),
    [debouncedSearch],
  );
  const catalogQuery = useActivityCatalog(catalogParams);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && assignActivity.isPending) {
      return;
    }

    if (!nextOpen) {
      form.reset(EMPTY_ASSIGN_ACTIVITY_FORM_VALUES);
      setSearch("");
      setDebouncedSearch("");
      setSelectedActivity(null);
      setSubmitError(null);
    }

    onOpenChange(nextOpen);
  }

  function handleActivityChange(
    activityId: string,
    onChange: (value: string) => void,
  ) {
    onChange(activityId);
    setSelectedActivity(
      catalogQuery.data?.data.find(
        (activity) => String(activity.id) === activityId,
      ) ?? null,
    );
    setSubmitError(null);
  }

  function handleSubmit(values: AssignActivityFormValues) {
    setSubmitError(null);

    assignActivity.mutate(toAssignActivityInput(values, timeZone), {
      onError: (error) => {
        setSubmitError(getAssignActivityErrorMessage(error));

        if (error instanceof ApiError && error.status === 409) {
          void refreshAvailability(values.activityId);
        }
      },
      onSuccess: () => {
        toast.success("La actividad ha sido asignada correctamente.");
        handleOpenChange(false);
      },
    });
  }

  async function refreshAvailability(activityId: string) {
    const result = await catalogQuery.refetch();
    if (!result.isSuccess) {
      return;
    }

    const remainsAvailable = result.data?.data.some(
      (activity) => String(activity.id) === activityId,
    );

    if (!remainsAvailable) {
      form.setValue("activityId", "", { shouldValidate: true });
      setSelectedActivity(null);
    }
  }

  const hasAvailableActivities = Boolean(catalogQuery.data?.data.length);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Asignar actividad</DialogTitle>
          <DialogDescription>
            Seleccione una actividad activa del catálogo institucional para este
            paciente.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="activity-search">Buscar actividad</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                id="activity-search"
                placeholder="Buscar por título"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {catalogQuery.isError ? (
            <div className="space-y-3">
              <FormError message="No fue posible consultar el catálogo de actividades. Por favor, intente nuevamente." />
              <Button
                type="button"
                variant="outline"
                onClick={() => void catalogQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : catalogQuery.isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              Consultando actividades disponibles…
            </p>
          ) : hasAvailableActivities ? (
            <>
              <Controller
                control={form.control}
                name="activityId"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="activity-id">Actividad</Label>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        handleActivityChange(value, field.onChange)
                      }
                    >
                      <SelectTrigger
                        aria-describedby={
                          form.formState.errors.activityId
                            ? "activity-id-error"
                            : undefined
                        }
                        aria-invalid={Boolean(form.formState.errors.activityId)}
                        id="activity-id"
                        className="w-full"
                      >
                        <SelectValue placeholder="Seleccione una actividad" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogQuery.data.data.map((activity) => (
                          <SelectItem
                            key={activity.id}
                            value={String(activity.id)}
                          >
                            {activity.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.activityId?.message ? (
                      <p
                        className="text-sm font-medium text-destructive"
                        id="activity-id-error"
                        role="alert"
                      >
                        {form.formState.errors.activityId.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
              {selectedActivity ? (
                <ActivityPreview activity={selectedActivity} />
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-center">
              <FileText
                aria-hidden="true"
                className="mx-auto size-5 text-muted-foreground"
              />
              <p className="mt-2 font-medium text-foreground">
                No hay actividades disponibles para asignar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                El catálogo de actividades es administrado por la institución.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="activity-due-at">Fecha y hora límite</Label>
            <Input
              aria-describedby={
                form.formState.errors.dueAt
                  ? "activity-due-at-error"
                  : "activity-due-at-help"
              }
              aria-invalid={Boolean(form.formState.errors.dueAt)}
              id="activity-due-at"
              step="60"
              type="datetime-local"
              {...form.register("dueAt")}
            />
            <p
              className="text-sm text-muted-foreground"
              id="activity-due-at-help"
            >
              Opcional. La fecha y hora se registrarán conforme a la zona
              horaria institucional.
            </p>
            {form.formState.errors.dueAt?.message ? (
              <p
                className="text-sm font-medium text-destructive"
                id="activity-due-at-error"
                role="alert"
              >
                {form.formState.errors.dueAt.message}
              </p>
            ) : null}
          </div>

          {submitError ? <FormError message={submitError} /> : null}

          <DialogFooter>
            <Button
              disabled={assignActivity.isPending}
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              aria-busy={assignActivity.isPending}
              disabled={
                assignActivity.isPending ||
                catalogQuery.isPending ||
                !selectedActivity
              }
              type="submit"
            >
              {assignActivity.isPending ? "Asignando…" : "Asignar actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActivityPreview({ activity }: { activity: ActivityCatalogItem }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <h3 className="font-display font-semibold text-foreground">
        {activity.title}
      </h3>
      {activity.description ? (
        <PreviewText label="Descripción" value={activity.description} />
      ) : null}
      {activity.instructions ? (
        <PreviewText label="Instrucciones" value={activity.instructions} />
      ) : null}
      {!activity.description && !activity.instructions ? (
        <p className="text-sm text-muted-foreground">
          Esta actividad no contiene información adicional.
        </p>
      ) : null}
    </section>
  );
}

function PreviewText({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value}
      </p>
    </div>
  );
}
