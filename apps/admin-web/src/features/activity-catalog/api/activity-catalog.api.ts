import { api } from "@/lib/api";
import type {
  ActivityCatalogItem,
  ActivityCatalogListParams,
  ActivityCatalogListResponse,
  CreateActivityInput,
  UpdateActivityInput,
} from "@/features/activity-catalog/types/activity-catalog.types";

export const activityCatalogApi = {
  create: (input: CreateActivityInput) =>
    api.post<ActivityCatalogItem, CreateActivityInput>("/activities", input),
  getById: (id: number, signal?: AbortSignal) =>
    api.get<ActivityCatalogItem>(`/activities/${id}`, { signal }),
  list: (params: ActivityCatalogListParams, signal?: AbortSignal) =>
    api.get<ActivityCatalogListResponse>("/activities", {
      params: {
        active: params.active,
        search: params.search,
        skip: params.skip,
        take: params.take,
      },
      signal,
    }),
  update: (id: number, input: UpdateActivityInput) =>
    api.patch<ActivityCatalogItem, UpdateActivityInput>(
      `/activities/${id}`,
      input,
    ),
};
