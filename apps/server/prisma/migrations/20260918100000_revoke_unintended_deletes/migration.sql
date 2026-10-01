-- Found during a post-Phase-8 security re-audit, live-tested with a rolled-back DELETE as an
-- assigned doctor against seed data: remote_clinical_records, remote_treatment_plans,
-- remote_treatment_goals, and remote_student_activities each use a single `FOR ALL` policy
-- (covering DELETE too), and their migrations never explicitly GRANT or REVOKE DELETE — the
-- authors' own comments state the intent ("closure is an UPDATE ... never a physical delete"),
-- but relied on simply not writing `GRANT DELETE` to mean "no delete grant". That doesn't hold:
-- self-hosted Supabase's `ALTER DEFAULT PRIVILEGES` grants DELETE (and every other privilege) to
-- `authenticated` on every new table regardless of this migration's own GRANT statement
-- (apps/server/AGENTS.md §11 point 2) — so an assigned doctor could physically DELETE a patient's
-- entire clinical record, a treatment plan, a treatment goal, or an assigned activity, silently
-- destroying history with no audit trail. Confirmed live: DELETE succeeded on all four before this
-- fix (a treatment plan with existing goals was incidentally blocked by the FK constraint on
-- remote_treatment_goals.plan_id, not by RLS — a plan with zero goals was fully deletable).
--
-- Fix mirrors the exact pattern already used for remote_alerts (Phase 5) and remote_clinical_notes
-- (Phase 3): REVOKE DELETE at the table-privilege level. Postgres checks table-level privilege
-- before any policy is evaluated, so this blocks DELETE outright regardless of the `FOR ALL`
-- policy's USING clause — no policy rewrite needed, and SELECT/INSERT/UPDATE are untouched.

REVOKE DELETE ON public.remote_clinical_records FROM authenticated;
REVOKE DELETE ON public.remote_treatment_plans FROM authenticated;
REVOKE DELETE ON public.remote_treatment_goals FROM authenticated;
REVOKE DELETE ON public.remote_student_activities FROM authenticated;
