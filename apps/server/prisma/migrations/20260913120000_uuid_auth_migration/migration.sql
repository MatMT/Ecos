-- Reconcile enum drift: schema.prisma already used "psychologist"; the DB still had "doctor"
-- from the init migration. Safe to rename in place (no rows exist yet).
ALTER TYPE "enum_role" RENAME VALUE 'doctor' TO 'psychologist';

-- DropForeignKey
ALTER TABLE "remote_appointments" DROP CONSTRAINT "remote_appointments_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "remote_clinical_notes" DROP CONSTRAINT "remote_clinical_notes_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "remote_student_profiles" DROP CONSTRAINT "remote_student_profiles_assigned_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "remote_student_profiles" DROP CONSTRAINT "remote_student_profiles_user_id_fkey";

-- AlterTable: User-referencing columns move from Int to Uuid, matching auth.users.id
ALTER TABLE "remote_appointments" DROP COLUMN "doctor_id",
ADD COLUMN     "doctor_id" UUID;

-- AlterTable
ALTER TABLE "remote_clinical_notes" DROP COLUMN "doctor_id",
ADD COLUMN     "doctor_id" UUID;

-- AlterTable
ALTER TABLE "remote_student_profiles" DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "assigned_doctor_id",
ADD COLUMN     "assigned_doctor_id" UUID;

-- AlterTable: remote_users.id becomes the Supabase Auth (GoTrue) user id — no local default,
-- no more password_hash (GoTrue owns credential storage now).
ALTER TABLE "remote_users" DROP CONSTRAINT "remote_users_pkey",
DROP COLUMN "password_hash",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "remote_users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "remote_student_profiles_user_id_key" ON "remote_student_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "remote_student_profiles" ADD CONSTRAINT "remote_student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_student_profiles" ADD CONSTRAINT "remote_student_profiles_assigned_doctor_id_fkey" FOREIGN KEY ("assigned_doctor_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_appointments" ADD CONSTRAINT "remote_appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_clinical_notes" ADD CONSTRAINT "remote_clinical_notes_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: bridge into Supabase Auth's auth.users. Not modeled in schema.prisma because
-- Prisma does not own/manage the auth schema (GoTrue does) — this FK is maintained by hand in
-- migration SQL only. Deleting a GoTrue user cascades to their ECOS profile row.
ALTER TABLE "remote_users"
  ADD CONSTRAINT "remote_users_id_fkey"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;
