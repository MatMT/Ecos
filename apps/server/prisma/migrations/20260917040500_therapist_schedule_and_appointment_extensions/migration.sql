-- AlterTable
ALTER TABLE "remote_institutions" ADD COLUMN "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/El_Salvador';

-- CreateTable
CREATE TABLE "remote_therapist_schedules" (
    "id" SERIAL NOT NULL,
    "therapist_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "session_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "valid_from" DATE,
    "valid_to" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_therapist_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_therapist_schedule_exceptions" (
    "id" SERIAL NOT NULL,
    "therapist_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME(0),
    "end_time" TIME(0),
    "available" BOOLEAN NOT NULL DEFAULT false,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_therapist_schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Appointment extensions. All nullable — additive, no backfill of existing rows
-- possible or needed (durationMinutes/endAt have no sane single DB default; see AGENTS.md /
-- docs/clinical-panel/GOALS.md §4 for why this mirrors the existing `status` column's own
-- nullability).
ALTER TABLE "remote_appointments"
  ADD COLUMN "duration_minutes" INTEGER,
  ADD COLUMN "end_at" TIMESTAMP(3),
  ADD COLUMN "modality" VARCHAR(50),
  ADD COLUMN "reason" VARCHAR(500),
  ADD COLUMN "cancel_reason" VARCHAR(500),
  ADD COLUMN "created_by_id" UUID,
  ADD COLUMN "rescheduled_from_id" INTEGER;

-- CreateIndex
CREATE INDEX "remote_therapist_schedules_therapist_id_idx" ON "remote_therapist_schedules"("therapist_id");

-- CreateIndex
CREATE INDEX "remote_therapist_schedules_therapist_id_day_of_week_idx" ON "remote_therapist_schedules"("therapist_id", "day_of_week");

-- CreateIndex
CREATE INDEX "remote_therapist_schedule_exceptions_therapist_id_idx" ON "remote_therapist_schedule_exceptions"("therapist_id");

-- CreateIndex
CREATE INDEX "remote_therapist_schedule_exceptions_therapist_id_date_idx" ON "remote_therapist_schedule_exceptions"("therapist_id", "date");

-- CreateIndex
CREATE INDEX "remote_appointments_created_by_id_idx" ON "remote_appointments"("created_by_id");

-- CreateIndex
CREATE INDEX "remote_appointments_doctor_id_appointment_date_idx" ON "remote_appointments"("doctor_id", "appointment_date");

-- CreateIndex
CREATE INDEX "remote_appointments_student_id_appointment_date_idx" ON "remote_appointments"("student_id", "appointment_date");

-- CreateIndex: the reschedule model (old row -> new row referencing it) is implicitly 1:1;
-- this is what actually enforces that, since nothing else does.
CREATE UNIQUE INDEX "remote_appointments_rescheduled_from_id_key" ON "remote_appointments"("rescheduled_from_id");

-- AddForeignKey
ALTER TABLE "remote_therapist_schedules" ADD CONSTRAINT "remote_therapist_schedules_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_therapist_schedule_exceptions" ADD CONSTRAINT "remote_therapist_schedule_exceptions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_appointments" ADD CONSTRAINT "remote_appointments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_appointments" ADD CONSTRAINT "remote_appointments_rescheduled_from_id_fkey" FOREIGN KEY ("rescheduled_from_id") REFERENCES "remote_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Overlap invariant: no two agenda-occupying appointments for the same doctor or the same
-- student at overlapping times. DB-level backstop for the same race a service-level check
-- also guards against — mirrors the remote_therapist_assignments_active_primary_per_student
-- partial unique index from Phase 1. Two separate constraints (doctor, student), not one
-- combined constraint, which would only catch "same doctor AND same student" overlaps — a
-- strictly weaker guarantee. `tsrange`, not `tstzrange`: every timestamp column in this
-- schema is TIMESTAMP(3) WITHOUT TIME ZONE, confirmed against the actual column types above.
-- Positive allow-list (pending/confirmed = "states that occupy the agenda") rather than a
-- negative list, so a future new status doesn't silently start counting. The IS NOT NULL
-- guard means every pre-Phase-2 row (end_at still null) falls outside the constraint
-- automatically — no historical-data cleanup needed for this migration to apply.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "remote_appointments"
  ADD CONSTRAINT "remote_appointments_no_doctor_overlap"
  EXCLUDE USING gist (
    "doctor_id" WITH =,
    tsrange("appointment_date", "end_at", '[)') WITH &&
  )
  WHERE (
    "doctor_id" IS NOT NULL AND "appointment_date" IS NOT NULL AND "end_at" IS NOT NULL
    AND "status" IN ('pending', 'confirmed')
  );

ALTER TABLE "remote_appointments"
  ADD CONSTRAINT "remote_appointments_no_student_overlap"
  EXCLUDE USING gist (
    "student_id" WITH =,
    tsrange("appointment_date", "end_at", '[)') WITH &&
  )
  WHERE (
    "student_id" IS NOT NULL AND "appointment_date" IS NOT NULL AND "end_at" IS NOT NULL
    AND "status" IN ('pending', 'confirmed')
  );
