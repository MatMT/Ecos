-- No new app_private helper needed: the continuity tables reuse can_access_clinical_data
-- (Phase 3), the catalog table reuses current_user_role/current_user_institution_id (Phase 1).

-- ─── remote_treatment_plans ──────────────────────────────────────────────────────────────────
-- Same shape as remote_clinical_records: an ongoing, continuously-revised continuity artifact
-- (not a frozen per-session record like ClinicalNote), so access follows "current assigned
-- therapist" for read AND write via a single FOR ALL policy — deliberately not restricted to
-- whoever originally created the plan. A successor therapist must be able to update/close a
-- plan they didn't create; that's the point of continuity of care. No DELETE grant: closure is
-- an UPDATE (status/ends_at), never a physical delete.

ALTER TABLE public.remote_treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_treatment_plans FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_treatment_plans TO authenticated;
GRANT USAGE ON SEQUENCE remote_treatment_plans_id_seq TO authenticated;

CREATE POLICY treatment_plans_access ON public.remote_treatment_plans FOR ALL USING (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
);

-- ─── remote_treatment_goals ──────────────────────────────────────────────────────────────────
-- student_id is denormalized here (in addition to plan_id) purely so this policy can call
-- can_access_clinical_data(student_id) directly instead of joining into
-- remote_treatment_plans from inside a policy — mirrors remote_clinical_notes denormalizing
-- student_id alongside appointment_id. Same FOR ALL / no-DELETE shape as the parent plan.

ALTER TABLE public.remote_treatment_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_treatment_goals FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_treatment_goals TO authenticated;
GRANT USAGE ON SEQUENCE remote_treatment_goals_id_seq TO authenticated;

CREATE POLICY treatment_goals_access ON public.remote_treatment_goals FOR ALL USING (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
);

-- ─── remote_activities ───────────────────────────────────────────────────────────────────────
-- Shared catalog, not a clinical/per-student resource: institution_id NULL = ECOS-wide global
-- entry, non-NULL = one institution's own addition. technical-guide.en.md §6 places "catalogs"
-- under the ADMINISTRATOR's main actions (not the psychologist's) — so unlike a psychologist's
-- own schedule (remote_therapist_schedules: self-or-admin), there is no "self" branch here at
-- all: every write is an administrator action, gated by role + institution, per AGENTS.md §11
-- point 4 ("role + institution + relationship, never role alone").
--
-- SELECT is deliberately broader than write: any non-student authenticated user may read a
-- visible catalog entry (their own institution's rows, plus every global row), since a
-- psychologist needs to browse the catalog to assign from it even though only an administrator
-- curates it.
--
-- INSERT/UPDATE intentionally do NOT reuse the SELECT predicate. "institution_id IS NULL OR
-- institution_id = current_user_institution_id()" is safe in a USING clause (it constrains
-- which EXISTING rows are visible) but unsafe in a WITH CHECK clause: WITH CHECK evaluates
-- against the NEW row, so "institution_id IS NULL" would be trivially true for any admin
-- inserting/updating a row with a null institution_id, letting a single institution's admin
-- create or edit ECOS-wide global catalog entries visible to every other institution. Both
-- write policies instead force institution_id to be non-null and equal to the caller's own
-- institution — global (NULL) rows are curated data, not administrator-writable via this API.

ALTER TABLE public.remote_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_activities FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_activities TO authenticated;
GRANT USAGE ON SEQUENCE remote_activities_id_seq TO authenticated;

CREATE POLICY activities_select ON public.remote_activities FOR SELECT USING (
  (SELECT app_private.current_user_role()) IN ('psychologist', 'administrator')
  AND (
    institution_id IS NULL
    OR institution_id = (SELECT app_private.current_user_institution_id())
  )
);

CREATE POLICY activities_insert ON public.remote_activities FOR INSERT WITH CHECK (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND institution_id = (SELECT app_private.current_user_institution_id())
);

CREATE POLICY activities_update ON public.remote_activities FOR UPDATE USING (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND institution_id = (SELECT app_private.current_user_institution_id())
) WITH CHECK (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND institution_id = (SELECT app_private.current_user_institution_id())
);

-- ─── remote_student_activities ───────────────────────────────────────────────────────────────
-- Same continuity model as remote_treatment_plans/remote_treatment_goals: the row's own
-- therapist_id (nullable — an 'ecos'-origin row may have none) is NOT the access key, current
-- assignment is. This also means the model correctly doesn't care whether origin is
-- 'psychologist' or 'ecos': whoever is currently treating the student can read/manage every
-- assigned activity regardless of who or what assigned it.

ALTER TABLE public.remote_student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_student_activities FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_student_activities TO authenticated;
GRANT USAGE ON SEQUENCE remote_student_activities_id_seq TO authenticated;

CREATE POLICY student_activities_access ON public.remote_student_activities FOR ALL USING (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
);
