"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { activityAssignmentsApi } from "@/features/activity-assignments/api/activity-assignments.api";
import { activityAssignmentKeys } from "@/features/activity-assignments/api/activity-assignment.keys";
import type {
  PatientActivityAssignmentsParams,
  PatientActivityAssignmentsResponse,
} from "@/features/activity-assignments/types/activity-assignment.types";

export function usePatientActivityAssignments(
  patientId: number,
  params: PatientActivityAssignmentsParams,
) {
  return useQuery<PatientActivityAssignmentsResponse>({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      activityAssignmentsApi.listByPatient(patientId, params, signal),
    queryKey: activityAssignmentKeys.list(patientId, params),
  });
}
