-- Clipte schema v2.8 — stats for clippers, brands and admins; saved campaigns.
--   clip_earnings     one row per settlement (earnings / spend over time)
--   saved_campaigns   bookmarks on Discover
--   stats_series()    daily views / earnings / clips for charts (my clips, my campaigns, a campaign, a clip, the platform)
--   campaign_analytics(), platform_analytics()  summary blocks for the brand and admin pages
-- Run once after v2.7 (safe to re-run).

-- Every settlement writes one row, so earnings (clipper) and spend (brand) can be charted by day
create table if not exists public.clip_earnings (
  id bigserial primary key,
  clip_id uuid not null references public.clips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  views bigint not null default 0,                -- views paid for in this settlement
  created_at timestamptz not null default now()
);
create index if not exists clip_earnings_user_idx on public.clip_earnings (user_id, created_at);
create index if not exists clip_earnings_campaign_idx on public.clip_earnings (campaign_id, created_at);
alter table public.clip_earnings enable row level security;
drop policy if exists "earnings: owner, campaign brand or staff" on public.clip_earnings;
create policy "earnings: owner, campaign brand or staff" on public.clip_earnings
  for select using (
    user_id = auth.uid() or public.is_staff()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid())
  );
-- writes: settle_clip only

-- Bookmarked campaigns (Discover → "Saved")
create table if not exists public.saved_campaigns (
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);
alter table public.saved_campaigns enable row level security;
drop policy if exists "saved: own" on public.saved_campaigns;
create policy "saved: own" on public.saved_campaigns
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Daily series for charts. Scopes:
--   'me' (my clips) · 'brand' (clips on my campaigns) · 'campaign' (p_id; its brand or staff)
--   'clip' (p_id; owner, its campaign's brand or staff) · 'platform' (staff)
-- views  = views gained that day (highest reading per clip per day, minus the day before)
-- earned = money settled that day · clips = clips submitted that day
create or replace function public.stats_series(p_scope text, p_id uuid default null, p_days int default 30, p_tz text default 'UTC')
returns table (day date, views bigint, earned numeric, clips int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_days int := least(greatest(coalesce(p_days, 30), 1), 365);
  v_today date := (now() at time zone p_tz)::date;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  if p_scope not in ('me', 'brand', 'campaign', 'clip', 'platform') then raise exception 'invalid scope'; end if;
  if p_scope = 'platform' and not public.is_staff() then raise exception 'staff only'; end if;
  if p_scope = 'campaign' and not (public.is_staff()
       or exists (select 1 from public.campaigns c where c.id = p_id and c.brand_id = auth.uid())) then
    raise exception 'not allowed';
  end if;
  if p_scope = 'clip' and not (public.is_staff()
       or exists (select 1 from public.clips k join public.campaigns c on c.id = k.campaign_id
                  where k.id = p_id and (k.user_id = auth.uid() or c.brand_id = auth.uid()))) then
    raise exception 'not allowed';
  end if;

  return query
  with sc as (
    select k.id, k.created_at
    from public.clips k join public.campaigns c on c.id = k.campaign_id
    where case p_scope
      when 'me' then k.user_id = auth.uid()
      when 'brand' then c.brand_id = auth.uid()
      when 'campaign' then k.campaign_id = p_id
      when 'clip' then k.id = p_id
      else true end
  ),
  daily as (
    select s.clip_id, (s.captured_at at time zone p_tz)::date as d, max(s.views) as v
    from public.view_snapshots s join sc on sc.id = s.clip_id
    group by 1, 2
  ),
  gains as (
    select g.d, sum(g.gain) as gained from (
      select daily.d, greatest(0, daily.v - coalesce(lag(daily.v) over (partition by daily.clip_id order by daily.d), 0)) as gain
      from daily
    ) g group by g.d
  ),
  pay as (
    select (e.created_at at time zone p_tz)::date as d, sum(e.amount) as amt
    from public.clip_earnings e join sc on sc.id = e.clip_id group by 1
  ),
  subs as (
    select (sc.created_at at time zone p_tz)::date as d, count(*) as n from sc group by 1
  ),
  days as (
    select gs::date as d from generate_series(v_today - (v_days - 1), v_today, interval '1 day') gs
  )
  select days.d, coalesce(gains.gained, 0)::bigint, coalesce(pay.amt, 0)::numeric, coalesce(subs.n, 0)::int
  from days
  left join gains on gains.d = days.d
  left join pay on pay.d = days.d
  left join subs on subs.d = days.d
  order by days.d;
end;
$$;

-- One campaign at a glance: totals, platform split, top clippers, top clips (its brand or staff)
create or replace function public.campaign_analytics(p_campaign_id uuid)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_staff() or exists (select 1 from public.campaigns c where c.id = p_campaign_id and c.brand_id = auth.uid())) then
    raise exception 'not allowed';
  end if;
  return json_build_object(
    'totals', (
      select json_build_object(
        'views', coalesce(sum(k.view_count), 0),
        'paid_views', coalesce(sum(k.paid_views), 0),
        'clips', count(*),
        'clippers', count(distinct k.user_id),
        'earned', coalesce(sum(k.earnings), 0),
        'verified', count(*) filter (where k.status = 'verified'),
        'hold', count(*) filter (where k.status = 'tracking_hold'),
        'problems', count(*) filter (where k.status in ('flagged', 'rejected')))
      from public.clips k where k.campaign_id = p_campaign_id),
    'platforms', (
      select coalesce(json_agg(x order by x.views desc), '[]'::json) from (
        select k.platform, sum(k.view_count) as views, count(*) as clips, sum(k.earnings) as earned
        from public.clips k where k.campaign_id = p_campaign_id and k.status <> 'rejected' group by k.platform) x),
    'clippers', (
      select coalesce(json_agg(x), '[]'::json) from (
        select k.user_id as id, p.full_name as name, p.avatar_url as avatar,
               sum(k.view_count) as views, sum(k.earnings) as earned, count(*) as clips
        from public.clips k join public.profiles p on p.id = k.user_id
        where k.campaign_id = p_campaign_id and k.status <> 'rejected'
        group by 1, 2, 3 order by views desc limit 10) x),
    'top_clips', (
      select coalesce(json_agg(x), '[]'::json) from (
        select k.id, k.platform, k.video_url as url, k.view_count as views, k.earnings as earned, k.status,
               k.created_at, s.handle
        from public.clips k left join public.social_accounts s on s.id = k.social_account_id
        where k.campaign_id = p_campaign_id and k.status <> 'rejected'
        order by k.view_count desc limit 10) x)
  );
end;
$$;

-- The whole platform (admin): money, people, content, leaders
create or replace function public.platform_analytics(p_days int default 30)
returns json language plpgsql stable security definer set search_path = public as $$
declare v_from timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365));
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return json_build_object(
    'totals', json_build_object(
      'users', (select count(*) from public.profiles),
      'new_users', (select count(*) from public.profiles where created_at >= v_from),
      'active_clippers', (select count(distinct user_id) from public.clips where created_at >= v_from),
      'brands', (select count(distinct brand_id) from public.campaigns where status <> 'pending_payment'),
      'live_campaigns', (select count(*) from public.campaigns where status = 'active'),
      'funded', (select coalesce(sum(amount), 0) from public.escrow_deposits where status = 'paid'),
      'funded_period', (select coalesce(sum(amount), 0) from public.escrow_deposits where status = 'paid' and paid_at >= v_from),
      'in_escrow', (select coalesce(sum(remaining_budget), 0) from public.campaigns where status in ('active', 'paused', 'pending_review')),
      'earned', (select coalesce(sum(earnings), 0) from public.clips),
      'earned_period', (select coalesce(sum(amount), 0) from public.clip_earnings where created_at >= v_from),
      'paid_out', (select coalesce(sum(amount), 0) from public.payouts where status = 'completed'),
      'pending_payouts', (select coalesce(sum(amount), 0) from public.payouts where status = 'processing'),
      'views', (select coalesce(sum(view_count), 0) from public.clips where status <> 'rejected'),
      'clips', (select count(*) from public.clips),
      'clips_period', (select count(*) from public.clips where created_at >= v_from),
      'flagged', (select count(*) from public.clips where status = 'flagged')),
    'signups', (
      select coalesce(json_agg(json_build_object('day', d, 'n', n) order by d), '[]'::json) from (
        select (created_at at time zone 'UTC')::date as d, count(*) as n from public.profiles
        where created_at >= v_from group by 1) x),
    'funding', (
      select coalesce(json_agg(json_build_object('day', d, 'amount', amt) order by d), '[]'::json) from (
        select (paid_at at time zone 'UTC')::date as d, sum(amount) as amt from public.escrow_deposits
        where status = 'paid' and paid_at >= v_from group by 1) x),
    'platforms', (
      select coalesce(json_agg(x order by x.views desc), '[]'::json) from (
        select platform, sum(view_count) as views, count(*) as clips, sum(earnings) as earned
        from public.clips where status <> 'rejected' group by platform) x),
    'top_campaigns', (
      select coalesce(json_agg(x), '[]'::json) from (
        select c.id, c.title, c.brand_name, c.status, c.views_delivered as views,
               c.escrow_budget - c.remaining_budget as spent, c.escrow_budget as budget
        from public.campaigns c where c.status <> 'pending_payment'
        order by c.views_delivered desc limit 8) x),
    'top_clippers', (
      select coalesce(json_agg(x), '[]'::json) from (
        select p.id, p.full_name as name, p.avatar_url as avatar, p.total_earnings as earned,
               (select coalesce(sum(view_count), 0) from public.clips k where k.user_id = p.id and k.status <> 'rejected') as views,
               (select count(*) from public.clips k where k.user_id = p.id) as clips
        from public.profiles p where p.total_earnings > 0
        order by p.total_earnings desc limit 8) x)
  );
