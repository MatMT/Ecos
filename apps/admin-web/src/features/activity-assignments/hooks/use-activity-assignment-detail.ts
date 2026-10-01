"use client";

import { useQuery } from "@tanstack/react-query";
import { activityAssignmentsApi } from "@/features/activity-assignments/api/activity-assignments.api";
import { activityAssignmentKeys } from "@/features/activity-assignments/api/activity-assignment.keys";
import type { ActivityAssignmentDetail } from "@/features/activity-assignments/types/activity-assignment.types";

export function useActivityAssignmentDetail(
  patientId: number,
  assignmentId: number,
) {
  return useQuery<ActivityAssignmentDetail>({
    enabled: patientId > 0 && assignmentId > 0,
    queryFn: ({ signal }) =>
      activityAssignmentsApi.getByPatient(patientId, assignmentId, signal),
    queryKey: activityAssignmentKeys.detail(patientId, assignmentId),
  });
}
