"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activityAssignmentsApi } from "@/features/activity-assignments/api/activity-assignments.api";
import { activityAssignmentKeys } from "@/features/activity-assignments/api/activity-assignment.keys";
import type { AssignActivityInput } from "@/features/activity-assignments/types/activity-assignment.types";
import { patientKeys } from "@/features/patients/api/patient.keys";

export function useAssignActivity(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignActivityInput) =>
      activityAssignmentsApi.assign(patientId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: activityAssignmentKeys.byPatient(patientId),
        }),
        queryClient.invalidateQueries({
          queryKey: patientKeys.overview(patientId),
        }),
      ]);
    },
  });
}
