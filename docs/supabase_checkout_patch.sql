-- Allow signed-in customers to create order items and delivery requests for
-- orders they own. Applied to project uirbiaursigeohaarrua as migration
-- `allow_customer_checkout_inserts`.

create policy "customers create order items for own orders"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders order_record
    where order_record.id = order_items.order_id
      and order_record.customer_id = (select auth.uid())
  )
);

create policy "customers create delivery requests for own orders"
on public.deliveries for insert
to authenticated
with check (
  agent_id is null
  and exists (
    select 1
    from public.orders order_record
    where order_record.id = deliveries.order_id
      and order_record.customer_id = (select auth.uid())
  )
);
