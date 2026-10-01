import { useCallback, useEffect, useState, useMemo } from 'react';
import type {
  TherapeuticPlan,
  PrescribedActivity,
  ActivityStatus,
} from '@/types/clinical';
import { treatmentPlanService } from '@/services/api/treatment-plan.service';

export interface UseTreatmentPlanReturn {
  plan: TherapeuticPlan | null;
  activities: PrescribedActivity[];
  activeCount: number;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isLoading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  toggleActivity: (activityId: string, currentStatus: ActivityStatus) => Promise<void>;
}

export function useTreatmentPlan(): UseTreatmentPlanReturn {
  const [plan, setPlan] = useState<TherapeuticPlan | null>(null);
  const [activities, setActivities] = useState<PrescribedActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPlan = useCallback(async () => {
    try {
      const fetched = await treatmentPlanService.fetchActivePlan();
      setPlan(fetched);
      setActivities(fetched?.activities || []);
    } catch {
      setError('No ha sido posible cargar el plan terapéutico en este momento.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    treatmentPlanService
      .fetchActivePlan()
      .then((fetched) => {
        if (isMounted) {
          setPlan(fetched);
          setActivities(fetched?.activities || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No ha sido posible cargar el plan terapéutico en este momento.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleActivity = useCallback(
    async (activityId: string, currentStatus: ActivityStatus) => {
      const targetStatus: ActivityStatus =
        currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

      // Immediate optimistic state update in React
      setActivities((prev) =>
        prev.map((act) =>
          act.id === activityId
            ? {
                ...act,
                status: targetStatus,
                lastCompletedAt:
                  targetStatus === 'COMPLETED'
                    ? new Date().toISOString()
                    : act.lastCompletedAt,
                syncStatus: 'PENDING_UPLOAD',
              }
            : act
        )
      );

      try {
        const updated = await treatmentPlanService.toggleActivityStatus(
          activityId,
          targetStatus
        );

        setActivities((prev) =>
          prev.map((act) => (act.id === activityId ? updated : act))
        );
      } catch {
        // Optimistic update remains in SQLite with PENDING_UPLOAD flag
      }
    },
    []
  );

  const activeCount = useMemo(
    () => activities.filter((a) => a.status === 'PENDING').length,
    [activities]
  );

  const completedCount = useMemo(
    () => activities.filter((a) => a.status === 'COMPLETED').length,
    [activities]
  );

  const totalCount = activities.length;

  const progressPercent = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount]);

  return {
    plan,
    activities,
    activeCount,
    completedCount,
    totalCount,
    progressPercent,
    isLoading,
    error,
    refreshPlan,
    toggleActivity,
  };
}
