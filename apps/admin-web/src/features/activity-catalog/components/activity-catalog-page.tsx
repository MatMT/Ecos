"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivityCatalogFilters } from "@/features/activity-catalog/components/activity-catalog-filters";
import {
  useActivityCatalog,
  useToggleActivity,
} from "@/features/activity-catalog/hooks/use-activity-catalog";
import { activityCatalogRoutes } from "@/features/activity-catalog/routes/activity-catalog-routes";
import {
  ACTIVITY_PAGE_SIZE_OPTIONS,
  DEFAULT_ACTIVITY_PAGE,
  DEFAULT_ACTIVITY_TAKE,
  type ActivityCatalogItem,
  type ActivityCatalogListParams,
  type ActivityCatalogStateFilter,
} from "@/features/activity-catalog/types/activity-catalog.types";
import { getActivityFormErrorMessage } from "@/features/activity-catalog/utils/activity-form-errors";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export function ActivityCatalogPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = getPositiveInteger(
    searchParams.get("page"),
    DEFAULT_ACTIVITY_PAGE,
  );
  const take = getPageSize(searchParams.get("take"));
  const active = getActivityStateFilter(searchParams.get("active"));
  const search = searchParams.get("search")?.trim() ?? "";
  const [activityToDeactivate, setActivityToDeactivate] =
    useState<ActivityCatalogItem | null>(null);
  const toggleActivity = useToggleActivity();
  const listParams = useMemo<ActivityCatalogListParams>(
    () => ({
      ...(active === "all" ? {} : { active: active === "active" }),
      ...(search ? { search } : {}),
      skip: (page - 1) * take,
      take,
    }),
    [active, page, search, take],
  );
  const activityCatalogQuery = useActivityCatalog(listParams);
  const hasInvalidUrlState =
    (searchParams.has("active") && searchParams.get("active") !== active) ||
    (searchParams.has("page") && Number(searchParams.get("page")) !== page) ||
    (searchParams.has("take") && Number(searchParams.get("take")) !== take);

  const updateCatalogUrl = useCallback(
    (
      nextPage: number,
      nextTake: number,
      nextSearch: string,
      nextActive: ActivityCatalogStateFilter,
      replace = false,
    ) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("page", String(nextPage));
      nextParams.set("take", String(nextTake));
      setOptionalSearchParam(nextParams, "search", nextSearch);
      setOptionalSearchParam(
        nextParams,
        "active",
        nextActive === "all" ? "" : nextActive,
      );
      const href = `${pathname}?${nextParams.toString()}`;

      if (replace) {
        router.replace(href);
        return;
      }

      router.push(href);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!hasInvalidUrlState) {
      return;
    }

    updateCatalogUrl(DEFAULT_ACTIVITY_PAGE, take, search, active, true);
  }, [active, hasInvalidUrlState, search, take, updateCatalogUrl]);

  const response = activityCatalogQuery.data;
  const totalPages = Math.max(1, response?.meta.totalPages ?? 1);
  const isPageOutOfRange = Boolean(
    response && response.meta.total > 0 && page > totalPages,
  );

  useEffect(() => {
    if (isPageOutOfRange) {
      updateCatalogUrl(totalPages, take, search, active, true);
    }
  }, [active, isPageOutOfRange, search, take, totalPages, updateCatalogUrl]);

  if (activityCatalogQuery.isError) {
    if (
      activityCatalogQuery.error instanceof ApiError &&
      activityCatalogQuery.error.status === 403
    ) {
      return <ForbiddenState variant="embedded" />;
    }

    return (
      <ErrorState
        description="No fue posible consultar el catálogo institucional. Por favor, intente nuevamente."
        title="No fue posible cargar las actividades"
        onRetry={() => void activityCatalogQuery.refetch()}
      />
    );
  }

  const hasFilters = Boolean(search || active !== "all");
  const isLoading = activityCatalogQuery.isPending || isPageOutOfRange;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href={activityCatalogRoutes.create()}>
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Nueva actividad
            </Link>
          </Button>
        }
        description="Administre las actividades propias de la institución. Las actividades globales se muestran únicamente como referencia."
        title="Actividades terapéuticas"
      />
      <ActivityCatalogFilters
        key={search}
        active={active}
        search={search}
        onActiveChange={(nextActive) =>
          updateCatalogUrl(DEFAULT_ACTIVITY_PAGE, take, search, nextActive)
        }
        onClear={() => updateCatalogUrl(DEFAULT_ACTIVITY_PAGE, take, "", "all")}
        onSearchChange={(nextSearch) =>
          updateCatalogUrl(
            DEFAULT_ACTIVITY_PAGE,
            take,
            nextSearch,
            active,
            true,
          )
        }
      />
      <DataTable
        columns={activityColumns}
        data={response?.data ?? []}
        emptyState={
          <ActivityCatalogEmptyState
            hasFilters={hasFilters}
            onClear={() =>
              updateCatalogUrl(DEFAULT_ACTIVITY_PAGE, take, "", "all")
            }
          />
        }
        getRowId={(activity) => activity.id}
        isLoading={isLoading}
        pagination={
          response
            ? {
                onPageChange: (nextPage) =>
                  updateCatalogUrl(nextPage, take, search, active),
                onPageSizeChange: (nextTake) =>
                  updateCatalogUrl(
                    DEFAULT_ACTIVITY_PAGE,
                    nextTake,
                    search,
                    active,
                  ),
                page,
                pageSize: take,
                pageSizeOptions: ACTIVITY_PAGE_SIZE_OPTIONS,
                total: response.meta.total,
              }
            : undefined
        }
        rowActions={(activity) =>
          activity.institutionId === null ? (
            <span className="text-sm font-medium text-muted-foreground">
              Global
            </span>
          ) : (
            <div className="flex justify-end gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={activityCatalogRoutes.edit(activity.id)}>
                  Editar
                </Link>
              </Button>
              <Button
                disabled={toggleActivity.isPending}
                size="sm"
                type="button"
                variant={activity.active ? "outline" : "default"}
                onClick={() => {
                  if (activity.active) {
                    setActivityToDeactivate(activity);
                    return;
                  }

                  toggleActivity.mutate(
                    { active: true, id: activity.id },
                    {
                      onError: (error) =>
                        toast.error(getActivityFormErrorMessage(error)),
                      onSuccess: () =>
                        toast.success(
                          "La actividad ha sido activada correctamente.",
                        ),
                    },
                  );
                }}
              >
                {activity.active ? "Desactivar" : "Activar"}
              </Button>
            </div>
          )
        }
      />
      <ConfirmDialog
        confirmLabel="Desactivar actividad"
        description={
          activityToDeactivate
            ? `La actividad “${activityToDeactivate.title}” dejará de estar disponible para nuevas asignaciones. Las asignaciones existentes no se eliminarán.`
            : undefined
        }
        isPending={toggleActivity.isPending}
        open={activityToDeactivate !== null}
        title="¿Desea desactivar esta actividad?"
        variant="destructive"
        onConfirm={() => {
          if (!activityToDeactivate) {
            return;
          }

          toggleActivity.mutate(
            { active: false, id: activityToDeactivate.id },
            {
              onError: (error) =>
                toast.error(getActivityFormErrorMessage(error)),
              onSuccess: () => {
                setActivityToDeactivate(null);
                toast.success(
                  "La actividad ha sido desactivada correctamente.",
                );
              },
            },
          );
        }}
        onOpenChange={(open) => {
          if (!open) {
            setActivityToDeactivate(null);
          }
        }}
      />
    </div>
  );
}

