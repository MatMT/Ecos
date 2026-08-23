-- CreateEnum
CREATE TYPE "enum_role" AS ENUM ('student', 'doctor', 'administrator');

-- CreateEnum
CREATE TYPE "enum_entry_type" AS ENUM ('personal_journal', 'ai_chat');

-- CreateEnum
CREATE TYPE "enum_appointment_status" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "enum_alert_type" AS ENUM ('panic_button', 'biometric_anomaly', 'ai_risk');

-- CreateEnum
CREATE TYPE "enum_emotional_state" AS ENUM ('calm', 'anxious', 'sad', 'euphoric', 'other');

-- CreateTable
CREATE TABLE "remote_institutions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_users" (
    "id" SERIAL NOT NULL,
    "institution_id" INTEGER,
    "full_name" VARCHAR(255),
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "role" "enum_role",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_student_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_code" VARCHAR(255),
    "primary_diagnosis" VARCHAR(255),
    "assigned_doctor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_band_devices" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "device_code" VARCHAR(255),
    "binding_status" BOOLEAN,
    "last_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_band_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_biometric_records" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER,
    "avg_heart_rate" INTEGER,
    "stress_level" DOUBLE PRECISION,
    "sleep_quality_hours" DOUBLE PRECISION,
    "blood_oxygen" INTEGER,
    "systolic_blood_pressure" INTEGER,
    "diastolic_blood_pressure" INTEGER,
    "body_temperature" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_biometric_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_alerts" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "biometric_record_id" INTEGER,
    "alert_type" "enum_alert_type",
    "description" VARCHAR(255),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_emotional_journal" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "biometric_record_id" INTEGER,
    "entry_type" "enum_entry_type",
    "user_content" TEXT,
    "ai_response" TEXT,
    "detected_alert_level" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_emotional_journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_appointments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "doctor_id" INTEGER,
    "session_title" VARCHAR(255),
    "session_type" VARCHAR(255),
    "appointment_date" TIMESTAMP(3),
    "status" "enum_appointment_status",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_clinical_notes" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "doctor_id" INTEGER,
    "student_id" INTEGER,
    "session_diagnosis" VARCHAR(255),
    "observed_emotional_state" "enum_emotional_state",
    "observations" TEXT,
    "ai_assistant_analysis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "remote_student_profiles_user_id_key" ON "remote_student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "remote_clinical_notes_appointment_id_key" ON "remote_clinical_notes"("appointment_id");

-- AddForeignKey
ALTER TABLE "remote_users" ADD CONSTRAINT "remote_users_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "remote_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_student_profiles" ADD CONSTRAINT "remote_student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_student_profiles" ADD CONSTRAINT "remote_student_profiles_assigned_doctor_id_fkey" FOREIGN KEY ("assigned_doctor_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_band_devices" ADD CONSTRAINT "remote_band_devices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_biometric_records" ADD CONSTRAINT "remote_biometric_records_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "remote_band_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_alerts" ADD CONSTRAINT "remote_alerts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_alerts" ADD CONSTRAINT "remote_alerts_biometric_record_id_fkey" FOREIGN KEY ("biometric_record_id") REFERENCES "remote_biometric_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_emotional_journal" ADD CONSTRAINT "remote_emotional_journal_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_emotional_journal" ADD CONSTRAINT "remote_emotional_journal_biometric_record_id_fkey" FOREIGN KEY ("biometric_record_id") REFERENCES "remote_biometric_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_appointments" ADD CONSTRAINT "remote_appointments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_appointments" ADD CONSTRAINT "remote_appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_clinical_notes" ADD CONSTRAINT "remote_clinical_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "remote_appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_clinical_notes" ADD CONSTRAINT "remote_clinical_notes_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_clinical_notes" ADD CONSTRAINT "remote_clinical_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
