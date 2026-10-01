export const ACTIVITY_ASSIGNMENT_STATUS_VALUES = [
  "pending",
  "in_progress",
  "completed",
] as const;

export type ActivityAssignmentStatus =
  (typeof ACTIVITY_ASSIGNMENT_STATUS_VALUES)[number];
export type ActivityAssignmentStatusFilter = ActivityAssignmentStatus | "all";

export interface ActivityAssignmentActivitySummary {
  id: number;
  title: string;
}

export interface ActivityAssignmentTherapistSummary {
  fullName: string | null;
  id: string;
}

export interface ActivityAssignmentDetailActivity {
  active: boolean;
  description: string | null;
  id: number;
  instructions: string | null;
  title: string;
}

export interface ActivityAssignmentDetailPatient {
  assignedTherapist: {
    email: string | null;
    fullName: string | null;
    id: string;
  } | null;
  email: string | null;
  fullName: string | null;
  id: number;
  institutionTimezone: string;
  studentCode: string | null;
}

export interface ActivityAssignmentDetail {
  activity: ActivityAssignmentDetailActivity;
  assignedAt: string;
  completedAt: string | null;
  createdAt: string;
  dueAt: string | null;
  id: number;
  origin: string;
  patient: ActivityAssignmentDetailPatient;
  response: string | null;
  status: string;
  therapist: ActivityAssignmentTherapistSummary | null;
  updatedAt: string;
}

export interface ActivityAssignmentListItem {
  activity: ActivityAssignmentActivitySummary;
  assignedAt: string;
  completedAt: string | null;
  dueAt: string | null;
  hasResponse: boolean;
  id: number;
  origin: string;
  status: string;
  therapist: ActivityAssignmentTherapistSummary | null;
}

export interface PatientActivityAssignmentsParams {
  skip: number;
  status?: ActivityAssignmentStatus;
  take: number;
}

export interface AssignActivityInput {
  activityId: number;
  dueAt?: string;
}

export interface AssignedActivityResponse {
  activityId: number;
  assignedAt: string;
  completedAt: string | null;
  createdAt: string;
  dueAt: string | null;
  id: number;
  origin: string;
  response: string | null;
  status: string;
  studentId: number;
  therapistId: string | null;
  updatedAt: string;
}

export interface AssignActivityFormValues {
  activityId: string;
  dueAt: string;
}

export const EMPTY_ASSIGN_ACTIVITY_FORM_VALUES: AssignActivityFormValues = {
  activityId: "",
  dueAt: "",
};

export interface PatientActivityAssignmentsResponse {
  data: readonly ActivityAssignmentListItem[];
  meta: {
    institutionTimezone: string;
    skip: number;
    take: number;
    total: number;
    totalPages: number;
  };
}

export const ACTIVITY_ASSIGNMENTS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_ACTIVITY_ASSIGNMENTS_PAGE = 1;
export const DEFAULT_ACTIVITY_ASSIGNMENTS_TAKE = 20;
