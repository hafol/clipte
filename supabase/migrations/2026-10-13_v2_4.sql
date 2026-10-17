-- Clipte schema v2.4 — public_profiles without a SECURITY DEFINER view (Supabase linter: security_definer_view).
-- Same columns and behaviour: signed-in users see the safe public fields of everyone; anon sees nothing.
-- Run once after v2.3 (safe to re-run).

-- Safe fields only (no email, balances or flags), signed-in callers only
create or replace function public.list_public_profiles()
returns table (id uuid, full_name text, avatar_url text, bio text, brand_name text, brand_logo_url text, has_brand_profile boolean, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_url, p.bio, p.brand_name, p.brand_logo_url, p.has_brand_profile, p.role
  from public.profiles p
  where not p.is_suspended and auth.uid() is not null;
$$;
revoke execute on function public.list_public_profiles() from public, anon;
grant execute on function public.list_public_profiles() to authenticated, service_role;

-- The view now runs with the caller's rights and reads through the function above
create or replace view public.public_profiles with (security_invoker = true) as
  select * from public.list_public_profiles();
revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated, service_role;
