-- CreateTable
CREATE TABLE "remote_treatment_plans" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "therapist_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "general_goal" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_treatment_goals" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "target_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_treatment_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- institution_id nullable: NULL means a global/ECOS-wide catalog entry, non-NULL means one
-- institution's own addition. See the RLS migration for why writes force it non-null anyway.
CREATE TABLE "remote_activities" (
    "id" SERIAL NOT NULL,
    "institution_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_student_activities" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "therapist_id" UUID,
    "origin" VARCHAR(20) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "response" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remote_student_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "remote_treatment_plans_student_id_idx" ON "remote_treatment_plans"("student_id");

-- CreateIndex
CREATE INDEX "remote_treatment_plans_therapist_id_idx" ON "remote_treatment_plans"("therapist_id");

-- CreateIndex
CREATE INDEX "remote_treatment_goals_plan_id_idx" ON "remote_treatment_goals"("plan_id");

-- CreateIndex
CREATE INDEX "remote_treatment_goals_student_id_idx" ON "remote_treatment_goals"("student_id");

-- CreateIndex
CREATE INDEX "remote_activities_institution_id_idx" ON "remote_activities"("institution_id");

-- CreateIndex
CREATE INDEX "remote_student_activities_student_id_idx" ON "remote_student_activities"("student_id");

-- CreateIndex
CREATE INDEX "remote_student_activities_activity_id_idx" ON "remote_student_activities"("activity_id");

-- CreateIndex
CREATE INDEX "remote_student_activities_therapist_id_idx" ON "remote_student_activities"("therapist_id");

-- AddForeignKey
ALTER TABLE "remote_treatment_plans" ADD CONSTRAINT "remote_treatment_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_treatment_plans" ADD CONSTRAINT "remote_treatment_plans_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_treatment_goals" ADD CONSTRAINT "remote_treatment_goals_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "remote_treatment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_treatment_goals" ADD CONSTRAINT "remote_treatment_goals_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_activities" ADD CONSTRAINT "remote_activities_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "remote_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_student_activities" ADD CONSTRAINT "remote_student_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "remote_student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_student_activities" ADD CONSTRAINT "remote_student_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "remote_activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_student_activities" ADD CONSTRAINT "remote_student_activities_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "remote_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
