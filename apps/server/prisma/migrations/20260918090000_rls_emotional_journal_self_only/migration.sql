-- Bug found during Phase 8 hardening review (flagged in docs/clinical-panel/GOALS.md §5, not new):
-- remote_emotional_journal's RLS used can_access_student_profile (self + assigned doctor +
-- institution admin) — broader than the stated principle that "EmotionalJournal stays
-- mobile-only, the panel never reads it directly; only SharedPatientContent is panel-visible."
-- No panel code has ever queried this table (confirmed by search across every phase), so
-- narrowing it now is non-breaking. Reuses is_students_own_profile (added in Phase 6 for
-- remote_shared_patient_content) — no new helper function needed. DELETE grant is left
-- untouched; that's a separate, unflagged concern, not part of this specific fix.

DROP POLICY IF EXISTS emotional_journal_access ON public.remote_emotional_journal;

CREATE POLICY emotional_journal_select ON public.remote_emotional_journal FOR SELECT USING (
  student_id IS NOT NULL AND (SELECT app_private.is_students_own_profile(student_id))
);

CREATE POLICY emotional_journal_insert ON public.remote_emotional_journal FOR INSERT WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.is_students_own_profile(student_id))
);

CREATE POLICY emotional_journal_update ON public.remote_emotional_journal FOR UPDATE USING (
  student_id IS NOT NULL AND (SELECT app_private.is_students_own_profile(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.is_students_own_profile(student_id))
);
