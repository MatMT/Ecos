export type TherapeuticPlanStatus = 'ACTIVE' | 'ARCHIVED';

export type ActivityCategory =
  | 'BREATHING'
  | 'DIARY'
  | 'SLEEP'
  | 'BEHAVIORAL'
  | 'OTHER';

export type ActivityStatus = 'PENDING' | 'COMPLETED';

export type SyncStatus = 'SYNCED' | 'PENDING_UPLOAD';

export interface PrescribedActivity {
  id: string;
  planId: string;
  title: string;
  description: string;
  category: ActivityCategory;
  frequency: string;
  status: ActivityStatus;
  lastCompletedAt: string | null;
  syncStatus?: SyncStatus;
}

export interface TherapeuticPlan {
  id: string;
  therapistId: string;
  therapistName: string;
  title: string;
  summary: string;
  startDate: string;
  targetDate: string;
  status: TherapeuticPlanStatus;
  activities: PrescribedActivity[];
}
