"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { notFound, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ErrorState } from "@/components/common/ErrorState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityForm } from "@/features/activity-catalog/components/activity-form";
import {
  useActivity,
  useUpdateActivity,
} from "@/features/activity-catalog/hooks/use-activity-catalog";
import { activityCatalogRoutes } from "@/features/activity-catalog/routes/activity-catalog-routes";
import { activityFormSchema } from "@/features/activity-catalog/schemas/activity-form.schema";
import type {
  ActivityCatalogItem,
  ActivityFormValues,
} from "@/features/activity-catalog/types/activity-catalog.types";
import { getActivityFormErrorMessage } from "@/features/activity-catalog/utils/activity-form-errors";
import {
  toActivityFormValues,
  toUpdateActivityInput,
} from "@/features/activity-catalog/utils/activity-form-mappers";
import { ApiError } from "@/lib/api";

export function EditActivityPage({ activityId }: { activityId: number }) {
  const activityQuery = useActivity(activityId);

  if (activityQuery.isPending) {
    return <PageHeader title="Editar actividad" />;
  }

  if (activityQuery.isError) {
    if (activityQuery.error instanceof ApiError) {
      if (activityQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />;
      }

      if (activityQuery.error.status === 404) {
        notFound();
      }
    }

    return (
      <ErrorState
        description={getActivityFormErrorMessage(activityQuery.error)}
        title="No fue posible cargar la actividad"
        onRetry={() => void activityQuery.refetch()}
      />
    );
  }

  if (activityQuery.data.institutionId === null) {
    return <ForbiddenState variant="embedded" />;
  }

  return <ActivityEditForm activity={activityQuery.data} />;
}

function ActivityEditForm({ activity }: { activity: ActivityCatalogItem }) {
  const router = useRouter();
  const updateActivity = useUpdateActivity(activity.id);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ActivityFormValues>({
    defaultValues: toActivityFormValues(activity),
    resolver: zodResolver(activityFormSchema),
  });

  function handleSubmit(values: ActivityFormValues) {
    setSubmitError(null);
    updateActivity.mutate(toUpdateActivityInput(values), {
      onError: (error) => setSubmitError(getActivityFormErrorMessage(error)),
      onSuccess: () => {
        toast.success("La actividad ha sido actualizada correctamente.");
        router.push(activityCatalogRoutes.list());
      },
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Actualice el contenido institucional de esta actividad. Los cambios futuros se reflejarán en las asignaciones que la referencian."
        title="Editar actividad"
      />
      <ActivityForm
        form={form}
        isPending={updateActivity.isPending}
        mode="edit"
        onCancel={() => router.push(activityCatalogRoutes.list())}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </div>
  );
}
