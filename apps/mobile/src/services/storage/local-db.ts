import * as SQLite from 'expo-sqlite';
import type {
  TherapeuticPlan,
  PrescribedActivity,
  ActivityStatus,
  SyncStatus,
  ActivityCategory,
  TherapeuticPlanStatus,
} from '@/types/clinical';

const DB_NAME = 'ecos_local.db';

export interface LocalBiometricSample {
  id?: number;
  timestamp?: string;
  bpm: number;
  activity: number;
  spo2: number;
  stress_level: number;
  mse_error: number;
  is_anomaly: number; // 0 or 1
  synced_to_summary?: number; // 0 or 1
}

export interface LocalJournalEntry {
  id: string;
  created_at?: string;
  updated_at?: string;
  mood_score: number; // 1 to 5
  primary_emotion: string; // ansioso, triste, neutro, en paz, motivado
  narrative_text: string;
  associated_bpm?: number | null;
  associated_stress?: number | null;
  is_shared_with_therapist?: number; // 0 or 1
  shared_snapshot_id?: string | null;
}

export interface LocalSyncQueueItem {
  id?: number;
  endpoint: string;
  payload: string; // JSON stringified
  method?: string; // GET, POST, PATCH, etc.
  created_at?: string;
  attempts: number;
  last_error?: string | null;
}

export interface LocalAppointmentRecord {
  id: number;
  appointment_date: string;
  status: string;
  reason?: string | null;
  doctor_name?: string | null;
  doctor_id?: string | null;
  modality?: string | null;
  synced?: number; // 1 = confirmed with backend, 0 = local draft / pending queue
}

export interface LocalTreatmentPlanRecord {
  id: string;
  therapist_id: string;
  therapist_name: string;
  title: string;
  summary: string;
  start_date: string;
  target_date: string;
  status: string;
  synced: number;
  updated_at?: string;
}

export interface LocalPrescribedActivityRecord {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  category: string;
  frequency: string;
  status: string;
  last_completed_at: string | null;
  sync_status: string;
  created_at?: string;
  updated_at?: string;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Initialize schemas
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_biometric_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      bpm INTEGER NOT NULL,
      activity INTEGER NOT NULL,
      spo2 INTEGER NOT NULL,
      stress_level REAL NOT NULL,
      mse_error REAL NOT NULL,
      is_anomaly INTEGER DEFAULT 0,
      synced_to_summary INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_biometric_timestamp ON local_biometric_samples(timestamp);

    CREATE TABLE IF NOT EXISTS local_emotional_journal (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mood_score INTEGER NOT NULL,
      primary_emotion TEXT NOT NULL,
      narrative_text TEXT NOT NULL,
      associated_bpm INTEGER,
      associated_stress REAL,
      is_shared_with_therapist INTEGER DEFAULT 0,
      shared_snapshot_id TEXT
    );

