-- CreateTable
-- Patient-initiated, immutable snapshot (technical-guide.en.md §3.10) — content_type stays a
-- loosely-typed VarChar for now (journal_entry/patient_note/ai_summary), same treatment as
-- AlertAction.actionType, promotable to an enum once the catalog stabilizes.
CREATE TABLE "remote_shared_patient_content" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "therapist_id" UUID,
    "content_type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "source_local_id" VARCHAR(255),
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_shared_patient_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "remote_shared_patient_content_student_id_idx" ON "remote_shared_patient_content"("student_id");

-- CreateIndex
CREATE INDEX "remote_shared_patient_content_therapist_id_idx" ON "remote_shared_patient_content"("therapist_id");

-- AddForeignKey
ALTER TABLE "remote_shared_patient_content" ADD CONSTRAINT "remote_shared_patient_content_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_shared_patient_content" ADD CONSTRAINT "remote_shared_patient_content_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
