-- ChowTrek wallet system.
-- Run this after docs/supabase_production_hardening_patch.sql.
-- It adds customer checkout wallet support and role wallets for merchant,
-- delivery-agent, and admin/platform settlement dashboards.

alter type public.payment_mode add value if not exists 'wallet';

alter table public.transactions
  add column if not exists platform_fee_naira integer not null default 0 check (platform_fee_naira >= 0),
  add column if not exists merchant_settlement_naira integer not null default 0 check (merchant_settlement_naira >= 0),
  add column if not exists agent_payout_naira integer not null default 0 check (agent_payout_naira >= 0);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('customer', 'merchant', 'agent', 'admin')),
  currency text not null default 'NGN' check (currency = 'NGN'),
  available_balance_naira integer not null default 0 check (available_balance_naira >= 0),
  pending_balance_naira integer not null default 0 check (pending_balance_naira >= 0),
  total_earned_naira integer not null default 0 check (total_earned_naira >= 0),
  virtual_account_provider text,
  virtual_account_number text,
  saved_bank_name text,
  saved_bank_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  direction text not null check (direction in ('credit', 'debit')),
  entry_type text not null check (
    entry_type in (
      'top_up',
      'order_payment',
      'merchant_earning',
      'delivery_payout',
      'platform_fee',
      'withdrawal'
    )
  ),
  amount_naira integer not null check (amount_naira > 0),
  status text not null default 'pending' check (status in ('pending', 'available', 'paid', 'failed')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_top_up_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_naira integer not null check (amount_naira > 0),
  provider text not null default 'quickteller' check (provider in ('quickteller')),
  provider_reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_naira integer not null check (amount_naira > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  bank_name text,
  account_last4 text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_top_up_requests_user_id_idx on public.wallet_top_up_requests(user_id);
create index if not exists wallet_top_up_requests_wallet_id_idx on public.wallet_top_up_requests(wallet_id);

alter table public.wallets enable row level security;
alter table public.wallet_ledger_entries enable row level security;
alter table public.wallet_top_up_requests enable row level security;
alter table public.wallet_withdrawal_requests enable row level security;

create or replace function public.can_manage_wallet_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case target_role
    when 'customer' then auth.uid() is not null
    when 'merchant' then exists (
      select 1
      from public.profile_roles role_record
      where role_record.profile_id = auth.uid()
        and role_record.role = 'merchant'
    ) or exists (
      select 1
      from public.merchant_profiles merchant
      where merchant.owner_id = auth.uid()
    )
    when 'agent' then exists (
      select 1
      from public.profile_roles role_record
      where role_record.profile_id = auth.uid()
        and role_record.role = 'delivery_agent'
    ) or exists (
      select 1
      from public.delivery_agent_profiles agent
      where agent.user_id = auth.uid()
    )
    when 'admin' then exists (
      select 1
      from public.profile_roles role_record
      where role_record.profile_id = auth.uid()
        and role_record.role = 'admin'
        and role_record.is_approved
    ) or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'admin'
    else false
  end;
$$;

revoke all on function public.can_manage_wallet_role(text) from public;
revoke execute on function public.can_manage_wallet_role(text) from anon;
grant execute on function public.can_manage_wallet_role(text) to authenticated;

drop policy if exists "users read own wallets" on public.wallets;
create policy "users read own wallets"
on public.wallets for select
to authenticated
using (
  user_id = (select auth.uid())
  and public.can_manage_wallet_role(role)
);

drop policy if exists "users create own wallets" on public.wallets;
create policy "users create own wallets"
on public.wallets for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.can_manage_wallet_role(role)
);

drop policy if exists "users read own wallet ledger" on public.wallet_ledger_entries;
create policy "users read own wallet ledger"
on public.wallet_ledger_entries for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.wallets wallet
    where wallet.id = wallet_ledger_entries.wallet_id
      and public.can_manage_wallet_role(wallet.role)
  )
);

drop policy if exists "users read own wallet top ups" on public.wallet_top_up_requests;
create policy "users read own wallet top ups"
on public.wallet_top_up_requests for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.wallets wallet
    where wallet.id = wallet_top_up_requests.wallet_id
      and public.can_manage_wallet_role(wallet.role)
  )
);

drop policy if exists "users request own wallet top ups" on public.wallet_top_up_requests;
create policy "users request own wallet top ups"
on public.wallet_top_up_requests for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.wallets wallet
    where wallet.id = wallet_top_up_requests.wallet_id
      and public.can_manage_wallet_role(wallet.role)
  )
);

