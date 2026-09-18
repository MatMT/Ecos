-- ─── Design correction: can_access_clinical_data no longer grants institution admins access ──
-- Phase 1 gave any institution administrator read/write access to every student's clinical
-- notes (institution-match + role=administrator branch). technical-guide.en.md §12 already
-- states an administrator "must not automatically get access to therapeutic notes, history, or
-- shared content." Its only consumer today is remote_clinical_notes, which has zero application
-- endpoints yet — narrowing it now is non-breaking and implements the already-decided principle.
-- CREATE OR REPLACE preserves the function's OID, so the (about to be rewritten) policy below
-- keeps working with zero extra edits regardless of ordering within this file.

CREATE OR REPLACE FUNCTION app_private.can_access_clinical_data(target_student_id integer)
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
      AND sp.assigned_doctor_id = (SELECT auth.uid())
  );
$$;

-- ─── remote_clinical_notes: split FOR ALL into SELECT/INSERT/UPDATE, no DELETE ──────────────
-- SELECT: author OR the student's current assigned therapist (continuity of care).
-- INSERT: the row's own doctor_id must be the caller — not "any assigned therapist", since
--   Appointment.doctorId can already differ from the student's assigned doctor (a covering
--   clinician holding the session), and ClinicalNote.doctorId is derived from the appointment.
-- UPDATE: original author only — a later/different therapist can read prior notes but not edit
--   them. WITH CHECK on UPDATE also blocks reassigning doctor_id away from the caller.
-- No DELETE grant at all: no physical deletes, soft-void via voided_at/voided_by_id/void_reason.

DROP POLICY IF EXISTS clinical_notes_access ON public.remote_clinical_notes;

REVOKE DELETE ON public.remote_clinical_notes FROM authenticated;

CREATE POLICY clinical_notes_select ON public.remote_clinical_notes FOR SELECT USING (
  doctor_id = (SELECT auth.uid())
  OR (student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id)))
);

CREATE POLICY clinical_notes_insert ON public.remote_clinical_notes FOR INSERT WITH CHECK (
  doctor_id = (SELECT auth.uid())
);

CREATE POLICY clinical_notes_update ON public.remote_clinical_notes FOR UPDATE USING (
  doctor_id = (SELECT auth.uid())
) WITH CHECK (
  doctor_id = (SELECT auth.uid())
);

-- ─── remote_clinical_records ──────────────────────────────────────────────────────────────────
-- One continuously-evolving document per student (not a discrete per-session artifact like
-- ClinicalNote), so access follows "current assigned therapist" for read AND write — a single
-- FOR ALL policy, deliberately not restricted to whoever originally opened the record. No DELETE
-- grant: same no-physical-delete posture as every other clinical table.

ALTER TABLE public.remote_clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_clinical_records FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.remote_clinical_records TO authenticated;
GRANT USAGE ON SEQUENCE remote_clinical_records_id_seq TO authenticated;

CREATE POLICY clinical_records_access ON public.remote_clinical_records FOR ALL USING (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
);

-- ─── remote_audit_logs ─────────────────────────────────────────────────────────────────────────
-- Append-only. INSERT: every audit row's actor is always the caller (services never write an
-- audit row on someone else's behalf), so user_id = auth.uid() is both simplest and correct — no
-- privileged bypass needed for this phase. SELECT: institution administrators only, scoped to
-- their own institution. No UPDATE/DELETE grant at all.

ALTER TABLE public.remote_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_audit_logs FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.remote_audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE remote_audit_logs_id_seq TO authenticated;

CREATE POLICY audit_logs_insert ON public.remote_audit_logs FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY audit_logs_select ON public.remote_audit_logs FOR SELECT USING (
  (SELECT app_private.current_user_role()) = 'administrator'
  AND institution_id = (SELECT app_private.current_user_institution_id())
);
