-- Clipte schema v2.2 — card faces for Discover. Run once after v2.1 (safe to re-run).
-- Returns clip / clipper counts and up to 3 clippers (public name + avatar only) per campaign.
create or replace function public.campaign_card_stats(p_ids uuid[])
returns table (campaign_id uuid, clips int, clippers int, faces jsonb)
language sql stable security definer set search_path = public as $$
  select k.campaign_id, count(*)::int, count(distinct k.user_id)::int,
    (select coalesce(jsonb_agg(jsonb_build_object('name', f.full_name, 'avatar', f.avatar_url)), '[]'::jsonb)
       from (select distinct on (k2.user_id) k2.user_id, p.full_name, p.avatar_url
               from public.clips k2
               join public.public_profiles p on p.id = k2.user_id
              where k2.campaign_id = k.campaign_id and k2.status in ('tracking_hold', 'verified')
              limit 3) f)
  from public.clips k
  where k.campaign_id = any (p_ids)
    and k.status in ('tracking_hold', 'verified')
    and public.can_see_campaign_stats(k.campaign_id)
  group by k.campaign_id;
$$;
revoke execute on function public.campaign_card_stats(uuid[]) from public, anon;
grant execute on function public.campaign_card_stats(uuid[]) to authenticated, service_role;
