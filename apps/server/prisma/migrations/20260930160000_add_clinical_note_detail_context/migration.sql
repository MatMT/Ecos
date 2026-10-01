-- Preserve author continuity for a single clinical-note detail without granting
-- former authors general access to the patient workspace or profile endpoints.
CREATE OR REPLACE FUNCTION app_private.get_clinical_note_detail_context(
  target_student_id integer,
  target_note_id integer
)
RETURNS TABLE (
  patient_id integer,
  patient_full_name text,
  patient_email text,
  student_code text,
  assigned_therapist_id uuid,
  assigned_therapist_full_name text,
  assigned_therapist_email text,
  institution_timezone text,
  author_id uuid,
  author_full_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    patient_profile.id,
    patient_user.full_name,
    patient_user.email,
    patient_profile.student_code,
    assigned_therapist.id,
    assigned_therapist.full_name,
    assigned_therapist.email,
    COALESCE(institution.timezone, 'America/El_Salvador'),
    author.id,
    author.full_name
  FROM public.remote_clinical_notes note
  JOIN public.remote_student_profiles patient_profile
    ON patient_profile.id = note.student_id
  JOIN public.remote_users patient_user
    ON patient_user.id = patient_profile.user_id
  LEFT JOIN public.remote_users assigned_therapist
    ON assigned_therapist.id = patient_profile.assigned_doctor_id
  LEFT JOIN public.remote_institutions institution
    ON institution.id = patient_user.institution_id
  LEFT JOIN public.remote_users author
    ON author.id = note.doctor_id
  WHERE note.id = target_note_id
    AND note.student_id = target_student_id
    AND (SELECT app_private.current_user_role()) = 'psychologist'
    AND (
      note.doctor_id = (SELECT auth.uid())
      OR (SELECT app_private.can_access_clinical_data(note.student_id))
    );
$$;

REVOKE ALL ON FUNCTION app_private.get_clinical_note_detail_context(integer, integer)
  FROM PUBLIC, anon, service_role;
GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_clinical_note_detail_context(integer, integer)
  TO authenticated;
