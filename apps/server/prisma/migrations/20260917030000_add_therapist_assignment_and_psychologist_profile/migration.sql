-- CreateTable
CREATE TABLE "remote_therapist_assignments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "therapist_id" UUID NOT NULL,
    "assigned_by_id" UUID,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_therapist_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_psychologist_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "professional_license" VARCHAR(100),
    "specialty" VARCHAR(255),
    "phone" VARCHAR(50),
    "default_session_minutes" INTEGER NOT NULL DEFAULT 60,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_psychologist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "remote_therapist_assignments_student_id_idx" ON "remote_therapist_assignments"("student_id");

-- CreateIndex
CREATE INDEX "remote_therapist_assignments_therapist_id_idx" ON "remote_therapist_assignments"("therapist_id");

-- CreateIndex
CREATE INDEX "remote_therapist_assignments_assigned_by_id_idx" ON "remote_therapist_assignments"("assigned_by_id");

-- CreateIndex: business invariant "at most one active primary assignment per student". Not
-- representable in schema.prisma (no partial-index preview feature enabled) — this is the
-- race-safe source of truth for the invariant; TherapistAssignmentsService independently checks
-- for an existing active primary before inserting, which is what makes actually hitting this
-- constraint unlikely in practice, not a substitute for it. A violation surfaces as a normal
-- Postgres 23505 -> Prisma P2002 -> PrismaExceptionFilter already maps that to 409.
CREATE UNIQUE INDEX "remote_therapist_assignments_active_primary_per_student"
  ON "remote_therapist_assignments"("student_id")
  WHERE "ends_at" IS NULL AND "is_primary";

-- CreateIndex
CREATE UNIQUE INDEX "remote_psychologist_profiles_user_id_key" ON "remote_psychologist_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "remote_therapist_assignments" ADD CONSTRAINT "remote_therapist_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_therapist_assignments" ADD CONSTRAINT "remote_therapist_assignments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_therapist_assignments" ADD CONSTRAINT "remote_therapist_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_psychologist_profiles" ADD CONSTRAINT "remote_psychologist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
