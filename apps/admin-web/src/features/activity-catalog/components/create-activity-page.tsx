"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityForm } from "@/features/activity-catalog/components/activity-form";
import { useCreateActivity } from "@/features/activity-catalog/hooks/use-activity-catalog";
import { activityCatalogRoutes } from "@/features/activity-catalog/routes/activity-catalog-routes";
import { activityFormSchema } from "@/features/activity-catalog/schemas/activity-form.schema";
import {
  EMPTY_ACTIVITY_FORM_VALUES,
  type ActivityFormValues,
} from "@/features/activity-catalog/types/activity-catalog.types";
import { getActivityFormErrorMessage } from "@/features/activity-catalog/utils/activity-form-errors";
import { toCreateActivityInput } from "@/features/activity-catalog/utils/activity-form-mappers";

export function CreateActivityPage() {
  const router = useRouter();
  const createActivity = useCreateActivity();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ActivityFormValues>({
    defaultValues: EMPTY_ACTIVITY_FORM_VALUES,
    resolver: zodResolver(activityFormSchema),
  });

  function handleSubmit(values: ActivityFormValues) {
    setSubmitError(null);
    createActivity.mutate(toCreateActivityInput(values), {
      onError: (error) => setSubmitError(getActivityFormErrorMessage(error)),
      onSuccess: () => {
        toast.success("La actividad ha sido creada correctamente.");
        router.push(activityCatalogRoutes.list());
      },
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Registre una actividad propia de la institución para su uso terapéutico posterior."
        title="Nueva actividad"
      />
      <ActivityForm
        form={form}
        isPending={createActivity.isPending}
        mode="create"
        onCancel={() => router.push(activityCatalogRoutes.list())}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </div>
  );
}
