import { api } from "@/lib/api";
import type {
  AssignActivityInput,
  AssignedActivityResponse,
  ActivityAssignmentDetail,
  PatientActivityAssignmentsParams,
  PatientActivityAssignmentsResponse,
} from "@/features/activity-assignments/types/activity-assignment.types";

export const activityAssignmentsApi = {
  assign: (patientId: number, input: AssignActivityInput) =>
    api.post<AssignedActivityResponse, AssignActivityInput>(
      `/students/${patientId}/activities`,
      input,
    ),
  getByPatient: (
    patientId: number,
    assignmentId: number,
    signal?: AbortSignal,
  ) =>
    api.get<ActivityAssignmentDetail>(
      `/students/${patientId}/activities/${assignmentId}`,
      { signal },
    ),
  listByPatient: (
    patientId: number,
    params: PatientActivityAssignmentsParams,
    signal?: AbortSignal,
  ) =>
    api.get<PatientActivityAssignmentsResponse>(
      `/students/${patientId}/activities`,
      {
        params: {
          skip: params.skip,
          status: params.status,
          take: params.take,
        },
        signal,
      },
    ),
};
