-- ─── Fix 1: lock down SECURITY DEFINER helper functions ─────────────────────
-- Two separate grants make these callable by `anon` and must both be revoked: (1) the
-- implicit PUBLIC EXECUTE Postgres grants on every new function, and (2) — the one
-- that actually matters here — self-hosted Supabase's own `ALTER DEFAULT PRIVILEGES
-- IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role`,
-- which explicitly grants `anon` EXECUTE on every function `postgres`/`supabase_admin`
-- creates in `public`, independent of the PUBLIC grant. Revoking only from PUBLIC (as
-- an earlier version of this migration did) still left `anon` able to call these
-- directly over PostgREST (POST /rest/v1/rpc/current_user_role, etc.) — confirmed via
-- `has_function_privilege('anon', ...)` still returning true after a PUBLIC-only
-- revoke. These helpers exist purely to be called *from inside* our own RLS policies,
-- so both grants must go. `protect_privileged_columns` is a trigger function — nothing
-- should ever call it directly, so it gets no grant back at all.

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_institution_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.institution_id_for_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_student_profile(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_privileged_columns() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_institution_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.institution_id_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_student_profile(integer) TO authenticated;

-- ─── Fix 2: stop re-evaluating auth.*()/helpers per row ─────────────────────
-- Wrapping a call as `(select auth.uid())` lets Postgres plan it as an InitPlan
-- (evaluated once per statement) instead of once per row scanned — flagged by
-- Supabase's advisor as a real performance issue at scale. Re-create every function
-- and policy that referenced auth.uid()/another helper directly, wrapped this way.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS "enum_role"
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.remote_users WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.current_user_institution_id()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT institution_id FROM public.remote_users WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.institution_id_for_user(target_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT institution_id FROM public.remote_users WHERE id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_student_profile(target_student_id integer)
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
        OR (u.institution_id = (SELECT public.current_user_institution_id())
            AND (SELECT public.current_user_role()) = 'administrator')
      )
  );
$$;

-- New: same as can_access_student_profile but WITHOUT the self-access branch —
-- clinical notes are doctor/admin-only by design, never student-readable.
CREATE OR REPLACE FUNCTION public.can_access_clinical_data(target_student_id integer)
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
        OR (u.institution_id = (SELECT public.current_user_institution_id())
            AND (SELECT public.current_user_role()) = 'administrator')
      )
  );
$$;

-- Brand-new function: CREATE (OR REPLACE, on first creation) picks up both the default
-- PUBLIC grant and Supabase's ALTER DEFAULT PRIVILEGES grant to anon (see Fix 1) —
-- revoke both before granting narrowly.
REVOKE EXECUTE ON FUNCTION public.can_access_clinical_data(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_clinical_data(integer) TO authenticated;

-- Re-create the flagged policies with the same (select ...) wrapping.

DROP POLICY IF EXISTS remote_users_select ON public.remote_users;
CREATE POLICY remote_users_select ON public.remote_users FOR SELECT USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.remote_student_profiles sp
    WHERE sp.user_id = remote_users.id AND sp.assigned_doctor_id = (SELECT auth.uid())
  )
  OR (
    (SELECT public.current_user_role()) = 'administrator'
    AND institution_id = (SELECT public.current_user_institution_id())
  )
);

DROP POLICY IF EXISTS remote_users_insert ON public.remote_users;
CREATE POLICY remote_users_insert ON public.remote_users FOR INSERT WITH CHECK (
  (SELECT public.current_user_role()) = 'administrator'
  AND institution_id = (SELECT public.current_user_institution_id())
);

DROP POLICY IF EXISTS remote_users_update ON public.remote_users;
CREATE POLICY remote_users_update ON public.remote_users FOR UPDATE USING (
  id = (SELECT auth.uid())
  OR (
    (SELECT public.current_user_role()) = 'administrator'
    AND institution_id = (SELECT public.current_user_institution_id())
  )
);

DROP POLICY IF EXISTS remote_users_delete ON public.remote_users;
CREATE POLICY remote_users_delete ON public.remote_users FOR DELETE USING (
  (SELECT public.current_user_role()) = 'administrator'
  AND institution_id = (SELECT public.current_user_institution_id())
);

DROP POLICY IF EXISTS student_profiles_select ON public.remote_student_profiles;
CREATE POLICY student_profiles_select ON public.remote_student_profiles FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR assigned_doctor_id = (SELECT auth.uid())
  OR (
    (SELECT public.current_user_role()) = 'administrator'
    AND (SELECT public.institution_id_for_user(remote_student_profiles.user_id))
        = (SELECT public.current_user_institution_id())
  )
);

DROP POLICY IF EXISTS student_profiles_insert ON public.remote_student_profiles;
CREATE POLICY student_profiles_insert ON public.remote_student_profiles FOR INSERT WITH CHECK (
  (SELECT public.current_user_role()) = 'administrator'
  AND (SELECT public.institution_id_for_user(user_id)) = (SELECT public.current_user_institution_id())
);

DROP POLICY IF EXISTS student_profiles_update ON public.remote_student_profiles;
CREATE POLICY student_profiles_update ON public.remote_student_profiles FOR UPDATE USING (
  assigned_doctor_id = (SELECT auth.uid())
  OR (
    (SELECT public.current_user_role()) = 'administrator'
    AND (SELECT public.institution_id_for_user(remote_student_profiles.user_id))
        = (SELECT public.current_user_institution_id())
  )
);

DROP POLICY IF EXISTS student_profiles_delete ON public.remote_student_profiles;
CREATE POLICY student_profiles_delete ON public.remote_student_profiles FOR DELETE USING (
  (SELECT public.current_user_role()) = 'administrator'
  AND (SELECT public.institution_id_for_user(remote_student_profiles.user_id))
      = (SELECT public.current_user_institution_id())
);

DROP POLICY IF EXISTS biometric_records_access ON public.remote_biometric_records;
CREATE POLICY biometric_records_access ON public.remote_biometric_records FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.remote_band_devices bd
    WHERE bd.id = remote_biometric_records.device_id
      AND (SELECT public.can_access_student_profile(bd.student_id))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.remote_band_devices bd
    WHERE bd.id = remote_biometric_records.device_id
      AND (SELECT public.can_access_student_profile(bd.student_id))
  )
);

-- ─── Fix 3: lock down public._prisma_migrations ─────────────────────────────
-- Prisma's own bookkeeping table. The app never touches it; only `prisma migrate`
-- does, connected as the postgres superuser (bypasses RLS). Enabling RLS with zero
-- policies and zero grants makes it fully inaccessible via the exposed API.

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations FORCE ROW LEVEL SECURITY;

-- ─── Fix 4: remote_institutions ──────────────────────────────────────────────
-- Reference data. Any signed-in user may read it (needed to render institution
-- names); only postgres/service_role manage it directly for now — no
-- insert/update/delete policy for `authenticated` means those stay fully denied.

ALTER TABLE public.remote_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_institutions FORCE ROW LEVEL SECURITY;

GRANT SELECT ON public.remote_institutions TO authenticated;

CREATE POLICY institutions_select ON public.remote_institutions FOR SELECT USING (
  (SELECT auth.uid()) IS NOT NULL
);

-- ─── Fix 5: remote_band_devices ──────────────────────────────────────────────
-- This table already had a bare `GRANT SELECT ... TO authenticated` (added earlier
-- only to support the biometric_records join) with RLS never enabled — meaning any
-- authenticated user could read every device row. Enabling RLS now actually
-- restricts it for the first time.

ALTER TABLE public.remote_band_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_band_devices FORCE ROW LEVEL SECURITY;

GRANT INSERT, UPDATE, DELETE ON public.remote_band_devices TO authenticated;
GRANT USAGE ON SEQUENCE remote_band_devices_id_seq TO authenticated;

CREATE POLICY band_devices_access ON public.remote_band_devices FOR ALL USING (
  student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id))
);

-- ─── Fix 6: remote_alerts ─────────────────────────────────────────────────────
-- Self/assigned-doctor/admin, same as biometrics — a student should see their own
-- panic-button/anomaly alerts.

ALTER TABLE public.remote_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_alerts FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_alerts TO authenticated;
GRANT USAGE ON SEQUENCE remote_alerts_id_seq TO authenticated;

CREATE POLICY alerts_access ON public.remote_alerts FOR ALL USING (
  student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id))
);

-- ─── Fix 7: remote_emotional_journal ─────────────────────────────────────────
-- A student's own journal/AI-chat entries — self access is intentional here.

ALTER TABLE public.remote_emotional_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_emotional_journal FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_emotional_journal TO authenticated;
GRANT USAGE ON SEQUENCE remote_emotional_journal_id_seq TO authenticated;

CREATE POLICY emotional_journal_access ON public.remote_emotional_journal FOR ALL USING (
  student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id))
) WITH CHECK (
  student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id))
);

-- ─── Fix 8: remote_appointments ──────────────────────────────────────────────
-- Self/assigned-doctor/admin via can_access_student_profile, PLUS the specific
-- doctor conducting this appointment (Appointment.doctorId can differ from the
-- student's assigned doctor — the schema clearly allows another clinician to hold
-- a session, so that doctor needs access to appointments they're actually running).

ALTER TABLE public.remote_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_appointments FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_appointments TO authenticated;
GRANT USAGE ON SEQUENCE remote_appointments_id_seq TO authenticated;

CREATE POLICY appointments_access ON public.remote_appointments FOR ALL USING (
  doctor_id = (SELECT auth.uid())
  OR (student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id)))
) WITH CHECK (
  doctor_id = (SELECT auth.uid())
  OR (student_id IS NOT NULL AND (SELECT public.can_access_student_profile(student_id)))
);

-- ─── Fix 9: remote_clinical_notes ────────────────────────────────────────────
-- Doctor/admin only, per the confirmed access model — students never read their own
-- clinical notes. Uses can_access_clinical_data (no self branch), plus the specific
-- authoring doctor, same rationale as appointments.

ALTER TABLE public.remote_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_clinical_notes FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_clinical_notes TO authenticated;
GRANT USAGE ON SEQUENCE remote_clinical_notes_id_seq TO authenticated;

CREATE POLICY clinical_notes_access ON public.remote_clinical_notes FOR ALL USING (
  doctor_id = (SELECT auth.uid())
  OR (student_id IS NOT NULL AND (SELECT public.can_access_clinical_data(student_id)))
) WITH CHECK (
  doctor_id = (SELECT auth.uid())
  OR (student_id IS NOT NULL AND (SELECT public.can_access_clinical_data(student_id)))
);
