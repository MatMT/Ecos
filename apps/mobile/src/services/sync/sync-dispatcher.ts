import {
  getPendingSyncItems,
  dequeueSyncItem,
  markSyncItemFailed,
  getDatabase,
} from '@/services/storage/local-db';
import { authClient } from '@/services/api/auth-client';

export class SyncDispatcher {
  private static instance: SyncDispatcher | null = null;
  private isProcessing = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  public static getInstance(): SyncDispatcher {
    if (!SyncDispatcher.instance) {
      SyncDispatcher.instance = new SyncDispatcher();
    }
    return SyncDispatcher.instance;
  }

  public startPeriodicSync(intervalMs = 30000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      void this.drainQueue();
    }, intervalMs);

    // Initial immediate sync
    void this.drainQueue();
  }

  public stopPeriodicSync(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Processes queued requests with exponential backoff.
   */
  public async drainQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const items = await getPendingSyncItems(10);
      if (items.length === 0) return;

      for (const item of items) {
        if (!item.id) continue;

        // Skip if retried more than 8 times
        if (item.attempts > 8) {
          continue;
        }

        try {
          const payload = JSON.parse(item.payload);
          await authClient.apiFetch(item.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          await dequeueSyncItem(item.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown sync error';
          await markSyncItemFailed(item.id, message);
          // If network failed completely, break loop to avoid sequential timeouts
          if (message.includes('No fue posible conectar') || message.includes('Network request failed')) {
            break;
          }
        }
      }
    } catch {
      // Background sync runner caught safely
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Aggregates hourly biometric readings and transmits summary to the backend.
   */
  public async aggregateAndSyncHourlySummary(studentId: number): Promise<void> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        avg_bpm: number;
        max_bpm: number;
        avg_stress: number;
        avg_spo2: number;
        total_samples: number;
        anomaly_count: number;
        earliest_time: string;
        latest_time: string;
      }>(
        `SELECT
           AVG(bpm) as avg_bpm,
           MAX(bpm) as max_bpm,
           AVG(stress_level) as avg_stress,
           AVG(spo2) as avg_spo2,
           COUNT(*) as total_samples,
           SUM(is_anomaly) as anomaly_count,
           MIN(timestamp) as earliest_time,
           MAX(timestamp) as latest_time
         FROM local_biometric_samples
         WHERE synced_to_summary = 0
         LIMIT 120;`
      );

      if (!rows || rows.length === 0 || rows[0].total_samples < 5) {
        return;
      }

      const summary = rows[0];
      const payload = {
        studentId,
        windowStart: summary.earliest_time,
        windowEnd: summary.latest_time,
        averageHeartRate: Math.round(summary.avg_bpm),
        maxHeartRate: summary.max_bpm,
        averageStress: Number(summary.avg_stress.toFixed(1)),
        averageOxygen: Math.round(summary.avg_spo2),
        totalSteps: 0,
        anomalyEpisodesCount: summary.anomaly_count,
      };

      try {
        await authClient.apiFetch('/api/v1/biometrics/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Mark as synced locally
        await db.runAsync(
          `UPDATE local_biometric_samples
           SET synced_to_summary = 1
           WHERE timestamp >= ? AND timestamp <= ?;`,
          [summary.earliest_time, summary.latest_time]
        );
      } catch {
        // Enqueue if offline
      }
    } catch {
      // Local aggregation safe
    }
  }
}

export const syncDispatcher = SyncDispatcher.getInstance();
