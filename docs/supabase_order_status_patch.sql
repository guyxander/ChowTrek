-- Allow merchant owners to update status on orders for their own merchant.
-- Applied to project uirbiaursigeohaarrua as migration
-- `allow_merchant_order_status_updates`.

create policy "merchant owners update own order status"
on public.orders for update
to authenticated
using (
  exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = orders.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.merchant_profiles merchant
    where merchant.id = orders.merchant_id
      and merchant.owner_id = (select auth.uid())
  )
);
