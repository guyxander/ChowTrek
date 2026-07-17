-- Requires buyers to save a phone before checkout and requires merchants/agents
-- to save private verification addresses before receiving orders.

create table if not exists public.role_verification_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  verification_address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_verification_details_supported_role_check check (role in ('merchant', 'delivery_agent')),
  constraint role_verification_details_user_role_key unique (user_id, role),
  constraint role_verification_details_address_not_blank check (length(btrim(verification_address)) >= 8)
);

alter table public.role_verification_details enable row level security;

create index if not exists role_verification_details_user_id_idx
on public.role_verification_details(user_id);

create index if not exists role_verification_details_role_idx
on public.role_verification_details(role);

create or replace function public.touch_role_verification_details_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_role_verification_details_updated_at on public.role_verification_details;
create trigger trg_role_verification_details_updated_at
before update on public.role_verification_details
for each row execute function public.touch_role_verification_details_updated_at();

drop policy if exists "role verification readable by owner" on public.role_verification_details;
create policy "role verification readable by owner"
on public.role_verification_details
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "role verification readable by admins" on public.role_verification_details;
create policy "role verification readable by admins"
on public.role_verification_details
for select
to authenticated
using (coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin');

drop policy if exists "role verification insertable by owner" on public.role_verification_details;
create policy "role verification insertable by owner"
on public.role_verification_details
for insert
to authenticated
with check (user_id = (select auth.uid()) and role in ('merchant', 'delivery_agent'));

drop policy if exists "role verification updateable by owner" on public.role_verification_details;
create policy "role verification updateable by owner"
on public.role_verification_details
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and role in ('merchant', 'delivery_agent'));

revoke all on public.role_verification_details from anon;
revoke all on public.role_verification_details from public;
grant select, insert, update on public.role_verification_details to authenticated;

create or replace function public.merchant_can_receive_orders(target_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.merchant_profiles merchant
    join public.profiles profile on profile.id = merchant.owner_id
    join public.role_verification_details verification
      on verification.user_id = merchant.owner_id
     and verification.role = 'merchant'
    where merchant.id = target_merchant_id
      and length(regexp_replace(coalesce(profile.phone, ''), '\D', '', 'g')) between 7 and 15
      and length(btrim(verification.verification_address)) >= 8
  );
$$;

revoke all on function public.merchant_can_receive_orders(uuid) from public;
revoke execute on function public.merchant_can_receive_orders(uuid) from anon;
grant execute on function public.merchant_can_receive_orders(uuid) to authenticated;
