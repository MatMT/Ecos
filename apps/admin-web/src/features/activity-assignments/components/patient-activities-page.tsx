"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  notFound,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControls } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityAssignmentFilters } from "@/features/activity-assignments/components/activity-assignment-filters";
import { ActivityAssignmentList } from "@/features/activity-assignments/components/activity-assignment-list";
import { AssignActivityDialog } from "@/features/activity-assignments/components/assign-activity-dialog";
import { usePatientActivityAssignments } from "@/features/activity-assignments/hooks/use-patient-activity-assignments";
import {
  ACTIVITY_ASSIGNMENTS_PAGE_SIZE_OPTIONS,
  DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE,
  DEFAULT_ACTIVITY_ASSIGNMENTS_TAKE,
  type ActivityAssignmentStatusFilter,
  type PatientActivityAssignmentsParams,
} from "@/features/activity-assignments/types/activity-assignment.types";
import { usePermission } from "@/features/auth/hooks/use-permission";
import { useSession } from "@/features/auth/hooks/use-session";
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace";
import { usePatient } from "@/features/patients/hooks/use-patient";
import { ApiError } from "@/lib/api";

export function PatientActivitiesPage({ patientId }: { patientId: number }) {
  const session = useSession();
  const canViewAssignments = usePermission("patient-activities.view");
  const patientQuery = usePatient(patientId);

  if (session.isPending || patientQuery.isPending) {
    return <PatientActivitiesPageSkeleton />;
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar las actividades asignadas. Por favor, intente nuevamente."
        title="No fue posible cargar las actividades"
        onRetry={() => void session.refetch()}
      />
    );
  }

  const currentSession = session.data;

  if (!session.isAuthenticated || !currentSession || !canViewAssignments) {
    return <ForbiddenState variant="embedded" />;
  }

  if (patientQuery.isError) {
    if (patientQuery.error instanceof ApiError) {
      if (patientQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />;
      }

      if (patientQuery.error.status === 404) {
        notFound();
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el contexto del paciente. Por favor, intente nuevamente."
        title="No fue posible cargar las actividades"
        onRetry={() => void patientQuery.refetch()}
      />
    );
  }

  const patient = patientQuery.data;
  const context: PatientWorkspaceContext = {
    email: patient.user.email,
    fullName: patient.user.fullName,
    patientId: patient.id,
    studentCode: patient.studentCode,
    therapist: patient.assignedDoctor ?? null,
  };

  return (
    <PatientWorkspace context={context} role={currentSession.role}>
      <PatientActivitiesContent patientId={patientId} />
    </PatientWorkspace>
  );
}

