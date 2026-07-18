-- ChowTrek demo seed data.
-- Run this in Supabase SQL Editor after `supabase_schema_draft.sql`
-- and `supabase_google_auth_patch.sql`.
--
-- This script creates non-login demo auth users only so the public commerce
-- tables can satisfy existing profile foreign keys without weakening RLS.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo-merchant@chowtrek.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"ChowTrek Demo Merchant"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo-customer@chowtrek.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"ChowTrek Demo Customer"}'::jsonb,
    now(),
    now()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo-agent@chowtrek.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"ChowTrek Demo Agent"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into public.profiles (id, phone, display_name, active_role)
values
  ('11111111-1111-4111-8111-111111111111', '', 'ChowTrek Demo Merchant', 'merchant'),
  ('22222222-2222-4222-8222-222222222222', '', 'ChowTrek Demo Customer', 'customer'),
  ('33333333-3333-4333-8333-333333333333', '', 'ChowTrek Demo Agent', 'delivery_agent')
on conflict (id) do update
set display_name = excluded.display_name,
    active_role = excluded.active_role,
    updated_at = now();

insert into public.profile_roles (profile_id, role, is_approved, approved_at)
values
  ('11111111-1111-4111-8111-111111111111', 'merchant', true, now()),
  ('22222222-2222-4222-8222-222222222222', 'customer', true, now()),
  ('33333333-3333-4333-8333-333333333333', 'delivery_agent', true, now())
on conflict (profile_id, role) do update
set is_approved = excluded.is_approved,
    approved_at = excluded.approved_at;

insert into public.categories (id, name)
values
  ('44444444-4444-4444-8444-444444444441', 'Ready Meals'),
  ('44444444-4444-4444-8444-444444444442', 'Snacks'),
  ('44444444-4444-4444-8444-444444444443', 'Drinks')
on conflict (id) do update
set name = excluded.name;

insert into public.merchant_profiles (
  id,
  owner_id,
  business_name,
  description,
  neighborhood,
  is_approved
)
values
  (
    '55555555-5555-4555-8555-555555555551',
    '11111111-1111-4111-8111-111111111111',
    'Mama Put Kitchen',
    'Hot jollof, rice bowls, and quick local lunches',
    'Yaba',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555552',
    '11111111-1111-4111-8111-111111111111',
    'Suya Trek Spot',
    'Evening suya, grilled chicken, and peppered sides',
    'Surulere',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555553',
    '11111111-1111-4111-8111-111111111111',
    'Bukka Bowl Express',
    'Swallow bowls, soups, and office lunch packs',
    'Ikeja',
    true
  )
on conflict (id) do update
set business_name = excluded.business_name,
    description = excluded.description,
    neighborhood = excluded.neighborhood,
    is_approved = excluded.is_approved;

insert into public.products (
  id,
  merchant_id,
  category_id,
  name,
  description,
  price_naira,
  status,
  is_active
)
values
  (
    '66666666-6666-4666-8666-666666666661',
    '55555555-5555-4555-8555-555555555551',
    '44444444-4444-4444-8444-444444444441',
    'Jollof rice and beef',
    'Smoky party-style jollof with one beef cut',
    3200,
    'food_ready',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666662',
    '55555555-5555-4555-8555-555555555551',
    '44444444-4444-4444-8444-444444444442',
    'Fried plantain side',
    'Sweet ripe plantain, packed hot',
    900,
    'food_ready',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666663',
    '55555555-5555-4555-8555-555555555552',
    '44444444-4444-4444-8444-444444444441',
    'Chicken suya wrap',
    'Grilled chicken suya with onions and yaji',
    2800,
    'preparing',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666664',
    '55555555-5555-4555-8555-555555555552',
    '44444444-4444-4444-8444-444444444443',
    'Zobo bottle',
    'Chilled hibiscus drink',
    700,
    'food_ready',
    true
  ),
  (
    '66666666-6666-4666-8666-666666666665',
    '55555555-5555-4555-8555-555555555553',
    '44444444-4444-4444-8444-444444444441',
    'Egusi and semo bowl',
    'Egusi soup with semo and assorted meat',
    3800,
    'sold_out',
    true
  )
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    price_naira = excluded.price_naira,
    status = excluded.status,
    is_active = excluded.is_active;

