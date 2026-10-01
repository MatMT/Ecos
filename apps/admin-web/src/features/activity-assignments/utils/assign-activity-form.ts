import type {
  AssignActivityFormValues,
  AssignActivityInput,
} from "@/features/activity-assignments/types/activity-assignment.types";
import { zonedDateTimeToIso } from "@/lib/datetime/timezone";

export function toAssignActivityInput(
  values: AssignActivityFormValues,
  timeZone: string,
): AssignActivityInput {
  return {
    activityId: Number(values.activityId),
    ...(values.dueAt
      ? { dueAt: zonedDateTimeToIso(values.dueAt, timeZone) }
      : {}),
  };
}
