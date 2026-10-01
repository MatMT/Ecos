-- Bug found live while testing Phase 3's clinical-records/clinical-notes endpoints (not
-- a new design question): `audit_logs_select` was admin-of-own-institution only, with no
-- self-visibility branch. Postgres requires an INSERT's RETURNING clause to satisfy the
-- table's SELECT policy for the newly-created row, not just the INSERT policy's WITH CHECK
-- — and Prisma's `create()` always issues `INSERT ... RETURNING`. A non-admin actor (e.g. a
-- psychologist logging their own CLINICAL_NOTE_CREATED event) therefore could never
-- successfully insert an audit row at all: the INSERT's own WITH CHECK passed, but Postgres
-- then found the actor couldn't SELECT the row it had just written, and rejected the whole
-- statement with "new row violates row-level security policy for table remote_audit_logs".
-- Reproduced directly via a throwaway ts-node script isolating tx.auditLog.create() from
-- the rest of the request, confirmed by adding a self-visibility policy in a rolled-back
-- transaction and observing the INSERT ... RETURNING succeed.
--
-- Fix: allow an actor to SELECT their own audit rows (user_id = auth.uid()), in addition to
-- the existing admin-of-own-institution branch. This doesn't add a browsing endpoint (none
-- exists yet) and doesn't weaken the audit trail's guarantees — it only makes the write path
-- Postgres already requires actually work.

DROP POLICY IF EXISTS audit_logs_select ON public.remote_audit_logs;

CREATE POLICY audit_logs_select ON public.remote_audit_logs FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR (
    (SELECT app_private.current_user_role()) = 'administrator'
    AND institution_id = (SELECT app_private.current_user_institution_id())
  )
);
