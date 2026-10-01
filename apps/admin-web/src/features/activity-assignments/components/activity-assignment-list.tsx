import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ActivityAssignmentListItem } from "@/features/activity-assignments/types/activity-assignment.types";
import {
  getActivityAssignmentOriginPresentation,
  getActivityAssignmentStatusPresentation,
} from "@/features/activity-assignments/utils/activity-assignment-formatters";
import { formatOverviewDate } from "@/features/patients/utils/patient-overview-formatters";
import { patientRoutes } from "@/features/patients/routes/patient-routes";

interface ActivityAssignmentListProps {
  assignments: readonly ActivityAssignmentListItem[];
  patientId: number;
  timeZone: string;
}

export function ActivityAssignmentList({
  assignments,
  patientId,
  timeZone,
}: ActivityAssignmentListProps) {
  return (
    <ol className="space-y-3">
      {assignments.map((assignment) => {
        const status = getActivityAssignmentStatusPresentation(
          assignment.status,
        );
        const origin = getActivityAssignmentOriginPresentation(
          assignment.origin,
        );

        return (
          <li
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
            key={assignment.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <h2 className="font-display text-base font-semibold text-foreground">
                  {assignment.activity.title}
                </h2>
                <dl className="grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <Metadata
                    label="Asignada el"
                    value={formatOverviewDate(assignment.assignedAt, timeZone)}
                  />
                  <Metadata
                    label="Fecha límite"
                    value={
                      assignment.dueAt
                        ? formatOverviewDate(assignment.dueAt, timeZone)
                        : "Sin fecha límite"
                    }
                  />
                  <Metadata
                    label="Asignada por"
                    value={
                      assignment.therapist?.fullName ??
                      "Profesional no registrado"
                    }
                  />
                  {assignment.status === "completed" &&
                  assignment.completedAt ? (
                    <Metadata
                      label="Completada el"
                      value={formatOverviewDate(
                        assignment.completedAt,
                        timeZone,
                      )}
                    />
                  ) : null}
                </dl>
                {assignment.hasResponse ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquareText aria-hidden="true" className="size-4" />
                    Respuesta registrada
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <StatusBadge label={status.label} tone={status.tone} />
                <StatusBadge label={origin.label} tone={origin.tone} />
                <Button asChild size="sm" type="button" variant="outline">
                  <Link
                    href={patientRoutes.activityAssignmentDetail(
                      patientId,
                      assignment.id,
                    )}
                  >
                    Ver actividad
                  </Link>
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="font-medium text-foreground">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}
