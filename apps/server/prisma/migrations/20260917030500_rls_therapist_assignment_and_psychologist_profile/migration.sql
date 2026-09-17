-- ─── New helper: institution of the student behind a studentId ─────────────
-- Reusable across TherapistAssignment's insert/update checks and future studentId-keyed
-- tables (TreatmentPlan, StudentActivity, ...). Created directly in app_private (it already
-- exists as of move_rls_helpers_to_private_schema) — never in public.

CREATE OR REPLACE FUNCTION app_private.institution_id_for_student(target_student_id integer)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT u.institution_id
  FROM public.remote_student_profiles sp
  JOIN public.remote_users u ON u.id = sp.user_id
  WHERE sp.id = target_student_id;
$$;

REVOKE EXECUTE ON FUNCTION app_private.institution_id_for_student(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.institution_id_for_student(integer) TO authenticated;

-- ─── remote_therapist_assignments ───────────────────────────────────────────
-- History table: no DELETE grant at all — "ending" an assignment is an UPDATE setting
-- ends_at, never a physical delete. Admin-only for every write (insert/update), confirmed
-- with the product owner — no self-service by the assigned therapist in this phase.

ALTER TABLE public.remote_therapist_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_therapist_assignments FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_therapist_assignments TO authenticated;
GRANT USAGE ON SEQUENCE remote_therapist_assignments_id_seq TO authenticated;

CREATE POLICY therapist_assignments_select ON public.remote_therapist_assignments FOR SELECT USING (
  therapist_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_student(student_id))
        = (SELECT app_private.current_user_institution_id())
  )
);

CREATE POLICY therapist_assignments_insert ON public.remote_therapist_assignments FOR INSERT WITH CHECK (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND (SELECT app_private.institution_id_for_student(student_id))
      = (SELECT app_private.current_user_institution_id())
  AND (SELECT app_private.institution_id_for_user(therapist_id))
      = (SELECT app_private.current_user_institution_id())
);

CREATE POLICY therapist_assignments_update ON public.remote_therapist_assignments FOR UPDATE USING (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND (SELECT app_private.institution_id_for_student(student_id))
      = (SELECT app_private.current_user_institution_id())
  AND (SELECT app_private.institution_id_for_user(therapist_id))
      = (SELECT app_private.current_user_institution_id())
);

-- ─── remote_psychologist_profiles ───────────────────────────────────────────
-- No DELETE grant — `active` already provides a soft-disable path; hard-deleting the profile
-- while TherapistAssignment history rows still reference the user would be pure downside.

ALTER TABLE public.remote_psychologist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_psychologist_profiles FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_psychologist_profiles TO authenticated;
GRANT USAGE ON SEQUENCE remote_psychologist_profiles_id_seq TO authenticated;

CREATE POLICY psychologist_profiles_select ON public.remote_psychologist_profiles FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(user_id))
        = (SELECT app_private.current_user_institution_id())
  )
);

CREATE POLICY psychologist_profiles_insert ON public.remote_psychologist_profiles FOR INSERT WITH CHECK (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND (SELECT app_private.institution_id_for_user(user_id))
      = (SELECT app_private.current_user_institution_id())
);

CREATE POLICY psychologist_profiles_update ON public.remote_psychologist_profiles FOR UPDATE USING (
  user_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(user_id))
        = (SELECT app_private.current_user_institution_id())
  )
);

-- RLS is row-level only. Without this trigger, the self-update policy above would let a
-- psychologist silently self-deactivate — active/inactive is an administrative decision, not
-- something a psychologist should be able to flip on their own row. Mirrors
-- protect_privileged_columns's exact shape (see remote_users).
CREATE OR REPLACE FUNCTION app_private.protect_psychologist_profile_active_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF app_private.current_user_role() <> 'administrator' THEN
    IF NEW.active IS DISTINCT FROM OLD.active THEN
      RAISE EXCEPTION 'Solo un administrador puede activar o desactivar el perfil de un terapeuta.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Nothing should ever call this directly (same treatment as protect_privileged_columns) — no
-- grant back to authenticated, it only ever runs as a trigger.
REVOKE EXECUTE ON FUNCTION app_private.protect_psychologist_profile_active_column() FROM PUBLIC, anon;

CREATE TRIGGER remote_psychologist_profiles_protect_active
BEFORE UPDATE ON public.remote_psychologist_profiles
FOR EACH ROW EXECUTE FUNCTION app_private.protect_psychologist_profile_active_column();