insert into public.vendor_timeline_events (
  id,
  merchant_id,
  type,
  title,
  body,
  product_id,
  created_at
)
values
  (
    '77777777-7777-4777-8777-777777777771',
    '55555555-5555-4555-8555-555555555551',
    'food_ready',
    'Jollof rice is ready now',
    'Fresh pot is packed and available for pickup or trek delivery.',
    '66666666-6666-4666-8666-666666666661',
    now() - interval '8 minutes'
  ),
  (
    '77777777-7777-4777-8777-777777777772',
    '55555555-5555-4555-8555-555555555552',
    'new_product',
    'Chicken suya wrap added',
    'A quick handheld option for evening commuters.',
    '66666666-6666-4666-8666-666666666663',
    now() - interval '24 minutes'
  ),
  (
    '77777777-7777-4777-8777-777777777773',
    '55555555-5555-4555-8555-555555555553',
    'sold_out',
    'Egusi bowl sold out',
    'Next batch will be listed once the kitchen confirms prep time.',
    '66666666-6666-4666-8666-666666666665',
    now() - interval '41 minutes'
  )
on conflict (id) do update
set type = excluded.type,
    title = excluded.title,
    body = excluded.body,
    product_id = excluded.product_id,
    created_at = excluded.created_at;

insert into public.community_posts (id, merchant_id, author_id, body, created_at)
values
  (
    '88888888-8888-4888-8888-888888888881',
    '55555555-5555-4555-8555-555555555551',
    '11111111-1111-4111-8111-111111111111',
    'Office lunch packs are available today from 12:00. Follow us for batch alerts.',
    now() - interval '35 minutes'
  ),
  (
    '88888888-8888-4888-8888-888888888882',
    '55555555-5555-4555-8555-555555555552',
    '11111111-1111-4111-8111-111111111111',
    'Suya grill opens at 5:30. Zobo is already chilled.',
    now() - interval '55 minutes'
  )
on conflict (id) do update
set body = excluded.body,
    created_at = excluded.created_at;

insert into public.comments (id, post_id, author_id, body, created_at)
values
  (
    '99999999-9999-4999-8999-999999999991',
    '88888888-8888-4888-8888-888888888881',
    '22222222-2222-4222-8222-222222222222',
    'Please keep one jollof pack for pickup.',
    now() - interval '22 minutes'
  )
on conflict (id) do update
set body = excluded.body,
    created_at = excluded.created_at;

insert into public.delivery_agent_profiles (
  id,
  user_id,
  is_verified,
  is_available,
  rating
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '33333333-3333-4333-8333-333333333333',
    true,
    true,
    4.85
  )
on conflict (id) do update
set is_verified = excluded.is_verified,
    is_available = excluded.is_available,
    rating = excluded.rating;

insert into public.orders (
  id,
  customer_id,
  merchant_id,
  status,
  fulfilment_mode,
  payment_mode,
  subtotal_naira,
  delivery_fee_naira,
  total_naira,
  created_at
)
values
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555551',
    'placed',
    'trek_delivery',
    'quickteller',
    4100,
    800,
    4900,
    now() - interval '12 minutes'
  )
on conflict (id) do update
set status = excluded.status,
    fulfilment_mode = excluded.fulfilment_mode,
    payment_mode = excluded.payment_mode,
    subtotal_naira = excluded.subtotal_naira,
    delivery_fee_naira = excluded.delivery_fee_naira,
    total_naira = excluded.total_naira;

insert into public.order_items (
  id,
  order_id,
  product_id,
  quantity,
  unit_price_naira
)
values
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    '66666666-6666-4666-8666-666666666661',
    1,
    3200
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    '66666666-6666-4666-8666-666666666662',
    1,
    900
  )
on conflict (id) do update
set quantity = excluded.quantity,
    unit_price_naira = excluded.unit_price_naira;

insert into public.deliveries (
  id,
  order_id,
  agent_id,
  status,
  created_at
)
values
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    null,
    'placed',
    now() - interval '10 minutes'
  )
on conflict (id) do update
set agent_id = excluded.agent_id,
    status = excluded.status;

insert into public.app_settings (key, value, updated_at)
values (
  'demo_seed',
  '{"version":1,"label":"ChowTrek demo commerce data"}'::jsonb,
  now()
)
on conflict (key) do update
set value = excluded.value,
    updated_at = excluded.updated_at;
