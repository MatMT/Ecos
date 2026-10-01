-- CreateTable
CREATE TABLE "remote_clinical_records" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initial_reason" TEXT,
    "psychological_history" TEXT,
    "psychiatric_history" TEXT,
    "relevant_family_history" TEXT,
    "previous_treatments" TEXT,
    "current_medication" TEXT,
    "general_observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_clinical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- Append-only: no updated_at, mirrors the model — an audit row is never edited.
CREATE TABLE "remote_audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "institution_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remote_audit_logs_pkey" PRIMARY KEY ("id")
);

-- AlterTable: ClinicalNote content fields + soft-void columns (no physical delete, per
-- GOALS.md §3 rule 6 — mirrors the Appointment-cancellation precedent).
ALTER TABLE "remote_clinical_notes"
  ADD COLUMN "session_summary" TEXT,
  ADD COLUMN "clinical_impression" TEXT,
  ADD COLUMN "interventions" TEXT,
  ADD COLUMN "agreements" TEXT,
  ADD COLUMN "follow_up_plan" TEXT,
  ADD COLUMN "voided_at" TIMESTAMP(3),
  ADD COLUMN "voided_by_id" UUID,
  ADD COLUMN "void_reason" VARCHAR(500);

-- CreateIndex
CREATE UNIQUE INDEX "remote_clinical_records_student_id_key" ON "remote_clinical_records"("student_id");

-- CreateIndex
CREATE INDEX "remote_audit_logs_user_id_idx" ON "remote_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "remote_audit_logs_institution_id_idx" ON "remote_audit_logs"("institution_id");

-- CreateIndex
CREATE INDEX "remote_audit_logs_entity_entity_id_idx" ON "remote_audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "remote_audit_logs_created_at_idx" ON "remote_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "remote_clinical_notes_voided_by_id_idx" ON "remote_clinical_notes"("voided_by_id");

-- AddForeignKey
ALTER TABLE "remote_clinical_records" ADD CONSTRAINT "remote_clinical_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_audit_logs" ADD CONSTRAINT "remote_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_audit_logs" ADD CONSTRAINT "remote_audit_logs_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "remote_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_clinical_notes" ADD CONSTRAINT "remote_clinical_notes_voided_by_id_fkey" FOREIGN KEY ("voided_by_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
