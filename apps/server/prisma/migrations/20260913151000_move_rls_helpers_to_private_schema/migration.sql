-- Revoking anon's EXECUTE (previous migration) stops anon specifically, but PostgREST
-- exposes every function in any schema listed in PGRST_DB_SCHEMAS (public,graphql_public
-- here) as an RPC endpoint to whichever role CAN call it — so `authenticated` could still
-- reach these internal helpers directly via POST /rest/v1/rpc/current_user_role, etc.,
-- which Supabase's advisor flags separately ("Signed-In Users Can Execute"). These
-- functions exist purely to be called *from inside* our own RLS policies, never directly
-- by any client. The actual fix Supabase recommends: move them out of the schema(s)
-- PostgREST scans entirely, into one it never looks at.
--
-- `ALTER FUNCTION ... SET SCHEMA` moves the function object in place — existing policies
-- and the existing trigger reference it by OID internally, not by re-resolved qualified
-- name, so they keep working unchanged after this move (verified after applying, by
-- re-running the full RLS scoping test from this session with no policy/trigger edits).

CREATE SCHEMA IF NOT EXISTS app_private;

-- Only `authenticated` may USE this schema at all (needed to call the functions in it
-- during policy evaluation) — anon has no reason to and gets nothing.
GRANT USAGE ON SCHEMA app_private TO authenticated;

ALTER FUNCTION public.current_user_role() SET SCHEMA app_private;
ALTER FUNCTION public.current_user_institution_id() SET SCHEMA app_private;
ALTER FUNCTION public.institution_id_for_user(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.can_access_student_profile(integer) SET SCHEMA app_private;
ALTER FUNCTION public.can_access_clinical_data(integer) SET SCHEMA app_private;
ALTER FUNCTION public.protect_privileged_columns() SET SCHEMA app_private;