end;
$$;

revoke execute on function public.stats_series(text, uuid, int, text), public.campaign_analytics(uuid), public.platform_analytics(int) from public, anon;
grant execute on function public.stats_series(text, uuid, int, text), public.campaign_analytics(uuid), public.platform_analytics(int) to authenticated, service_role;

-- settle_clip now writes the ledger
create or replace function public.settle_clip(p_clip_id uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  k public.clips%rowtype;
  c public.campaigns%rowtype;
  v_rate jsonb;
  v_cpm numeric; v_min numeric; v_cap numeric;
  v_target numeric; v_delta numeric;
begin
  if not public.is_service() then raise exception 'service only'; end if;
  perform public.trust();

  select * into k from public.clips where id = p_clip_id for update;
  if not found or k.status in ('rejected', 'flagged') or k.hold_until > now() then return 0; end if;
  if k.owner_check is distinct from 'matched' then
    update public.clips
       set status = 'flagged',
           status_reason = 'Owner not confirmed — check the video is from the clipper''s account, then restore'
     where id = k.id;
    return 0;
  end if;

  select * into c from public.campaigns where id = k.campaign_id for update;
  v_rate := c.platform_rates -> k.platform;
  v_cpm := coalesce((v_rate->>'cpm')::numeric, c.cpm_rate);
  v_min := coalesce((v_rate->>'minPayout')::numeric, 0);
  v_cap := coalesce((v_rate->>'maxCap')::numeric, c.max_payout_per_clip);

  v_target := round(k.view_count / 1000.0 * v_cpm, 2);
  if v_target < v_min then v_target := 0; end if;               -- below the minimum: nothing yet
  if v_cap is not null then v_target := least(v_target, v_cap); end if;

  v_delta := greatest(0, least(v_target - k.earnings, c.remaining_budget));
  if v_delta = 0 then
    update public.clips set status = 'verified' where id = k.id and status = 'tracking_hold';
    return 0;
  end if;

  update public.clips
     set earnings = earnings + v_delta, paid_views = view_count, status = 'verified'
   where id = k.id;
  insert into public.clip_earnings (clip_id, user_id, campaign_id, amount, views)
  values (k.id, k.user_id, c.id, v_delta, greatest(0, k.view_count - k.paid_views));
  update public.campaigns
     set remaining_budget = remaining_budget - v_delta,
         views_delivered = views_delivered + greatest(0, k.view_count - k.paid_views),
         status = case when remaining_budget - v_delta <= 0 then 'completed' else status end
   where id = c.id;
  update public.profiles
     set balance_earnings = balance_earnings + v_delta, total_earnings = total_earnings + v_delta
   where id = k.user_id;
  return v_delta;
end;
$$;

-- Earlier settlements, recorded once per clip (exact dates weren't kept before v2.8)
insert into public.clip_earnings (clip_id, user_id, campaign_id, amount, views, created_at)
select k.id, k.user_id, k.campaign_id, k.earnings, k.paid_views, coalesce(k.last_checked_at, k.created_at)
from public.clips k
where k.earnings > 0 and not exists (select 1 from public.clip_earnings e where e.clip_id = k.id);
