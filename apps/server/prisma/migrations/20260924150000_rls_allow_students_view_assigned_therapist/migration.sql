-- Allow students to view their assigned therapist in remote_users,
-- remote_psychologist_profiles, and remote_therapist_assignments.

DROP POLICY IF EXISTS remote_users_select ON public.remote_users;
CREATE POLICY remote_users_select ON public.remote_users FOR SELECT USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.remote_student_profiles sp
    WHERE sp.user_id = remote_users.id AND sp.assigned_doctor_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.remote_student_profiles sp
    WHERE sp.user_id = (SELECT auth.uid()) AND sp.assigned_doctor_id = remote_users.id
  )
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND institution_id = (SELECT app_private.current_user_institution_id())
  )
);

DROP POLICY IF EXISTS psychologist_profiles_select ON public.remote_psychologist_profiles;
CREATE POLICY psychologist_profiles_select ON public.remote_psychologist_profiles FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.remote_student_profiles sp
    WHERE sp.user_id = (SELECT auth.uid()) AND sp.assigned_doctor_id = remote_psychologist_profiles.user_id
  )
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_user(user_id))
        = (SELECT app_private.current_user_institution_id())
  )
);

DROP POLICY IF EXISTS therapist_assignments_select ON public.remote_therapist_assignments;
CREATE POLICY therapist_assignments_select ON public.remote_therapist_assignments FOR SELECT USING (
  therapist_id = (SELECT auth.uid())
  OR student_id IN (
    SELECT id FROM public.remote_student_profiles WHERE user_id = (SELECT auth.uid())
  )
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND (SELECT app_private.institution_id_for_student(student_id))
        = (SELECT app_private.current_user_institution_id())
  )
);
