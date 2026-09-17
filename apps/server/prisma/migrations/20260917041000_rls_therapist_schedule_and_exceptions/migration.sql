-- ─── remote_therapist_schedules ─────────────────────────────────────────────
-- Self or admin, for every operation, INCLUDING DELETE — unlike Phase 1's history
-- tables (TherapistAssignment/PsychologistProfile), a schedule block is operational
-- configuration: deleting a stale block doesn't compromise any clinical/assignment
-- history. No app_private helper needed beyond what Phase 1 already added
-- (current_user_role/institution_id_for_user).

ALTER TABLE public.remote_therapist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_therapist_schedules FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_therapist_schedules TO authenticated;
GRANT USAGE ON SEQUENCE remote_therapist_schedules_id_seq TO authenticated;

CREATE POLICY therapist_schedules_access ON public.remote_therapist_schedules FOR ALL USING (
  therapist_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(therapist_id))
        = (SELECT app_private.current_user_institution_id())
  )
) WITH CHECK (
  therapist_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(therapist_id))
        = (SELECT app_private.current_user_institution_id())
  )
);

-- ─── remote_therapist_schedule_exceptions ───────────────────────────────────
-- Same shape — the therapist's own calendar exceptions.

ALTER TABLE public.remote_therapist_schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_therapist_schedule_exceptions FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_therapist_schedule_exceptions TO authenticated;
GRANT USAGE ON SEQUENCE remote_therapist_schedule_exceptions_id_seq TO authenticated;

CREATE POLICY therapist_schedule_exceptions_access ON public.remote_therapist_schedule_exceptions FOR ALL USING (
  therapist_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(therapist_id))
        = (SELECT app_private.current_user_institution_id())
  )
) WITH CHECK (
  therapist_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(therapist_id))
        = (SELECT app_private.current_user_institution_id())
  )
);
