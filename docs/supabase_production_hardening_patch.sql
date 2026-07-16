-- Production hardening for ChowTrek mobile release.
-- Run after the base schema and prior patches.

create table if not exists public.device_push_tokens (
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios', 'web')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.device_push_tokens enable row level security;

drop policy if exists "users manage own push tokens" on public.device_push_tokens;
create policy "users manage own push tokens"
on public.device_push_tokens for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Admin operations must be granted through app_metadata, not user_metadata.
-- Example admin claim: raw_app_meta_data = {"roles":["admin"]}

drop policy if exists "admins read merchant approvals" on public.merchant_profiles;
create policy "admins read merchant approvals"
on public.merchant_profiles for select
to authenticated
using (
  coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
);

drop policy if exists "admins approve merchants" on public.merchant_profiles;
create policy "admins approve merchants"
on public.merchant_profiles for update
to authenticated
using (
  coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
)
with check (
  coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
);

drop policy if exists "admins read agent approvals" on public.delivery_agent_profiles;
create policy "admins read agent approvals"
on public.delivery_agent_profiles for select
to authenticated
using (
  coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
);

drop policy if exists "admins approve agents" on public.delivery_agent_profiles;
create policy "admins approve agents"
on public.delivery_agent_profiles for update
to authenticated
using (
  coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
)
with check (
  coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
);

drop policy if exists "customers create order transactions" on public.transactions;
create policy "customers create order transactions"
on public.transactions for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders order_record
    where order_record.id = transactions.order_id
      and order_record.customer_id = (select auth.uid())
  )
);