    CREATE TABLE IF NOT EXISTS local_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      payload TEXT NOT NULL,
      method TEXT DEFAULT 'POST',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attempts INTEGER DEFAULT 0,
      last_error TEXT
    );

    CREATE TABLE IF NOT EXISTS local_appointments (
      id INTEGER PRIMARY KEY,
      appointment_date TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      doctor_name TEXT,
      doctor_id TEXT,
      modality TEXT,
      synced INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS local_treatment_plans (
      id TEXT PRIMARY KEY,
      therapist_id TEXT,
      therapist_name TEXT,
      title TEXT NOT NULL,
      summary TEXT,
      start_date TEXT,
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      synced INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS local_prescribed_activities (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      last_completed_at TEXT,
      sync_status TEXT DEFAULT 'SYNCED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_prescribed_activities_plan ON local_prescribed_activities(plan_id);
  `);

  try {
    await db.execAsync(`ALTER TABLE local_sync_queue ADD COLUMN method TEXT DEFAULT 'POST';`);
  } catch {
    // Column already exists
  }

  dbInstance = db;
  return db;
}

/**
 * Saves a high-frequency biometric reading and purges readings older than 48 hours.
 */
export async function saveBiometricSample(sample: LocalBiometricSample): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO local_biometric_samples (bpm, activity, spo2, stress_level, mse_error, is_anomaly, synced_to_summary)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    [
      sample.bpm,
      sample.activity,
      sample.spo2,
      sample.stress_level,
      sample.mse_error,
      sample.is_anomaly,
    ]
  );

  // Purge samples older than 48 hours to conserve mobile storage
  await db.runAsync(
    `DELETE FROM local_biometric_samples
     WHERE timestamp < datetime('now', '-48 hours');`
  );
}

/**
 * Enqueues a payload for background sync to the central server.
 */
export async function enqueueSync(
  endpoint: string,
  payload: unknown,
  method: string = 'POST'
): Promise<number> {
  const db = await getDatabase();
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const result = await db.runAsync(
    `INSERT INTO local_sync_queue (endpoint, payload, method, attempts) VALUES (?, ?, ?, 0);`,
    [endpoint, payloadStr, method]
  );
  return result.lastInsertRowId;
}

/**
 * Gets pending items from the sync queue.
 */
export async function getPendingSyncItems(limit = 20): Promise<LocalSyncQueueItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalSyncQueueItem>(
    `SELECT id, endpoint, payload, method, created_at, attempts, last_error
     FROM local_sync_queue
     ORDER BY id ASC
     LIMIT ?;`,
    [limit]
  );
}

/**
 * Removes a successfully processed item from the queue.
 */
export async function dequeueSyncItem(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM local_sync_queue WHERE id = ?;`, [id]);
}

/**
 * Updates failure details for a sync queue item.
 */
export async function markSyncItemFailed(id: number, errorMsg: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_sync_queue
     SET attempts = attempts + 1, last_error = ?
     WHERE id = ?;`,
    [errorMsg, id]
  );
}

/**
 * Persists an array of appointments into local SQLite storage.
 */
export async function saveLocalAppointments(
  appointments: LocalAppointmentRecord[]
): Promise<void> {
  const db = await getDatabase();
  for (const appt of appointments) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_appointments (
         id, appointment_date, status, reason, doctor_name, doctor_id, modality, synced, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
      [
        appt.id,
        appt.appointment_date,
        appt.status,
        appt.reason ?? null,
        appt.doctor_name ?? null,
        appt.doctor_id ?? null,
        appt.modality ?? null,
        appt.synced ?? 1,
      ]
    );
  }
}

/**
 * Saves or updates a single local appointment.
 */
export async function saveSingleLocalAppointment(
  appt: LocalAppointmentRecord
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO local_appointments (
       id, appointment_date, status, reason, doctor_name, doctor_id, modality, synced, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    [
      appt.id,
      appt.appointment_date,
      appt.status,
      appt.reason ?? null,
      appt.doctor_name ?? null,
      appt.doctor_id ?? null,
      appt.modality ?? null,
      appt.synced ?? 1,
    ]
  );
}

/**
  * Retrieves cached appointments from local SQLite ordered by appointment date descending.
  */
export async function getLocalAppointments(): Promise<LocalAppointmentRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalAppointmentRecord>(
    `SELECT id, appointment_date, status, reason, doctor_name, doctor_id, modality, synced
     FROM local_appointments
     ORDER BY appointment_date DESC;`
  );
}

/**
  * Persists the active therapeutic plan and its activities into local SQLite storage.
  */
export async function saveLocalTreatmentPlan(plan: TherapeuticPlan): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO local_treatment_plans (
       id, therapist_id, therapist_name, title, summary, start_date, target_date, status, synced, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'));`,
    [
      plan.id,
      plan.therapistId,
      plan.therapistName,
      plan.title,
      plan.summary,
      plan.startDate,
      plan.targetDate,
      plan.status,
    ]
  );

  if (plan.activities && plan.activities.length > 0) {
    await saveLocalPrescribedActivities(plan.activities);
  }
}

/**
 * Retrieves the currently active therapeutic plan and its associated activities from local SQLite.
 */
