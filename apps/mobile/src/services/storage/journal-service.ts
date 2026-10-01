import { getDatabase, type LocalJournalEntry } from './local-db';

function generateUuid(): string {
  // RFC4122 v4 UUID generator without external dependencies
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface CreateJournalEntryDto {
  moodScore: number;
  primaryEmotion: string;
  narrativeText: string;
  associatedBpm?: number | null;
  associatedStress?: number | null;
}

export async function listJournalEntries(): Promise<LocalJournalEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<LocalJournalEntry>(
    `SELECT id, created_at, updated_at, mood_score, primary_emotion,
            narrative_text, associated_bpm, associated_stress,
            is_shared_with_therapist, shared_snapshot_id
     FROM local_emotional_journal
     ORDER BY created_at DESC;`
  );
}

export async function createJournalEntry(dto: CreateJournalEntryDto): Promise<LocalJournalEntry> {
  const db = await getDatabase();
  const id = generateUuid();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO local_emotional_journal (
       id, created_at, updated_at, mood_score, primary_emotion,
       narrative_text, associated_bpm, associated_stress,
       is_shared_with_therapist, shared_snapshot_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL);`,
    [
      id,
      now,
      now,
      dto.moodScore,
      dto.primaryEmotion,
      dto.narrativeText,
      dto.associatedBpm ?? null,
      dto.associatedStress ?? null,
    ]
  );

  return {
    id,
    created_at: now,
    updated_at: now,
    mood_score: dto.moodScore,
    primary_emotion: dto.primaryEmotion,
    narrative_text: dto.narrativeText,
    associated_bpm: dto.associatedBpm ?? null,
    associated_stress: dto.associatedStress ?? null,
    is_shared_with_therapist: 0,
    shared_snapshot_id: null,
  };
}

export async function markJournalEntryShared(id: string, snapshotId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_emotional_journal
     SET is_shared_with_therapist = 1, shared_snapshot_id = ?, updated_at = datetime('now')
     WHERE id = ?;`,
    [snapshotId, id]
  );
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM local_emotional_journal WHERE id = ?;`, [id]);
}
