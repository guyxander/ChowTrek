-- ChowTrek admin approval consistency patch.
-- Makes admin queue visibility work for approved profile_roles admins and
-- approves merchant/agent profile rows together with their role request rows.

create or replace function public.is_chowtrek_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
    or exists (
      select 1
      from public.profile_roles role_record
      where role_record.profile_id = auth.uid()
        and role_record.role = 'admin'
        and role_record.is_approved
    );
$$;

revoke all on function public.is_chowtrek_admin() from public;
revoke execute on function public.is_chowtrek_admin() from anon;
grant execute on function public.is_chowtrek_admin() to authenticated;

drop policy if exists "admins read merchant approvals" on public.merchant_profiles;
create policy "admins read merchant approvals"
on public.merchant_profiles for select
to authenticated
using (public.is_chowtrek_admin());

drop policy if exists "admins approve merchants" on public.merchant_profiles;
create policy "admins approve merchants"
on public.merchant_profiles for update
to authenticated
using (public.is_chowtrek_admin())
with check (public.is_chowtrek_admin());

drop policy if exists "admins read agent approvals" on public.delivery_agent_profiles;
create policy "admins read agent approvals"
on public.delivery_agent_profiles for select
to authenticated
using (public.is_chowtrek_admin());

drop policy if exists "admins approve agents" on public.delivery_agent_profiles;
create policy "admins approve agents"
on public.delivery_agent_profiles for update
to authenticated
using (public.is_chowtrek_admin())
with check (public.is_chowtrek_admin());

drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles"
on public.profiles for select
to authenticated
using (public.is_chowtrek_admin());

drop policy if exists "admins read role records" on public.profile_roles;
create policy "admins read role records"
on public.profile_roles for select
to authenticated
using (public.is_chowtrek_admin());

create or replace function public.approve_admin_queue_item(
  queue_kind text,
  queue_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  merchant_owner uuid;
  agent_owner uuid;
begin
  if not public.is_chowtrek_admin() then
    raise exception 'Only approved ChowTrek admins can approve queue items.';
  end if;

  if queue_kind = 'merchant' then
    update public.merchant_profiles
    set is_approved = true
    where id = queue_item_id
    returning owner_id into merchant_owner;

    if merchant_owner is null then
      raise exception 'Merchant queue item was not found.';
    end if;

    insert into public.profile_roles (profile_id, role, is_approved, approved_at)
    values (merchant_owner, 'merchant', true, now())
    on conflict (profile_id, role)
    do update set is_approved = true, approved_at = now();

    return jsonb_build_object('ok', true, 'kind', 'merchant', 'owner_id', merchant_owner);
  end if;

  if queue_kind = 'agent' then
    update public.delivery_agent_profiles
    set is_verified = true,
        is_available = true
    where id = queue_item_id
    returning user_id into agent_owner;

    if agent_owner is null then
      raise exception 'Delivery agent queue item was not found.';
    end if;

    insert into public.profile_roles (profile_id, role, is_approved, approved_at)
    values (agent_owner, 'delivery_agent', true, now())
    on conflict (profile_id, role)
    do update set is_approved = true, approved_at = now();

    return jsonb_build_object('ok', true, 'kind', 'agent', 'owner_id', agent_owner);
  end if;

  raise exception 'Unsupported admin queue kind: %', queue_kind;
end;
$$;

revoke all on function public.approve_admin_queue_item(text, uuid) from public;
revoke execute on function public.approve_admin_queue_item(text, uuid) from anon;
grant execute on function public.approve_admin_queue_item(text, uuid) to authenticated;
