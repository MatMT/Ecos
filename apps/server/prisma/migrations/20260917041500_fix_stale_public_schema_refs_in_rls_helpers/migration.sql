-- Bug found live while testing Phase 2's appointments module (not introduced by Phase 2):
-- `20260913151000_move_rls_helpers_to_private_schema` moved six helper functions from
-- `public` to `app_private` via `ALTER FUNCTION ... SET SCHEMA app_private`, which relocates
-- the function object but does NOT rewrite the function's own body text. Two of the moved
-- functions — can_access_student_profile and can_access_clinical_data — call two OTHER
-- moved functions (current_user_institution_id, current_user_role) using an explicit
-- `public.` qualifier hardcoded in their SQL body. After the move, `public.
-- current_user_institution_id()` no longer resolves to anything (confirmed via
-- pg_get_functiondef: the stale `public.` prefix is still literally in the stored body) —
-- any policy evaluation that reaches the admin-institution-match branch of either function
-- fails outright with "function public.current_user_institution_id() does not exist".
--
-- This affects every RLS policy that calls these two helpers for a non-owner/non-assigned-
-- doctor caller: remote_band_devices, remote_biometric_records, remote_alerts,
-- remote_emotional_journal, remote_appointments (via can_access_student_profile), and
-- remote_clinical_notes (via can_access_clinical_data). It was latent since that migration —
-- nothing exercised the admin branch of either function until Phase 2's appointments module
-- was tested live against a caller other than the exact assigned doctor.
--
-- Fix: CREATE OR REPLACE with the qualifier corrected to app_private. Preserves each
-- function's OID (same as any CREATE OR REPLACE), so the policies referencing them by OID
-- keep working with zero edits — same reasoning already documented for the original move.

CREATE OR REPLACE FUNCTION app_private.can_access_student_profile(target_student_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.remote_student_profiles sp
    JOIN public.remote_users u ON u.id = sp.user_id
    WHERE sp.id = target_student_id
      AND (
        sp.user_id = (SELECT auth.uid())
        OR sp.assigned_doctor_id = (SELECT auth.uid())
        OR (u.institution_id = (SELECT app_private.current_user_institution_id())
            AND (SELECT app_private.current_user_role()) = 'administrator')
      )
  );
$$;

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
    JOIN public.remote_users u ON u.id = sp.user_id
    WHERE sp.id = target_student_id
      AND (
        sp.assigned_doctor_id = (SELECT auth.uid())
        OR (u.institution_id = (SELECT app_private.current_user_institution_id())
            AND (SELECT app_private.current_user_role()) = 'administrator')
      )
  );
$$;
