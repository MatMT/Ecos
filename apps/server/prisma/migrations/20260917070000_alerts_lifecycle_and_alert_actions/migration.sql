-- CreateEnum
CREATE TYPE "enum_alert_priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "enum_alert_status" AS ENUM ('new', 'reviewed', 'in_follow_up', 'closed');

-- AlterTable: Alert lifecycle fields, additive only. `resolved` is kept (no dropped columns).
ALTER TABLE "remote_alerts"
  ADD COLUMN "priority" "enum_alert_priority",
  ADD COLUMN "status" "enum_alert_status" NOT NULL DEFAULT 'new',
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "reviewed_by_id" UUID,
  ADD COLUMN "closed_at" TIMESTAMP(3),
  ADD COLUMN "context_summary" TEXT;

-- Backfill: alerts already resolved before this phase existed become `closed`. There is no
-- historical reviewer/action data to reconstruct `reviewed`/`in_follow_up` from.
UPDATE "remote_alerts" SET "status" = 'closed', "closed_at" = "updated_at" WHERE "resolved" = true;

-- CreateTable
-- Append-only action log (no updated_at — an action, once logged, is never edited), same shape
-- as remote_audit_logs. student_id denormalized from alert_id so RLS can call
-- can_access_clinical_data(student_id) directly instead of joining into remote_alerts from a
-- policy — mirrors remote_treatment_goals/remote_student_activities.
CREATE TABLE "remote_alert_actions" (
    "id" SERIAL NOT NULL,
    "alert_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "therapist_id" UUID NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remote_alert_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "remote_alerts_reviewed_by_id_idx" ON "remote_alerts"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "remote_alerts_student_id_status_created_at_idx" ON "remote_alerts"("student_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "remote_alert_actions_alert_id_idx" ON "remote_alert_actions"("alert_id");

-- CreateIndex
CREATE INDEX "remote_alert_actions_student_id_idx" ON "remote_alert_actions"("student_id");

-- CreateIndex
CREATE INDEX "remote_alert_actions_therapist_id_idx" ON "remote_alert_actions"("therapist_id");

-- AddForeignKey
ALTER TABLE "remote_alerts" ADD CONSTRAINT "remote_alerts_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_alert_actions" ADD CONSTRAINT "remote_alert_actions_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "remote_alerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_alert_actions" ADD CONSTRAINT "remote_alert_actions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_alert_actions" ADD CONSTRAINT "remote_alert_actions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
