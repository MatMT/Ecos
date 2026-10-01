-- Postgres does not auto-index foreign-key columns. Every FK below lacked a covering
-- index (flagged by Supabase's advisor) — this hurts both join performance and RLS
-- policy evaluation, since most policies filter by exactly these columns.
-- (remote_student_profiles.user_id and remote_clinical_notes.appointment_id already have
-- a unique index from @unique, so they're not included here.)

-- CreateIndex
CREATE INDEX "remote_users_institution_id_idx" ON "remote_users"("institution_id");

-- CreateIndex
CREATE INDEX "remote_student_profiles_assigned_doctor_id_idx" ON "remote_student_profiles"("assigned_doctor_id");

-- CreateIndex
CREATE INDEX "remote_band_devices_student_id_idx" ON "remote_band_devices"("student_id");

-- CreateIndex
CREATE INDEX "remote_biometric_records_device_id_idx" ON "remote_biometric_records"("device_id");

-- CreateIndex
CREATE INDEX "remote_alerts_student_id_idx" ON "remote_alerts"("student_id");

-- CreateIndex
CREATE INDEX "remote_alerts_biometric_record_id_idx" ON "remote_alerts"("biometric_record_id");

-- CreateIndex
CREATE INDEX "remote_emotional_journal_student_id_idx" ON "remote_emotional_journal"("student_id");

-- CreateIndex
CREATE INDEX "remote_emotional_journal_biometric_record_id_idx" ON "remote_emotional_journal"("biometric_record_id");

-- CreateIndex
CREATE INDEX "remote_appointments_student_id_idx" ON "remote_appointments"("student_id");

-- CreateIndex
CREATE INDEX "remote_appointments_doctor_id_idx" ON "remote_appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "remote_clinical_notes_doctor_id_idx" ON "remote_clinical_notes"("doctor_id");

-- CreateIndex
CREATE INDEX "remote_clinical_notes_student_id_idx" ON "remote_clinical_notes"("student_id");
