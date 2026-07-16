-- Allow Google-authenticated users to create their own merchant/agent role records.
-- Applied to project uirbiaursigeohaarrua as migration `allow_role_onboarding_inserts`.

create policy "users create own merchant profile"
on public.merchant_profiles for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "agents create own profile"
on public.delivery_agent_profiles for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "users read own role records"
on public.profile_roles for select
to authenticated
using (profile_id = (select auth.uid()));

create policy "users request own role records"
on public.profile_roles for insert
to authenticated
with check (profile_id = (select auth.uid()));
