-- Adds an explicit delivery-agent arrival stage.
-- This lets buyer and merchant order screens see when the assigned agent arrives.

alter type public.order_status add value if not exists 'arrived' after 'in_transit';

create or replace function public.update_assigned_delivery_stage(
  target_delivery_id uuid,
  target_status public.order_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  agent_profile_id uuid;
  delivery_record public.deliveries%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to update delivery stage.';
  end if;

  if target_status not in ('in_transit', 'arrived', 'delivered') then
    raise exception 'Unsupported delivery stage: %', target_status;
  end if;

  select id
  into agent_profile_id
  from public.delivery_agent_profiles
  where user_id = current_user_id;

  if agent_profile_id is null then
    raise exception 'Delivery agent profile was not found for this user.';
  end if;

  select *
  into delivery_record
  from public.deliveries
  where id = target_delivery_id
    and agent_id = agent_profile_id
  for update;

  if not found then
    raise exception 'Assigned delivery was not found for this agent.';
  end if;

  update public.deliveries
  set status = target_status,
      last_seen_at = now()
  where id = target_delivery_id;

  update public.orders
  set status = target_status
  where id = delivery_record.order_id;

  return jsonb_build_object(
    'ok', true,
    'delivery_id', target_delivery_id,
    'order_id', delivery_record.order_id,
    'status', target_status
  );
end;
$$;

revoke all on function public.update_assigned_delivery_stage(uuid, public.order_status) from public;
revoke execute on function public.update_assigned_delivery_stage(uuid, public.order_status) from anon;
grant execute on function public.update_assigned_delivery_stage(uuid, public.order_status) to authenticated;
