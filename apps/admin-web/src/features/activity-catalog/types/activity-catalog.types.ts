export type ActivityCatalogStateFilter = "active" | "all" | "inactive";

export interface ActivityCatalogItem {
  active: boolean;
  createdAt: string;
  description: string | null;
  id: number;
  institutionId: number | null;
  instructions: string | null;
  title: string;
  updatedAt: string;
}

export interface ActivityCatalogListParams {
  active?: boolean;
  search?: string;
  skip: number;
  take: number;
}

export interface ActivityCatalogListResponse {
  data: readonly ActivityCatalogItem[];
  meta: {
    skip: number;
    take: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityFormValues {
  description: string;
  instructions: string;
  title: string;
}

export interface CreateActivityInput {
  description?: string;
  instructions?: string;
  title: string;
}

export interface UpdateActivityInput {
  active?: boolean;
  description?: string;
  instructions?: string;
  title?: string;
}

export const EMPTY_ACTIVITY_FORM_VALUES: ActivityFormValues = {
  description: "",
  instructions: "",
  title: "",
};

export const ACTIVITY_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_ACTIVITY_PAGE = 1;
export const DEFAULT_ACTIVITY_TAKE = 20;
