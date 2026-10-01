-- Phase 5.3: a clinical note may be a manual session or a snapshot of an appointment.
-- Existing appointment-backed notes preserve their clinical metadata before new rows are allowed.

-- AlterTable
ALTER TABLE "remote_clinical_notes"
  ALTER COLUMN "appointment_id" DROP NOT NULL,
  ADD COLUMN "session_date" TIMESTAMP(3),
  ADD COLUMN "session_type" VARCHAR(255),
  ADD COLUMN "duration_minutes" INTEGER,
  ADD COLUMN "modality" VARCHAR(50);

-- Backfill snapshots without substituting note creation time for a missing clinical date.
UPDATE "remote_clinical_notes" AS note
SET
  "session_date" = appointment."appointment_date",
  "session_type" = appointment."session_type",
  "duration_minutes" = appointment."duration_minutes",
  "modality" = appointment."modality"
FROM "remote_appointments" AS appointment
WHERE appointment."id" = note."appointment_id";

-- CreateIndex
CREATE INDEX "remote_clinical_notes_student_id_session_date_created_at_id_idx"
  ON "remote_clinical_notes"("student_id", "session_date" DESC, "created_at" DESC, "id" DESC);
