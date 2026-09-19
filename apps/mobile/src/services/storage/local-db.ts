import * as SQLite from 'expo-sqlite';

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
  created_at?: string;
  attempts: number;
  last_error?: string | null;
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attempts INTEGER DEFAULT 0,
      last_error TEXT
    );
  `);

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
export async function enqueueSync(endpoint: string, payload: unknown): Promise<number> {
  const db = await getDatabase();
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const result = await db.runAsync(
    `INSERT INTO local_sync_queue (endpoint, payload, attempts) VALUES (?, ?, 0);`,
    [endpoint, payloadStr]
  );
  return result.lastInsertRowId;
}

/**
 * Gets pending items from the sync queue.
 */
export async function getPendingSyncItems(limit = 20): Promise<LocalSyncQueueItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalSyncQueueItem>(
    `SELECT id, endpoint, payload, created_at, attempts, last_error
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
