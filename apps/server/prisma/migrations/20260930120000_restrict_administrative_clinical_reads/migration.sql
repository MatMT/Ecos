-- Clinical visibility is intentionally separate from administrative patient management.
-- Administrators retain institution-scoped patient and appointment operations, but must not
-- read or mutate alerts, biometric telemetry, or band-device data solely through that role.
-- Students retain ownership access for their mobile flows; the currently assigned psychologist
-- retains the clinical access supplied by app_private.can_access_clinical_data.

-- ─── remote_band_devices ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS band_devices_access ON public.remote_band_devices;
REVOKE DELETE ON public.remote_band_devices FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.remote_band_devices TO authenticated;

CREATE POLICY band_devices_select ON public.remote_band_devices FOR SELECT USING (
  student_id IS NOT NULL
  AND (
    (SELECT app_private.is_students_own_profile(student_id))
    OR (SELECT app_private.can_access_clinical_data(student_id))
  )
);

CREATE POLICY band_devices_insert ON public.remote_band_devices FOR INSERT WITH CHECK (
  student_id IS NOT NULL
  AND (
    (SELECT app_private.is_students_own_profile(student_id))
    OR (SELECT app_private.can_access_clinical_data(student_id))
  )
);

CREATE POLICY band_devices_update ON public.remote_band_devices FOR UPDATE USING (
  student_id IS NOT NULL
  AND (
    (SELECT app_private.is_students_own_profile(student_id))
    OR (SELECT app_private.can_access_clinical_data(student_id))
  )
) WITH CHECK (
  student_id IS NOT NULL
  AND (
    (SELECT app_private.is_students_own_profile(student_id))
    OR (SELECT app_private.can_access_clinical_data(student_id))
  )
);

-- ─── remote_biometric_records ────────────────────────────────────────────────────────────────

-- Biometric records only store device_id. Resolve its owner in a SECURITY DEFINER helper rather
-- than querying the RLS-protected band table from a policy, which would otherwise create a fragile
-- policy dependency and can recurse when policies evolve.
CREATE OR REPLACE FUNCTION app_private.can_access_biometric_device(target_device_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.remote_band_devices AS band_device
    WHERE band_device.id = target_device_id
      AND (
        (SELECT app_private.is_students_own_profile(band_device.student_id))
        OR (SELECT app_private.can_access_clinical_data(band_device.student_id))
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION app_private.can_access_biometric_device(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.can_access_biometric_device(integer) TO authenticated;

DROP POLICY IF EXISTS biometric_records_access ON public.remote_biometric_records;
REVOKE UPDATE, DELETE ON public.remote_biometric_records FROM authenticated;
GRANT SELECT, INSERT ON public.remote_biometric_records TO authenticated;

CREATE POLICY biometric_records_select ON public.remote_biometric_records FOR SELECT USING (
  (SELECT app_private.can_access_biometric_device(device_id))
);

CREATE POLICY biometric_records_insert ON public.remote_biometric_records FOR INSERT WITH CHECK (
  (SELECT app_private.can_access_biometric_device(device_id))
);

-- ─── remote_alerts ───────────────────────────────────────────────────────────────────────────

-- Phase 2.5 already restricted lifecycle updates to the assigned psychologist. The SELECT and
-- INSERT policies still inherited the broader student-profile helper, which included same-
-- institution administrators. Replace only those predicates with the clinical visibility model.

DROP POLICY IF EXISTS alerts_select ON public.remote_alerts;
DROP POLICY IF EXISTS alerts_insert ON public.remote_alerts;

CREATE POLICY alerts_select ON public.remote_alerts FOR SELECT USING (
  student_id IS NOT NULL
  AND (
    (SELECT app_private.is_students_own_profile(student_id))
    OR (SELECT app_private.can_access_clinical_data(student_id))
  )
);

CREATE POLICY alerts_insert ON public.remote_alerts FOR INSERT WITH CHECK (
  student_id IS NOT NULL
  AND (
    (SELECT app_private.is_students_own_profile(student_id))
    OR (SELECT app_private.can_access_clinical_data(student_id))
  )
);
