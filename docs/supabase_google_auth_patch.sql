-- Run this after the initial ChowTrek schema if it was already applied before
-- the MVP auth decision changed from phone OTP to Google OAuth.

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