function PatientActivitiesContent({ patientId }: { patientId: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canAssignActivities = usePermission("patient-activities.manage");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const page = getPositiveInteger(
    searchParams.get("page"),
    DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE,
  );
  const take = getPageSize(searchParams.get("take"));
  const status = getStatusFilter(searchParams.get("status"));
  const listParams = useMemo<PatientActivityAssignmentsParams>(
    () => ({
      skip: (page - 1) * take,
      ...(status === "all" ? {} : { status }),
      take,
    }),
    [page, status, take],
  );
  const assignmentsQuery = usePatientActivityAssignments(patientId, listParams);
  const hasInvalidUrlState =
    (searchParams.has("page") && Number(searchParams.get("page")) !== page) ||
    (searchParams.has("take") && Number(searchParams.get("take")) !== take) ||
    (searchParams.has("status") && searchParams.get("status") !== status);

  const updateUrl = useCallback(
    (
      nextPage: number,
      nextTake: number,
      nextStatus: ActivityAssignmentStatusFilter,
      replace = false,
    ) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("page", String(nextPage));
      nextParams.set("take", String(nextTake));

      if (nextStatus === "all") {
        nextParams.delete("status");
      } else {
        nextParams.set("status", nextStatus);
      }

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
    if (hasInvalidUrlState) {
      updateUrl(DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE, take, status, true);
    }
  }, [hasInvalidUrlState, status, take, updateUrl]);

  const response = assignmentsQuery.data;
  const totalPages = Math.max(1, response?.meta.totalPages ?? 1);
  const isPageOutOfRange = Boolean(
    response && response.meta.total > 0 && page > totalPages,
  );

  useEffect(() => {
    if (isPageOutOfRange) {
      updateUrl(totalPages, take, status, true);
    }
  }, [isPageOutOfRange, status, take, totalPages, updateUrl]);

  if (assignmentsQuery.isPending) {
    return <PatientActivitiesContentSkeleton />;
  }

  if (assignmentsQuery.isError) {
    if (assignmentsQuery.error instanceof ApiError) {
      if (assignmentsQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />;
      }

      if (assignmentsQuery.error.status === 404) {
        notFound();
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el historial de actividades asignadas. Por favor, intente nuevamente."
        title="No fue posible cargar las actividades"
        onRetry={() => void assignmentsQuery.refetch()}
      />
    );
  }

  if (!response || isPageOutOfRange) {
    return <PatientActivitiesContentSkeleton />;
  }

  const hasStatusFilter = status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        description="Consulte las actividades terapéuticas asignadas al paciente y su estado actual."
        title="Actividades"
        actions={
          canAssignActivities ? (
            <Button type="button" onClick={() => setIsAssignDialogOpen(true)}>
              <Plus aria-hidden="true" className="size-4" />
              Asignar actividad
            </Button>
          ) : undefined
        }
      />
      <ActivityAssignmentFilters
        status={status}
        onStatusChange={(nextStatus) =>
          updateUrl(DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE, take, nextStatus)
        }
      />
      {response.data.length === 0 ? (
        <Card>
          <EmptyState
            action={
              hasStatusFilter ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateUrl(DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE, take, "all")
                  }
                >
                  Limpiar filtros
                </Button>
              ) : canAssignActivities ? (
                <Button
                  type="button"
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Asignar primera actividad
                </Button>
              ) : undefined
            }
            description={
              hasStatusFilter
                ? "No se encontraron actividades con el estado seleccionado."
                : "Aún no hay actividades asignadas a este paciente."
            }
            icon={ClipboardList}
            title={
              hasStatusFilter ? "Sin resultados" : "Sin actividades asignadas"
            }
          />
        </Card>
      ) : (
        <>
          <ActivityAssignmentList
            assignments={response.data}
            patientId={patientId}
            timeZone={response.meta.institutionTimezone}
          />
          <PaginationControls
            pagination={{
              onPageChange: (nextPage) => updateUrl(nextPage, take, status),
              onPageSizeChange: (nextTake) =>
                updateUrl(DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE, nextTake, status),
              page,
              pageSize: take,
              pageSizeOptions: ACTIVITY_ASSIGNMENTS_PAGE_SIZE_OPTIONS,
              total: response.meta.total,
            }}
          />
        </>
      )}
      {isAssignDialogOpen ? (
        <AssignActivityDialog
          open={isAssignDialogOpen}
          patientId={patientId}
          timeZone={response.meta.institutionTimezone}
          onOpenChange={setIsAssignDialogOpen}
        />
      ) : null}
    </div>
  );
}

function getPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPageSize(value: string | null): number {
  const parsed = getPositiveInteger(value, DEFAULT_ACTIVITY_ASSIGNMENTS_TAKE);
  return ACTIVITY_ASSIGNMENTS_PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof ACTIVITY_ASSIGNMENTS_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_ACTIVITY_ASSIGNMENTS_TAKE;
}

function getStatusFilter(value: string | null): ActivityAssignmentStatusFilter {
  if (value === "pending" || value === "in_progress" || value === "completed") {
    return value;
  }

  return "all";
}

function PatientActivitiesPageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full" />
      <PatientActivitiesContentSkeleton />
    </div>
  );
}

function PatientActivitiesContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-8 w-32" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-40 w-full" key={index} />
      ))}
    </div>
  );
}
