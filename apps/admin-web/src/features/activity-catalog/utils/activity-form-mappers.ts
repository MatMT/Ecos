import type {
  ActivityCatalogItem,
  ActivityFormValues,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/features/activity-catalog/types/activity-catalog.types";

export function toActivityFormValues(
  activity: ActivityCatalogItem,
): ActivityFormValues {
  return {
    description: activity.description ?? "",
    instructions: activity.instructions ?? "",
    title: activity.title,
  };
}

export function toCreateActivityInput(
  values: ActivityFormValues,
): CreateActivityInput {
  const description = toOptionalText(values.description);
  const instructions = toOptionalText(values.instructions);

  return {
    title: values.title.trim(),
    ...(description ? { description } : {}),
    ...(instructions ? { instructions } : {}),
  };
}

export function toUpdateActivityInput(
  values: ActivityFormValues,
): UpdateActivityInput {
  return {
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    title: values.title.trim(),
  };
}

function toOptionalText(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}
