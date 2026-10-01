import type { PatientActivityAssignmentsParams } from "@/features/activity-assignments/types/activity-assignment.types";

export const activityAssignmentKeys = {
  all: ["activity-assignments"] as const,
  byPatient: (patientId: number) =>
    [...activityAssignmentKeys.lists(), patientId] as const,
  detail: (patientId: number, assignmentId: number) =>
    [...activityAssignmentKeys.details(), patientId, assignmentId] as const,
  details: () => [...activityAssignmentKeys.all, "detail"] as const,
  list: (patientId: number, params: PatientActivityAssignmentsParams) =>
    [...activityAssignmentKeys.byPatient(patientId), params] as const,
  lists: () => [...activityAssignmentKeys.all, "list"] as const,
};
