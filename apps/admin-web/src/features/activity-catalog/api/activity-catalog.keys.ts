import type { ActivityCatalogListParams } from "@/features/activity-catalog/types/activity-catalog.types";

export const activityCatalogKeys = {
  all: ["activity-catalog"] as const,
  active: () => [...activityCatalogKeys.all, "active"] as const,
  detail: (id: number) => [...activityCatalogKeys.details(), id] as const,
  details: () => [...activityCatalogKeys.all, "detail"] as const,
  list: (params: ActivityCatalogListParams) =>
    [...activityCatalogKeys.lists(), params] as const,
  lists: () => [...activityCatalogKeys.all, "list"] as const,
};
