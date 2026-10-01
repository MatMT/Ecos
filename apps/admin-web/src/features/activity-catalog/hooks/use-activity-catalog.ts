"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activityCatalogApi } from "@/features/activity-catalog/api/activity-catalog.api";
import { activityCatalogKeys } from "@/features/activity-catalog/api/activity-catalog.keys";
import type {
  ActivityCatalogListParams,
  ActivityCatalogItem,
  ActivityCatalogListResponse,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/features/activity-catalog/types/activity-catalog.types";

export function useActivityCatalog(params: ActivityCatalogListParams) {
  return useQuery<ActivityCatalogListResponse>({
    placeholderData: (previousData) => previousData,
    queryFn: ({ signal }) => activityCatalogApi.list(params, signal),
    queryKey: activityCatalogKeys.list(params),
  });
}

export function useActivity(id: number) {
  return useQuery<ActivityCatalogItem>({
    queryFn: ({ signal }) => activityCatalogApi.getById(id, signal),
    queryKey: activityCatalogKeys.detail(id),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateActivityInput) =>
      activityCatalogApi.create(input),
    onSuccess: () => invalidateActivityCatalog(queryClient),
  });
}

export function useUpdateActivity(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateActivityInput) =>
      activityCatalogApi.update(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: activityCatalogKeys.detail(id),
        }),
        invalidateActivityCatalog(queryClient),
      ]);
    },
  });
}

export function useToggleActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { active: boolean; id: number }) =>
      activityCatalogApi.update(id, { active }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: activityCatalogKeys.detail(variables.id),
        }),
        invalidateActivityCatalog(queryClient),
      ]);
    },
  });
}

async function invalidateActivityCatalog(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: activityCatalogKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: activityCatalogKeys.active() }),
  ]);
}