export async function getLocalActiveTreatmentPlan(): Promise<TherapeuticPlan | null> {
  const db = await getDatabase();
  const planRow = await db.getFirstAsync<LocalTreatmentPlanRecord>(
    `SELECT id, therapist_id, therapist_name, title, summary, start_date, target_date, status, synced
     FROM local_treatment_plans
     WHERE status = 'ACTIVE'
     ORDER BY updated_at DESC
     LIMIT 1;`
  );

  if (!planRow) {
    return null;
  }

  const activities = await getLocalPrescribedActivities(planRow.id);

  return {
    id: planRow.id,
    therapistId: planRow.therapist_id,
    therapistName: planRow.therapist_name,
    title: planRow.title,
    summary: planRow.summary,
    startDate: planRow.start_date,
    targetDate: planRow.target_date,
    status: (planRow.status as TherapeuticPlanStatus) || 'ACTIVE',
    activities,
  };
}

/**
 * Persists an array of prescribed activities in local SQLite storage.
 */
export async function saveLocalPrescribedActivities(
  activities: PrescribedActivity[]
): Promise<void> {
  const db = await getDatabase();
  for (const act of activities) {
    await db.runAsync(
      `INSERT OR REPLACE INTO local_prescribed_activities (
         id, plan_id, title, description, category, frequency, status, last_completed_at, sync_status, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
      [
        act.id,
        act.planId,
        act.title,
        act.description,
        act.category,
        act.frequency,
        act.status,
        act.lastCompletedAt ?? null,
        act.syncStatus ?? 'SYNCED',
      ]
    );
  }
}

/**
 * Retrieves prescribed activities for a plan or all active activities from local SQLite.
 */
export async function getLocalPrescribedActivities(
  planId?: string
): Promise<PrescribedActivity[]> {
  const db = await getDatabase();
  const rows = planId
    ? await db.getAllAsync<LocalPrescribedActivityRecord>(
        `SELECT id, plan_id, title, description, category, frequency, status, last_completed_at, sync_status
         FROM local_prescribed_activities
         WHERE plan_id = ?
         ORDER BY id ASC;`,
        [planId]
      )
    : await db.getAllAsync<LocalPrescribedActivityRecord>(
        `SELECT id, plan_id, title, description, category, frequency, status, last_completed_at, sync_status
         FROM local_prescribed_activities
         ORDER BY id ASC;`
      );

  return rows.map((r) => ({
    id: r.id,
    planId: r.plan_id,
    title: r.title,
    description: r.description,
    category: (r.category as ActivityCategory) || 'OTHER',
    frequency: r.frequency,
    status: (r.status as ActivityStatus) || 'PENDING',
    lastCompletedAt: r.last_completed_at,
    syncStatus: (r.sync_status as SyncStatus) || 'SYNCED',
  }));
}

/**
 * Updates an activity's completion status in local SQLite.
 */
export async function updateLocalActivityStatus(
  activityId: string,
  status: ActivityStatus,
  syncStatus: SyncStatus = 'PENDING_UPLOAD'
): Promise<PrescribedActivity | null> {
  const db = await getDatabase();
  const nowIso = status === 'COMPLETED' ? new Date().toISOString() : null;

  await db.runAsync(
    `UPDATE local_prescribed_activities
     SET status = ?, last_completed_at = COALESCE(?, last_completed_at), sync_status = ?, updated_at = datetime('now')
     WHERE id = ?;`,
    [status, nowIso, syncStatus, activityId]
  );

  const updated = await db.getFirstAsync<LocalPrescribedActivityRecord>(
    `SELECT id, plan_id, title, description, category, frequency, status, last_completed_at, sync_status
     FROM local_prescribed_activities
     WHERE id = ?;`,
    [activityId]
  );

  if (!updated) return null;

  return {
    id: updated.id,
    planId: updated.plan_id,
    title: updated.title,
    description: updated.description,
    category: (updated.category as ActivityCategory) || 'OTHER',
    frequency: updated.frequency,
    status: (updated.status as ActivityStatus) || 'PENDING',
    lastCompletedAt: updated.last_completed_at,
    syncStatus: (updated.sync_status as SyncStatus) || 'SYNCED',
  };
}

/**
 * Marks a local activity as successfully synced with the server.
 */
export async function markLocalActivitySynced(activityId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_prescribed_activities
     SET sync_status = 'SYNCED', updated_at = datetime('now')
     WHERE id = ?;`,
    [activityId]
  );
}


