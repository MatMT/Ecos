-- ─── New helper: is the caller the owner of this student profile? ────────────────────────────
-- Self-only (no assigned-doctor, no admin branch) — used to gate INSERT/UPDATE on
-- remote_shared_patient_content, where only the patient who owns the content may write it.
-- Neither existing helper fits: can_access_student_profile is self+assigned-doctor+admin,
-- can_access_clinical_data is assigned-doctor-only (no self, no admin).

CREATE OR REPLACE FUNCTION app_private.is_students_own_profile(target_student_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.remote_student_profiles sp
    WHERE sp.id = target_student_id
      AND sp.user_id = (SELECT auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION app_private.is_students_own_profile(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.is_students_own_profile(integer) TO authenticated;

-- ─── remote_shared_patient_content ────────────────────────────────────────────────────────────
-- SELECT: self OR the specific named therapist_id (author-style continuity, same shape as
-- clinical_notes_select/alert_actions_select — a patient shared this with a specific person, who
-- keeps seeing it even after reassignment) OR the current assigned therapist
-- (can_access_clinical_data). No admin branch — technical-guide.en.md §12: an administrator "must
-- not automatically get access to... shared content." Self must be in SELECT for a structural
-- reason, not just policy: without it, the student's own INSERT...RETURNING would fail outright
-- (AGENTS.md §11 point 9 — the same bug hit and fixed for remote_audit_logs in Phase 3).
--
-- INSERT/UPDATE: self-only (is_students_own_profile) — sharing and revoking are always the
-- patient's own decision, never on their behalf. No DELETE grant: revocation is a soft
-- revoked_at write, matching every other clinical-ish table's no-physical-delete posture.

ALTER TABLE public.remote_shared_patient_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_shared_patient_content FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_shared_patient_content TO authenticated;
GRANT USAGE ON SEQUENCE remote_shared_patient_content_id_seq TO authenticated;

CREATE POLICY shared_patient_content_select ON public.remote_shared_patient_content FOR SELECT USING (
  (SELECT app_private.is_students_own_profile(student_id))
  OR therapist_id = (SELECT auth.uid())
  OR (SELECT app_private.can_access_clinical_data(student_id))
);

CREATE POLICY shared_patient_content_insert ON public.remote_shared_patient_content FOR INSERT WITH CHECK (
  (SELECT app_private.is_students_own_profile(student_id))
);

CREATE POLICY shared_patient_content_update ON public.remote_shared_patient_content FOR UPDATE USING (
  (SELECT app_private.is_students_own_profile(student_id))
) WITH CHECK (
  (SELECT app_private.is_students_own_profile(student_id))
);

-- RLS's UPDATE policy only says WHO may update (the owning student) — it can't say WHAT they may
-- change. Since the row is meant to stay an immutable snapshot once shared (technical-guide.en.md
-- §3.10), this trigger closes the gap so the only column an update can actually change is
-- revoked_at. Mirrors protect_psychologist_profile_active_column's exact shape.

CREATE OR REPLACE FUNCTION app_private.protect_shared_patient_content_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content
     OR NEW.content_type IS DISTINCT FROM OLD.content_type
     OR NEW.source_local_id IS DISTINCT FROM OLD.source_local_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.therapist_id IS DISTINCT FROM OLD.therapist_id
     OR NEW.shared_at IS DISTINCT FROM OLD.shared_at THEN
    RAISE EXCEPTION 'El contenido compartido es una instantánea inmutable; solo puede revocarse.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION app_private.protect_shared_patient_content_snapshot() FROM PUBLIC, anon;

CREATE TRIGGER remote_shared_patient_content_protect_snapshot
BEFORE UPDATE ON public.remote_shared_patient_content
FOR EACH ROW EXECUTE FUNCTION app_private.protect_shared_patient_content_snapshot();