drop policy if exists "users read own withdrawals" on public.wallet_withdrawal_requests;
create policy "users read own withdrawals"
on public.wallet_withdrawal_requests for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.wallets wallet
    where wallet.id = wallet_withdrawal_requests.wallet_id
      and public.can_manage_wallet_role(wallet.role)
  )
);

drop policy if exists "users request own withdrawals" on public.wallet_withdrawal_requests;
create policy "users request own withdrawals"
on public.wallet_withdrawal_requests for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.wallets wallet
    where wallet.id = wallet_withdrawal_requests.wallet_id
      and public.can_manage_wallet_role(wallet.role)
  )
);

drop policy if exists "admins read withdrawal requests" on public.wallet_withdrawal_requests;
create policy "admins read withdrawal requests"
on public.wallet_withdrawal_requests for select
to authenticated
using (
  user_id = (select auth.uid())
  or coalesce((select auth.jwt() -> 'app_metadata' -> 'roles'), '[]'::jsonb) ? 'admin'
);

create or replace function public.pay_order_with_wallet(target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  order_record public.orders%rowtype;
  customer_wallet public.wallets%rowtype;
  merchant_owner_id uuid;
  merchant_wallet_id uuid;
  platform_fee integer;
  merchant_settlement integer;
begin
  if current_user_id is null then
    raise exception 'Authentication is required for wallet checkout.';
  end if;

  select *
  into order_record
  from public.orders
  where id = target_order_id
    and customer_id = current_user_id
    and payment_mode = 'wallet'
  for update;

  if not found then
    raise exception 'Wallet order was not found for this customer.';
  end if;

  if order_record.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'message', 'Order already paid.');
  end if;

  select *
  into customer_wallet
  from public.wallets
  where user_id = current_user_id
    and role = 'customer'
  for update;

  if not found then
    raise exception 'Customer wallet does not exist.';
  end if;

  if customer_wallet.available_balance_naira < order_record.total_naira then
    raise exception 'Insufficient wallet balance.';
  end if;

  platform_fee := greatest(0, round(order_record.total_naira * 0.08)::integer);
  merchant_settlement := greatest(0, order_record.total_naira - platform_fee);

  update public.wallets
  set available_balance_naira = available_balance_naira - order_record.total_naira,
      updated_at = now()
  where id = customer_wallet.id;

  insert into public.wallet_ledger_entries (
    wallet_id,
    user_id,
    order_id,
    direction,
    entry_type,
    amount_naira,
    status,
    note
  )
  values (
    customer_wallet.id,
    current_user_id,
    target_order_id,
    'debit',
    'order_payment',
    order_record.total_naira,
    'paid',
    'Wallet checkout payment'
  );

  select owner_id
  into merchant_owner_id
  from public.merchant_profiles
  where id = order_record.merchant_id;

  if merchant_owner_id is not null then
    insert into public.wallets (user_id, role)
    values (merchant_owner_id, 'merchant')
    on conflict (user_id, role) do nothing;

    select id
    into merchant_wallet_id
    from public.wallets
    where user_id = merchant_owner_id
      and role = 'merchant'
    for update;

    update public.wallets
    set pending_balance_naira = pending_balance_naira + merchant_settlement,
        total_earned_naira = total_earned_naira + merchant_settlement,
        updated_at = now()
    where id = merchant_wallet_id;

    insert into public.wallet_ledger_entries (
      wallet_id,
      user_id,
      order_id,
      direction,
      entry_type,
      amount_naira,
      status,
      note
    )
    values (
      merchant_wallet_id,
      merchant_owner_id,
      target_order_id,
      'credit',
      'merchant_earning',
      merchant_settlement,
      'pending',
      'Merchant settlement after ChowTrek platform fee'
    );
  end if;

  update public.orders
  set payment_status = 'paid'
  where id = target_order_id;

  update public.transactions
  set status = 'paid',
      platform_fee_naira = platform_fee,
      merchant_settlement_naira = merchant_settlement
  where order_id = target_order_id
    and provider = 'wallet';

  return jsonb_build_object(
    'ok', true,
    'platform_fee_naira', platform_fee,
    'merchant_settlement_naira', merchant_settlement
  );
end;
$$;

revoke all on function public.pay_order_with_wallet(uuid) from public;
revoke execute on function public.pay_order_with_wallet(uuid) from anon;
grant execute on function public.pay_order_with_wallet(uuid) to authenticated;

grant select, insert on public.wallets to authenticated;
grant select on public.wallet_ledger_entries to authenticated;
grant select, insert on public.wallet_top_up_requests to authenticated;
grant select, insert on public.wallet_withdrawal_requests to authenticated;
