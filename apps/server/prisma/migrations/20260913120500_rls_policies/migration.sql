-- ─── Helper functions ────────────────────────────────────────────────────────
-- SECURITY DEFINER + owned by `postgres` (this migration runs as the superuser
-- via DATABASE_URL) so these bypass RLS internally — required to avoid infinite
-- recursion when a policy on remote_users needs to know the *caller's own* role
-- or institution, which would otherwise mean querying remote_users from inside
-- its own policy. `search_path = ''` + fully-qualified names harden against
-- search_path hijacking, per standard Postgres SECURITY DEFINER guidance.

create or replace function public.current_user_role()
returns "enum_role"
language sql
security definer
stable
set search_path = ''
as $$
  select role from public.remote_users where id = auth.uid();
$$;

create or replace function public.current_user_institution_id()
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select institution_id from public.remote_users where id = auth.uid();
$$;

-- Institution lookup for an ARBITRARY user (not just the caller). Needed by policies that
-- check "does this OTHER row's owner belong to my institution" — e.g. an admin viewing a
-- student profile. Must be SECURITY DEFINER: a plain query here would hit remote_users'
-- own RLS policy, which itself depends on remote_student_profiles, which would depend back
-- on this lookup — infinite recursion. Routing it through a RLS-bypassing definer function
-- breaks that cycle at the source instead of just moving it one hop over.
create or replace function public.institution_id_for_user(target_user_id uuid)
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select institution_id from public.remote_users where id = target_user_id;
$$;

-- Shared predicate for anything hanging off a StudentProfile (biometrics, alerts,
-- appointments, clinical notes, emotional journal): self, assigned doctor, or an
-- administrator of the same institution.
create or replace function public.can_access_student_profile(target_student_id integer)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.remote_student_profiles sp
    join public.remote_users u on u.id = sp.user_id
    where sp.id = target_student_id
      and (
        sp.user_id = auth.uid()
        or sp.assigned_doctor_id = auth.uid()
        or (u.institution_id = public.current_user_institution_id()
            and public.current_user_role() = 'administrator')
      )
  );
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- RLS policies enforce which ROWS are visible; Postgres privileges must still
-- grant the operation on the TABLE itself, or every query fails regardless of
-- any policy. Easy to forget — see AGENTS.md.

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.remote_users to authenticated;
grant select, insert, update, delete on public.remote_student_profiles to authenticated;
grant usage on sequence remote_student_profiles_id_seq to authenticated;
grant select, insert, update, delete on public.remote_biometric_records to authenticated;
grant usage on sequence remote_biometric_records_id_seq to authenticated;
-- remote_band_devices is only read here (to resolve device -> student), not yet RLS-protected
-- itself (follow-up table); authenticated needs at least SELECT to satisfy the join above.
grant select on public.remote_band_devices to authenticated;

-- ─── remote_users ────────────────────────────────────────────────────────────

alter table public.remote_users enable row level security;
alter table public.remote_users force row level security;

create policy remote_users_select on public.remote_users for select using (
  id = auth.uid()
  or exists (
    select 1 from public.remote_student_profiles sp
    where sp.user_id = remote_users.id and sp.assigned_doctor_id = auth.uid()
  )
  or (
    public.current_user_role() = 'administrator'
    and institution_id = public.current_user_institution_id()
  )
);

create policy remote_users_insert on public.remote_users for insert with check (
  public.current_user_role() = 'administrator'
  and institution_id = public.current_user_institution_id()
);

create policy remote_users_update on public.remote_users for update using (
  id = auth.uid()
  or (
    public.current_user_role() = 'administrator'
    and institution_id = public.current_user_institution_id()
  )
);

create policy remote_users_delete on public.remote_users for delete using (
  public.current_user_role() = 'administrator'
  and institution_id = public.current_user_institution_id()
);

-- RLS is row-level only. Without this trigger, the self-update policy above would let any
-- user promote themselves to administrator or move themselves to another institution by
-- simply PATCHing their own row.
create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_user_role() <> 'administrator' then
    if new.role is distinct from old.role
       or new.institution_id is distinct from old.institution_id then
      raise exception 'Solo un administrador puede modificar el rol o la institución de un usuario.';
    end if;
  end if;
  return new;
end;
$$;

create trigger remote_users_protect_privileged_columns
before update on public.remote_users
for each row execute function public.protect_privileged_columns();

-- ─── remote_student_profiles ─────────────────────────────────────────────────

alter table public.remote_student_profiles enable row level security;
alter table public.remote_student_profiles force row level security;

create policy student_profiles_select on public.remote_student_profiles for select using (
  user_id = auth.uid()
  or assigned_doctor_id = auth.uid()
  or (
    public.current_user_role() = 'administrator'
    and public.institution_id_for_user(remote_student_profiles.user_id)
        = public.current_user_institution_id()
  )
);

create policy student_profiles_insert on public.remote_student_profiles for insert with check (
  public.current_user_role() = 'administrator'
  and public.institution_id_for_user(user_id) = public.current_user_institution_id()
);

create policy student_profiles_update on public.remote_student_profiles for update using (
  assigned_doctor_id = auth.uid()
  or (
    public.current_user_role() = 'administrator'
    and public.institution_id_for_user(remote_student_profiles.user_id)
        = public.current_user_institution_id()
  )
);

create policy student_profiles_delete on public.remote_student_profiles for delete using (
  public.current_user_role() = 'administrator'
  and public.institution_id_for_user(remote_student_profiles.user_id)
      = public.current_user_institution_id()
);

-- ─── remote_biometric_records ────────────────────────────────────────────────
-- NOTE: this covers interactive access (a clinician or admin viewing/correcting
-- readings through the app). Automated device ingestion (a band device pushing
-- readings with no logged-in clinician present) has no auth.uid() to check
-- against — that path should authenticate as service_role via a dedicated
-- ingestion endpoint, not as `authenticated`. Follow-up, not solved here.

alter table public.remote_biometric_records enable row level security;
alter table public.remote_biometric_records force row level security;

create policy biometric_records_access on public.remote_biometric_records for all using (
  exists (
    select 1 from public.remote_band_devices bd
    where bd.id = remote_biometric_records.device_id
      and public.can_access_student_profile(bd.student_id)
  )
) with check (
  exists (
    select 1 from public.remote_band_devices bd
    where bd.id = remote_biometric_records.device_id
      and public.can_access_student_profile(bd.student_id)
  )
);