const activityColumns: readonly DataTableColumn<ActivityCatalogItem>[] = [
  {
    cell: (activity) => (
      <div className="space-y-1">
        <p className="font-medium">{activity.title}</p>
        {activity.institutionId === null ? (
          <p className="text-xs font-medium text-muted-foreground">
            Actividad global
          </p>
        ) : null}
      </div>
    ),
    header: "Título",
    id: "title",
  },
  {
    cell: (activity) => (
      <p className="max-w-md truncate text-muted-foreground">
        {activity.description || "Sin descripción"}
      </p>
    ),
    header: "Descripción",
    id: "description",
  },
  {
    cell: (activity) => (
      <StatusBadge
        label={activity.active ? "Activa" : "Inactiva"}
        tone={activity.active ? "success" : "neutral"}
      />
    ),
    header: "Estado",
    id: "active",
  },
  {
    cell: (activity) => (
      <time dateTime={activity.updatedAt}>
        {formatActivityDate(activity.updatedAt)}
      </time>
    ),
    header: "Última actualización",
    id: "updatedAt",
  },
];

function ActivityCatalogEmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <Card className="border-0 shadow-none">
      <EmptyState
        action={
          hasFilters ? (
            <Button type="button" variant="outline" onClick={onClear}>
              Limpiar filtros
            </Button>
          ) : undefined
        }
        description={
          hasFilters
            ? "No se encontraron actividades con los filtros seleccionados."
            : "Aún no hay actividades institucionales registradas."
        }
        icon={FileText}
        title={hasFilters ? "Sin resultados" : "Catálogo vacío"}
      />
    </Card>
  );
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(date);
}

function getActivityStateFilter(
  value: string | null,
): ActivityCatalogStateFilter {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "all";
}

function getPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPageSize(value: string | null): number {
  const parsed = getPositiveInteger(value, DEFAULT_ACTIVITY_TAKE);
  return ACTIVITY_PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof ACTIVITY_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_ACTIVITY_TAKE;
}

function setOptionalSearchParam(
  params: URLSearchParams,
  name: string,
  value: string,
) {
  if (value) {
    params.set(name, value);
    return;
  }

  params.delete(name);
}
