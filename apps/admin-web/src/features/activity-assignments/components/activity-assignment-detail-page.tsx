"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { CalendarDays, UserRound } from "lucide-react";
import { useDashboardBreadcrumbLabel } from "@/components/common/DashboardBreadcrumbs";
import { ErrorState } from "@/components/common/ErrorState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/features/auth/hooks/use-permission";
import { useSession } from "@/features/auth/hooks/use-session";
import type { UserRole } from "@/features/auth/types/auth.types";
import { useActivityAssignmentDetail } from "@/features/activity-assignments/hooks/use-activity-assignment-detail";
import type { ActivityAssignmentDetail } from "@/features/activity-assignments/types/activity-assignment.types";
import {
  getActivityAssignmentOriginPresentation,
  getActivityAssignmentStatusPresentation,
} from "@/features/activity-assignments/utils/activity-assignment-formatters";
import {
  PatientWorkspace,
  type PatientWorkspaceContext,
} from "@/features/patients/components/patient-workspace";
import { patientRoutes } from "@/features/patients/routes/patient-routes";
import { formatOverviewDateTime } from "@/features/patients/utils/patient-overview-formatters";
import { ApiError } from "@/lib/api";

interface ActivityAssignmentDetailPageProps {
  assignmentId: number;
  patientId: number;
}

export function ActivityAssignmentDetailPage({
  assignmentId,
  patientId,
}: ActivityAssignmentDetailPageProps) {
  const session = useSession();
  const canViewAssignments = usePermission("patient-activities.view");

  if (session.isPending) {
    return <ActivityAssignmentDetailSkeleton />;
  }

  if (session.isError) {
    return (
      <ErrorState
        description="No fue posible validar la sesión para consultar el detalle de la actividad. Por favor, intente nuevamente."
        title="No fue posible cargar la actividad"
        onRetry={() => void session.refetch()}
      />
    );
  }

  if (!session.isAuthenticated || !session.data || !canViewAssignments) {
    return <ForbiddenState variant="embedded" />;
  }

  return (
    <ActivityAssignmentDetailData
      assignmentId={assignmentId}
      patientId={patientId}
      role={session.data.role}
    />
  );
}

function ActivityAssignmentDetailData({
  assignmentId,
  patientId,
  role,
}: ActivityAssignmentDetailPageProps & { role: UserRole }) {
  const detailQuery = useActivityAssignmentDetail(patientId, assignmentId);

  if (detailQuery.isPending) {
    return <ActivityAssignmentDetailSkeleton />;
  }

  if (detailQuery.isError) {
    if (detailQuery.error instanceof ApiError) {
      if (detailQuery.error.status === 403) {
        return <ForbiddenState variant="embedded" />;
      }

      if (detailQuery.error.status === 404) {
        notFound();
      }
    }

    return (
      <ErrorState
        description="No fue posible cargar el detalle de la actividad asignada. Por favor, intente nuevamente."
        title="No fue posible cargar la actividad"
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  if (!detailQuery.data) {
    return <ActivityAssignmentDetailSkeleton />;
  }

  const detail = detailQuery.data;
  const context: PatientWorkspaceContext = {
    email: detail.patient.email,
    fullName: detail.patient.fullName,
    patientId: detail.patient.id,
    studentCode: detail.patient.studentCode,
    therapist: detail.patient.assignedTherapist,
  };

  return (
    <PatientWorkspace context={context} role={role}>
      <ActivityAssignmentDetailContent detail={detail} />
    </PatientWorkspace>
  );
}

function ActivityAssignmentDetailContent({
  detail,
}: {
  detail: ActivityAssignmentDetail;
}) {
  const patientId = detail.patient.id;
  const timeZone = detail.patient.institutionTimezone;
  const detailPath = patientRoutes.activityAssignmentDetail(patientId, detail.id);
  const status = getActivityAssignmentStatusPresentation(detail.status);
  const origin = getActivityAssignmentOriginPresentation(detail.origin);

  useDashboardBreadcrumbLabel(detail.activity.title, detailPath);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild type="button" variant="outline">
            <Link href={patientRoutes.activities(patientId)}>
              Volver a actividades
            </Link>
          </Button>
        }
        description="Consulte el contenido vigente de la actividad y la información registrada de su asignación."
        title="Detalle de actividad"
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                <time dateTime={detail.assignedAt}>
                  Asignada el {formatOverviewDateTime(detail.assignedAt, timeZone)}
                </time>
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {detail.activity.title}
              </h2>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound aria-hidden="true" className="size-4" />
                Asignada por {detail.therapist?.fullName ?? "Profesional no registrado"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge label={status.label} tone={status.tone} />
              <StatusBadge label={origin.label} tone={origin.tone} />
            </div>
          </div>
        </CardContent>
      </Card>

      <ReadSection title="Contenido de la actividad">
        <ReadText label="Descripción" value={detail.activity.description} />
        <ReadText label="Instrucciones" value={detail.activity.instructions} />
      </ReadSection>

      <ReadSection title="Información de la asignación">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <ReadDefinition label="Estado actual" value={status.label} />
          <ReadDefinition label="Origen" value={origin.label} />
          <ReadDefinition
            label="Asignada el"
            value={formatOverviewDateTime(detail.assignedAt, timeZone)}
          />
          <ReadDefinition
            label="Fecha límite"
            value={
              detail.dueAt
                ? formatOverviewDateTime(detail.dueAt, timeZone)
                : "Sin fecha límite"
            }
          />
          <ReadDefinition
            label="Asignada por"
            value={detail.therapist?.fullName ?? "Profesional no registrado"}
          />
          {detail.completedAt ? (
            <ReadDefinition
              label="Completada el"
              value={formatOverviewDateTime(detail.completedAt, timeZone)}
            />
          ) : null}
        </dl>
      </ReadSection>

      <ReadSection title="Seguimiento">
        {detail.response ? (
          <ReadText label="Respuesta registrada" value={detail.response} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay una respuesta registrada.
          </p>
        )}
      </ReadSection>

      <Card>
        <CardContent className="space-y-1 p-5 text-xs text-muted-foreground">
          <p>Asignación registrada el {formatOverviewDateTime(detail.createdAt, timeZone)}.</p>
          <p>Última actualización: {formatOverviewDateTime(detail.updatedAt, timeZone)}.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReadSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function ReadDefinition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}

function ReadText({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium text-foreground">{label}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value ?? "Sin información registrada."}
      </p>
    </div>
  );
}

function ActivityAssignmentDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
