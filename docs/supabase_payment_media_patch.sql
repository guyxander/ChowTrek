-- Adds production-readiness fields used by the ChowTrek Android MVP.
-- Applied to project uirbiaursigeohaarrua as migration
-- `add_checkout_payment_and_product_media_fields`.

alter table public.products
  add column if not exists image_url text;

alter table public.orders
  add column if not exists payment_reference text,
  add column if not exists payment_status text not null default 'pending';

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'authorized', 'paid', 'failed', 'pay_on_delivery'));

update public.orders
set payment_status = case
  when payment_mode = 'pay_on_delivery' then 'pay_on_delivery'
  when payment_status is null then 'pending'
  else payment_status
end;
