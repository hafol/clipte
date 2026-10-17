-- Clipte schema v2.1 — run once in the Supabase SQL editor if you already ran schema.sql (v2).
-- Adds the campaign brief columns and public read functions. Safe to run more than once.

-- brief shown to clippers (v2.1; safe to re-run)
alter table public.campaigns add column if not exists description text;
alter table public.campaigns add column if not exists dos text[] not null default '{}';
alter table public.campaigns add column if not exists donts text[] not null default '{}';
alter table public.campaigns add column if not exists brand_handle text;

-- ---------------------------------------------------------------------
-- 10. PUBLIC READ FUNCTIONS (v2.1) — aggregates only, no private fields
-- ---------------------------------------------------------------------
-- A campaign's numbers are visible once it is live (or to its owner / staff)
create or replace function public.can_see_campaign_stats(p_campaign_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.campaigns c
    where c.id = p_campaign_id
      and (c.status in ('active', 'paused', 'completed') or c.brand_id = auth.uid() or public.is_staff())
  );
$$;

-- Top clippers of a campaign (name/avatar from public_profiles; rejected/flagged clips excluded)
create or replace function public.campaign_leaderboard(p_campaign_id uuid)
returns table (user_id uuid, name text, avatar_url text, clips int, views bigint, earnings numeric)
language sql stable security definer set search_path = public as $$
  select k.user_id, coalesce(p.full_name, 'Clipper'), p.avatar_url,
         count(*)::int, sum(k.view_count)::bigint, sum(k.earnings)
  from public.clips k
  left join public.public_profiles p on p.id = k.user_id
  where k.campaign_id = p_campaign_id
    and k.status in ('tracking_hold', 'verified')
    and public.can_see_campaign_stats(p_campaign_id)
  group by k.user_id, p.full_name, p.avatar_url
  order by sum(k.view_count) desc
  limit 20;
$$;

-- Clip / clipper counts for campaign cards
create or replace function public.campaign_public_stats(p_ids uuid[])
returns table (campaign_id uuid, clips int, clippers int)
language sql stable security definer set search_path = public as $$
  select k.campaign_id, count(*)::int, count(distinct k.user_id)::int
  from public.clips k
  where k.campaign_id = any (p_ids)
    and k.status in ('tracking_hold', 'verified')
    and public.can_see_campaign_stats(k.campaign_id)
  group by k.campaign_id;
$$;

-- Public creator numbers for profile pages (signed-in users only)
create or replace function public.creator_public_stats(p_user_id uuid)
returns table (clips int, views bigint, campaigns int, followers int, following int)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from public.clips where user_id = p_user_id and status = 'verified'),
    (select coalesce(sum(view_count), 0)::bigint from public.clips where user_id = p_user_id and status = 'verified'),
    (select count(distinct campaign_id)::int from public.clips where user_id = p_user_id and status = 'verified'),
    (select count(*)::int from public.user_follows where following_id = p_user_id),
    (select count(*)::int from public.user_follows where follower_id = p_user_id)
  where auth.uid() is not null;
$$;

-- How many people joined with my referral code
create or replace function public.my_referral_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where referred_by = auth.uid();
$$;

revoke execute on function public.can_see_campaign_stats(uuid), public.campaign_leaderboard(uuid),
  public.campaign_public_stats(uuid[]), public.creator_public_stats(uuid), public.my_referral_count()
  from public, anon;
grant execute on function public.can_see_campaign_stats(uuid), public.campaign_leaderboard(uuid),
  public.campaign_public_stats(uuid[]), public.creator_public_stats(uuid), public.my_referral_count()
  to authenticated, service_role;

-- [staff] Verify a social account by hand (when a platform hides bios from the checker)
create or replace function public.staff_verify_account(p_account_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  perform public.trust();
  update public.social_accounts set verified_at = now() where id = p_account_id and verified_at is null;
end;
$$;
revoke execute on function public.staff_verify_account(uuid) from public, anon;
grant execute on function public.staff_verify_account(uuid) to authenticated, service_role;
