-- ChowTrek Supabase schema draft.
-- This is intentionally not in supabase/migrations because the Supabase CLI
-- is not available in this environment to create an official migration file.

create schema if not exists private;

create type public.user_role as enum ('customer', 'merchant', 'delivery_agent', 'admin');
create type public.food_status as enum ('preparing', 'food_ready', 'sold_out');
create type public.order_status as enum (
  'cart',
  'placed',
  'accepted',
  'preparing',
  'ready',
  'in_transit',
  'delivered',
  'cancelled'
);
create type public.fulfilment_mode as enum ('pickup', 'trek_delivery', 'express');
create type public.payment_mode as enum ('flutterwave', 'pay_on_delivery');
create type public.timeline_event_type as enum (
  'food_ready',
  'new_product',
  'special_offer',
  'community_post',
  'store_update',
  'sold_out'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null,
  display_name text,
  active_role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  is_approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (profile_id, role)
);

create table public.merchant_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  description text,
  neighborhood text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.delivery_agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_verified boolean not null default false,
  is_available boolean not null default false,
  rating numeric(3, 2) not null default 5.00,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price_naira integer not null check (price_naira >= 0),
  status public.food_status not null default 'preparing',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address_line text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  merchant_id uuid not null references public.merchant_profiles(id),
  status public.order_status not null default 'cart',
  fulfilment_mode public.fulfilment_mode not null,
  payment_mode public.payment_mode not null,
  subtotal_naira integer not null default 0,
  delivery_fee_naira integer not null default 0,
  total_naira integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_naira integer not null check (unit_price_naira >= 0)
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  agent_id uuid references public.delivery_agent_profiles(id),
  status public.order_status not null default 'placed',
  last_latitude double precision,
  last_longitude double precision,
  last_seen_at timestamptz,
  inactivity_alerted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.vendor_followers (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, merchant_id)
);

create table public.vendor_timeline_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  type public.timeline_event_type not null,
  title text not null,
  body text,
  product_id uuid references public.products(id),
  created_at timestamptz not null default now()
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchant_profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  merchant_id uuid references public.merchant_profiles(id),
  agent_id uuid references public.delivery_agent_profiles(id),
  score integer not null check (score between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  label text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount_naira integer not null check (amount_naira >= 0),
  status text not null,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (
    new.id,
    coalesce(new.phone, ''),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'display_name',
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      ),
      ''
    )
  )
  on conflict (id) do update
  set phone = excluded.phone,
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      updated_at = now();

  insert into public.profile_roles (profile_id, role, is_approved, approved_at)
  values (new.id, 'customer', true, now())
  on conflict (profile_id, role) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.merchant_profiles enable row level security;
alter table public.delivery_agent_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.vendor_followers enable row level security;
alter table public.vendor_timeline_events enable row level security;
alter table public.community_posts enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.transactions enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles are readable by owner"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles are insertable by owner"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles are updateable by owner"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profile roles are readable by owner"
on public.profile_roles for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "approved merchants are publicly readable"
on public.merchant_profiles for select
to anon, authenticated
using (is_approved or owner_id = (select auth.uid()));

create policy "merchant owners manage own profile"
on public.merchant_profiles for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "categories are readable"
on public.categories for select
to anon, authenticated
using (true);

create policy "active products are readable"
on public.products for select
to anon, authenticated
using (
  is_active
  or exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = products.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
);

create policy "agents read own profile"
on public.delivery_agent_profiles for select
to authenticated
using (user_id = (select auth.uid()));

create policy "agents update own availability"
on public.delivery_agent_profiles for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "merchant owners manage products"
on public.products for all
to authenticated
using (
  exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = products.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = products.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
);

create policy "customers manage own addresses"
on public.addresses for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "customers and merchants read relevant orders"
on public.orders for select
to authenticated
using (
  customer_id = (select auth.uid())
  or exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = orders.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
);

create policy "customers create own orders"
on public.orders for insert
to authenticated
with check (customer_id = (select auth.uid()));

create policy "customers and merchants read relevant order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders order_record
    left join public.merchant_profiles merchant on merchant.id = order_record.merchant_id
    where order_record.id = order_items.order_id
      and (
        order_record.customer_id = (select auth.uid())
        or merchant.owner_id = (select auth.uid())
      )
  )
);

create policy "assigned agents and order parties read deliveries"
on public.deliveries for select
to authenticated
using (
  exists (
    select 1
    from public.orders order_record
    left join public.merchant_profiles merchant on merchant.id = order_record.merchant_id
    left join public.delivery_agent_profiles agent on agent.id = deliveries.agent_id
    where order_record.id = deliveries.order_id
      and (
        order_record.customer_id = (select auth.uid())
        or merchant.owner_id = (select auth.uid())
        or agent.user_id = (select auth.uid())
      )
  )
);

create policy "available agents read open deliveries"
on public.deliveries for select
to authenticated
using (
  agent_id is null
  and exists (
    select 1
    from public.delivery_agent_profiles agent
    where agent.user_id = (select auth.uid())
      and agent.is_verified
  )
);

create policy "agents update assigned deliveries"
on public.deliveries for update
to authenticated
using (
  exists (
    select 1
    from public.delivery_agent_profiles agent
    where agent.id = deliveries.agent_id
      and agent.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.delivery_agent_profiles agent
    where agent.id = deliveries.agent_id
      and agent.user_id = (select auth.uid())
  )
);

create policy "agents claim open deliveries"
on public.deliveries for update
to authenticated
using (
  agent_id is null
  and exists (
    select 1
    from public.delivery_agent_profiles agent
    where agent.user_id = (select auth.uid())
      and agent.is_verified
  )
)
with check (
  exists (
    select 1
    from public.delivery_agent_profiles agent
    where agent.id = deliveries.agent_id
      and agent.user_id = (select auth.uid())
      and agent.is_verified
  )
);

create policy "customers manage own follows"
on public.vendor_followers for all
to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy "timeline events are readable"
on public.vendor_timeline_events for select
to anon, authenticated
using (true);

create policy "merchant owners manage timeline"
on public.vendor_timeline_events for all
to authenticated
using (
  exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = vendor_timeline_events.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = vendor_timeline_events.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
);

create policy "community posts are readable"
on public.community_posts for select
to anon, authenticated
using (true);

create policy "users create own community posts"
on public.community_posts for insert
to authenticated
with check (author_id = (select auth.uid()));

create policy "comments are readable"
on public.comments for select
to anon, authenticated
using (true);

create policy "users create own comments"
on public.comments for insert
to authenticated
with check (author_id = (select auth.uid()));

create policy "customers manage own ratings"
on public.ratings for all
to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy "users read own notifications"
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users update own notifications"
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users manage own notification preferences"
on public.notification_preferences for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "order parties read transactions"
on public.transactions for select
to authenticated
using (
  exists (
    select 1
    from public.orders order_record
    left join public.merchant_profiles merchant on merchant.id = order_record.merchant_id
    where order_record.id = transactions.order_id
      and (
        order_record.customer_id = (select auth.uid())
        or merchant.owner_id = (select auth.uid())
      )
  )
);

create policy "authenticated users read app settings"
on public.app_settings for select
to anon, authenticated
using (true);
