import { authClient } from './auth-client';
import type {
  TherapeuticPlan,
  PrescribedActivity,
  ActivityStatus,
} from '@/types/clinical';
import {
  saveLocalTreatmentPlan,
  getLocalActiveTreatmentPlan,
  updateLocalActivityStatus,
  markLocalActivitySynced,
  enqueueSync,
  getLocalPrescribedActivities,
} from '@/services/storage/local-db';

const DEFAULT_DEMO_PLAN: TherapeuticPlan = {
  id: 'plan_active_default',
  therapistId: 'therapist_lead',
  therapistName: 'Lic. David Rivas',
  title: 'Plan de Estabilización Autonómica y Regulación Emocional',
  summary:
    'Estrategias cognitivo-conductuales y autorregulación somática para la mitigación del estrés académico.',
  startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
  targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  status: 'ACTIVE',
  activities: [
    {
      id: 'act_breathing_1',
      planId: 'plan_active_default',
      title: 'Respiración 4-7-8 al despertar',
      description:
        'Modulación vagal consciente para reducir la activación simpática matutina.',
      category: 'BREATHING',
      frequency: 'Diario · 5 min',
      status: 'PENDING',
      lastCompletedAt: null,
      syncStatus: 'SYNCED',
    },
    {
      id: 'act_diary_1',
      planId: 'plan_active_default',
      title: 'Registro de detonante vespertino',
      description:
        'Anotar en el diario reflexivo cualquier pico de rumiación o tensión en clase.',
      category: 'DIARY',
      frequency: 'Al finalizar la tarde',
      status: 'PENDING',
      lastCompletedAt: null,
      syncStatus: 'SYNCED',
    },
    {
      id: 'act_sleep_1',
      planId: 'plan_active_default',
      title: 'Higiene del descanso nocturno',
      description:
        'Desconexión de estímulos luminosos 30 minutos antes del reposo.',
      category: 'SLEEP',
      frequency: 'Cada noche',
      status: 'PENDING',
      lastCompletedAt: null,
      syncStatus: 'SYNCED',
    },
    {
      id: 'act_behavioral_1',
      planId: 'plan_active_default',
      title: 'Identificación de señales fisiológicas de tensión',
      description:
        'Reconocimiento anticipado de aceleración cardíaca o rigidez cervical.',
      category: 'BEHAVIORAL',
      frequency: '3 veces por semana',
      status: 'COMPLETED',
      lastCompletedAt: new Date(Date.now() - 86400000).toISOString(),
      syncStatus: 'SYNCED',
    },
  ],
};

export const treatmentPlanService = {
  /**
   * Fetches the student's active treatment plan with assigned activities.
   * Prioritizes backend REST API; transparently falls back to local SQLite cache
   * or initial fallback data when network is unreachable.
   */
  async fetchActivePlan(): Promise<TherapeuticPlan | null> {
    try {
      const res = await authClient.apiFetch('/api/v1/plans/active');
      if (res.ok) {
        const plan = (await res.json()) as TherapeuticPlan;
        if (plan && plan.id) {
          await saveLocalTreatmentPlan(plan);
          return plan;
        }
      } else if (res.status === 404) {
        // No active plan on server
        return null;
      }
    } catch {
      // Offline / network failure handled below
    }

    // Attempt retrieval from local SQLite cache
    const cachedPlan = await getLocalActiveTreatmentPlan();
    if (cachedPlan) {
      return cachedPlan;
    }

    // Seed initial offline demo plan if cache is completely empty
    await saveLocalTreatmentPlan(DEFAULT_DEMO_PLAN);
    return DEFAULT_DEMO_PLAN;
  },

  /**
   * Toggles completion status of a prescribed activity.
   * Performs an immediate optimistic update in SQLite with PENDING_UPLOAD status,
   * then updates backend. If network fails, enqueues request in background sync queue.
   */
  async toggleActivityStatus(
    activityId: string,
    status: ActivityStatus
  ): Promise<PrescribedActivity> {
    // 1. Immediate optimistic SQLite update
    const locallyUpdated = await updateLocalActivityStatus(
      activityId,
      status,
      'PENDING_UPLOAD'
    );

    const fallbackActivity: PrescribedActivity = locallyUpdated || {
      id: activityId,
      planId: 'plan_active_default',
      title: 'Actividad terapéutica',
      description: '',
      category: 'OTHER',
      frequency: 'Diario',
      status,
      lastCompletedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
      syncStatus: 'PENDING_UPLOAD',
    };

    // 2. Try online sync
    try {
      const res = await authClient.apiFetch(`/api/v1/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status.toLowerCase(),
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        await markLocalActivitySynced(activityId);
        return {
          ...fallbackActivity,
          status,
          syncStatus: 'SYNCED',
        };
      }
    } catch {
      // Offline: Enqueue in persistent queue for periodic sync
    }

    await enqueueSync(
      `/api/v1/activities/${activityId}`,
      {
        status: status.toLowerCase(),
        completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
      },
      'PATCH'
    );

    return {
      ...fallbackActivity,
      status,
      syncStatus: 'PENDING_UPLOAD',
    };
  },

  /**
   * Gets cached activities directly from SQLite without network call.
   */
  async getCachedActivities(planId?: string): Promise<PrescribedActivity[]> {
    return getLocalPrescribedActivities(planId);
  },
};
