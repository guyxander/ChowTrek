drop policy if exists "agents update assigned deliveries" on public.deliveries;

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
