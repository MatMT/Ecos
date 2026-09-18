-- No new app_private helper needed: reuses can_access_student_profile (Phase 1, self/assigned-
-- doctor/admin) and can_access_clinical_data (Phase 3, assigned-therapist-only, no admin/self).

-- ─── remote_alerts ────────────────────────────────────────────────────────────────────────────
-- The existing alerts_access policy bundled self/doctor/admin into one FOR ALL policy — correct
-- for reads (a student should see their own panic-button/anomaly alerts) but too broad now that
-- the new lifecycle fields (priority/status/review/close) are inherently a professional action.
-- Split: SELECT/INSERT stay exactly as before (self/doctor/admin — a student must still be able
-- to see and self-report their own alerts). UPDATE narrows to can_access_clinical_data
-- (assigned-therapist-only, no admin, no self) — reviewing/closing an alert is a clinical
-- judgment call, same bucket as clinical notes/records/plans/activities, not an operational
-- admin task (technical-guide.en.md's role table puts "alerts" under the psychologist's "related
-- clinical resources," not the administrator's row). Also revokes DELETE, matching every other
-- clinical-ish table already corrected this way (no physical deletes).

DROP POLICY IF EXISTS alerts_access ON public.remote_alerts;
REVOKE DELETE ON public.remote_alerts FROM authenticated;

CREATE POLICY alerts_select ON public.remote_alerts FOR SELECT USING (
  student_id IS NOT NULL AND (SELECT app_private.can_access_student_profile(student_id))
);

CREATE POLICY alerts_insert ON public.remote_alerts FOR INSERT WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.can_access_student_profile(student_id))
);

CREATE POLICY alerts_update ON public.remote_alerts FOR UPDATE USING (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id))
);

-- ─── remote_alert_actions ─────────────────────────────────────────────────────────────────────
-- "Only an authorized professional for the associated patient" (technical-guide.en.md §9) — but
-- SELECT mirrors clinical_notes_select's "author OR current-assigned" shape, not a flat
-- can_access_clinical_data check, so a prior therapist who logged an action keeps seeing it after
-- reassignment (continuity of care, same reasoning as clinical notes). INSERT pins
-- therapist_id = caller: without this, any assigned therapist could log an action under a
-- different therapist's identity, undermining the audit trail this table exists for. No
-- UPDATE/DELETE grant at all — append-only, matching remote_audit_logs exactly (no updated_at
-- column either).

ALTER TABLE public.remote_alert_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_alert_actions FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.remote_alert_actions TO authenticated;
GRANT USAGE ON SEQUENCE remote_alert_actions_id_seq TO authenticated;

CREATE POLICY alert_actions_select ON public.remote_alert_actions FOR SELECT USING (
  therapist_id = (SELECT auth.uid())
  OR (student_id IS NOT NULL AND (SELECT app_private.can_access_clinical_data(student_id)))
);

CREATE POLICY alert_actions_insert ON public.remote_alert_actions FOR INSERT WITH CHECK (
  therapist_id = (SELECT auth.uid())
  AND student_id IS NOT NULL
  AND (SELECT app_private.can_access_clinical_data(student_id))
);
