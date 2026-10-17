-- Clipte schema v2.6 — clip ownership check.
-- The server reads who posted a submitted video and compares it with the clipper's verified
-- accounts. Someone else's video is refused; if the owner can't be read the clip is marked
-- 'unconfirmed' and is flagged for a moderator instead of being paid.
-- Run once after v2.5 (safe to re-run).
alter table public.clips add column if not exists owner_check text check (owner_check in ('matched', 'unconfirmed'));
alter table public.clips add column if not exists owner_handle text;

create or replace function public.guard_clip()
returns trigger language plpgsql as $$
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.view_count := 0;
    new.paid_views := 0;
    new.earnings := 0;
    new.status := 'tracking_hold';
    new.status_reason := null;
    new.hold_until := now() + interval '48 hours';
    new.last_checked_at := null;
    new.owner_check := null;
    new.owner_handle := null;
    if not exists (select 1 from public.campaigns c where c.id = new.campaign_id and c.status = 'active'
                   and new.platform = any (c.platforms)) then
      raise exception 'campaign is not active for this platform';
    end if;
    if not exists (select 1 from public.social_accounts s where s.id = new.social_account_id
                   and s.user_id = auth.uid() and s.platform = new.platform and s.verified_at is not null) then
      raise exception 'clips must be posted from one of your verified accounts';
    end if;
    return new;
  end if;
  raise exception 'clips cannot be edited directly';
end;
$$;

create or replace function public.moderate_clip(p_clip_id uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  if p_status not in ('rejected', 'flagged', 'tracking_hold') then raise exception 'invalid status'; end if;
  perform public.trust();
  update public.clips
     set status = p_status, status_reason = p_reason,
         owner_check = case when p_status = 'tracking_hold' then 'matched' else owner_check end
   where id = p_clip_id;
end;
$$;

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

-- Clips submitted before this check were reviewed in the old flow: keep them payable.
do $$
begin
  perform public.trust();
  update public.clips set owner_check = 'matched' where owner_check is null;
end;
$$;
