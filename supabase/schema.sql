-- =====================================================================
-- CLIPTE DATABASE SCHEMA v2 — secure core
-- Run once (SQL Editor → paste → Run). If an older Clipte schema exists,
-- run supabase/reset.sql FIRST (it deletes the old tables — only while there is no real data).
--
-- Security model
--   • Users can only read/write their own rows (RLS on every table).
--   • Money, statuses and view counts can NOT be changed from the browser:
--     guard triggers block those columns for normal users.
--   • Money moves only through SECURITY DEFINER functions:
--       - system functions (deposits, view snapshots, settlement) → service_role only
--       - staff functions (approve / reject / flag) check is_staff() inside
--       - user functions (request payout) check auth.uid() inside
--   • No hard-coded admin emails. Make yourself admin after signing up:
--       update public.profiles set role = 'admin' where email = 'you@example.com';
-- The previous (insecure) schema is archived in supabase/legacy/.
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+ (no extension needed)

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

-- True when the request comes from the server with the secret key (service_role JWT),
-- or from a direct SQL session (SQL editor / migrations) that carries no JWT at all.
-- NOTE: never use current_user here — inside SECURITY DEFINER functions it is always the owner.
create or replace function public.is_service()
returns boolean language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '') = 'service_role'
      or (nullif(current_setting('request.jwt.claims', true), '') is null and session_user in ('postgres', 'supabase_admin'));
$$;

-- Guards let a write through when it comes from the server, or from one of the
-- money functions below (each one calls trust() for its own transaction only).
create or replace function public.is_trusted()
returns boolean language sql stable as $$
  select public.is_service() or coalesce(current_setting('clipte.trusted', true), '') = 'on';
$$;

create or replace function public.trust()
returns void language sql as $$
  select set_config('clipte.trusted', 'on', true);
$$;

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  bio text,
  role text not null default 'clipper' check (role in ('clipper', 'brand', 'moderator', 'admin')),
  active_mode text not null default 'clipper' check (active_mode in ('clipper', 'brand')),
  -- brand identity
  has_brand_profile boolean not null default false,
  brand_name text,
  brand_logo_url text,
  brand_website text,
  brand_bio text,
  brand_industry text,
  -- referrals
  referral_code text unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  referred_by uuid references public.profiles(id) on delete set null,
  -- financials (read-only for the user; changed only by functions)
  balance_earnings numeric(12, 2) not null default 0 check (balance_earnings >= 0),
  balance_escrow numeric(12, 2) not null default 0 check (balance_escrow >= 0),
  total_earnings numeric(12, 2) not null default 0,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ref uuid;
begin
  select id into v_ref from public.profiles
  where referral_code = nullif(new.raw_user_meta_data->>'referral_code', '');

  insert into public.profiles (id, email, full_name, avatar_url, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_ref
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile, but not role, money, referral or suspension fields
create or replace function public.guard_profile()
returns trigger language plpgsql as $$
begin
  if public.is_trusted() then
    new.updated_at := now();
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role can only be changed by an admin';
  end if;
  if (new.balance_earnings, new.balance_escrow, new.total_earnings, new.referral_code, new.referred_by, new.email, new.is_suspended)
     is distinct from
     (old.balance_earnings, old.balance_escrow, old.total_earnings, old.referral_code, old.referred_by, old.email, old.is_suspended) then
    raise exception 'protected profile fields cannot be changed';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

alter table public.profiles enable row level security;

create policy "profiles: read own or staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- Safe public fields (names / avatars for messenger, campaign cards) — v2.4: no security-definer view
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

-- ---------------------------------------------------------------------
-- 2. SOCIAL ACCOUNTS (bio-code verification)
-- ---------------------------------------------------------------------
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('tiktok', 'youtube', 'instagram')),
  handle text not null,
  verify_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists social_accounts_unique_handle on public.social_accounts (platform, lower(handle));

create or replace function public.guard_social_account()
returns trigger language plpgsql as $$
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    new.verified_at := null;                       -- only the server marks accounts verified
    new.verify_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  elsif (new.verified_at, new.verify_code, new.handle, new.platform, new.user_id)
        is distinct from (old.verified_at, old.verify_code, old.handle, old.platform, old.user_id) then
    raise exception 'social accounts cannot be edited; remove and add again';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_social_account on public.social_accounts;
create trigger guard_social_account before insert or update on public.social_accounts
  for each row execute function public.guard_social_account();

alter table public.social_accounts enable row level security;
create policy "social: read own or staff" on public.social_accounts
  for select using (user_id = auth.uid() or public.is_staff());
create policy "social: add own" on public.social_accounts
  for insert with check (user_id = auth.uid());
create policy "social: remove own" on public.social_accounts
  for delete using (user_id = auth.uid());
-- (brand visibility policy is added after the clips table exists, see section 5)

-- ---------------------------------------------------------------------
-- 3. CAMPAIGNS
-- ---------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  brand_name text not null,
  category text,
  drive_url text not null,
  icon_url text,
  cover_url text,
  hashtags text[] not null default '{}',
  guidelines text,
  platforms text[] not null default array['tiktok', 'youtube', 'instagram'],
  -- rates: { "tiktok": { "cpm": 1.75, "minPayout": 1.75, "maxCap": 500 }, ... }
  platform_rates jsonb not null default '{}'::jsonb,
  cpm_rate numeric(8, 2) not null default 1.50 check (cpm_rate > 0),           -- fallback rate
  max_payout_per_clip numeric(10, 2) check (max_payout_per_clip is null or max_payout_per_clip > 0),
  -- money (changed only by functions)
  escrow_budget numeric(12, 2) not null default 0,       -- total funded
  remaining_budget numeric(12, 2) not null default 0 check (remaining_budget >= 0),
  views_delivered bigint not null default 0,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'pending_review', 'active', 'paused', 'completed', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
-- brief shown to clippers (v2.1; safe to re-run)
alter table public.campaigns add column if not exists description text;
alter table public.campaigns add column if not exists dos text[] not null default '{}';
alter table public.campaigns add column if not exists donts text[] not null default '{}';
alter table public.campaigns add column if not exists brand_handle text;

create or replace function public.guard_campaign()
returns trigger language plpgsql as $$
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    new.brand_id := auth.uid();
    new.status := 'pending_payment';
    new.escrow_budget := 0;
    new.remaining_budget := 0;
    new.views_delivered := 0;
    new.rejection_reason := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;
  -- money fields are never editable from the client
  if (new.escrow_budget, new.remaining_budget, new.views_delivered, new.brand_id)
     is distinct from (old.escrow_budget, old.remaining_budget, old.views_delivered, old.brand_id) then
    raise exception 'campaign budget fields cannot be changed directly';
  end if;
  -- status: staff use moderation functions; brands may only pause/resume their active campaign
  if new.status is distinct from old.status then
    if not (old.brand_id = auth.uid() and (old.status, new.status) in (('active', 'paused'), ('paused', 'active'))) then
      raise exception 'campaign status cannot be changed directly';
    end if;
  end if;
  -- rates can't change once clippers may be working on the campaign
  if old.status in ('active', 'paused') and (new.platform_rates, new.cpm_rate, new.max_payout_per_clip)
     is distinct from (old.platform_rates, old.cpm_rate, old.max_payout_per_clip) then
    raise exception 'rates cannot change on a live campaign';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_campaign on public.campaigns;
create trigger guard_campaign before insert or update on public.campaigns
  for each row execute function public.guard_campaign();

alter table public.campaigns enable row level security;
create policy "campaigns: active are public, owners and staff see all" on public.campaigns
  for select using (status = 'active' or brand_id = auth.uid() or public.is_staff());
create policy "campaigns: brands create" on public.campaigns
  for insert with check (auth.uid() is not null);
create policy "campaigns: owners edit" on public.campaigns
  for update using (brand_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. ESCROW DEPOSITS (crypto invoices)
-- ---------------------------------------------------------------------
create table if not exists public.escrow_deposits (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  invoice_id bigint not null unique,
  amount numeric(12, 2) not null check (amount > 0),
  asset text not null default 'USDT',
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.escrow_deposits enable row level security;
create policy "deposits: read own or admin" on public.escrow_deposits
  for select using (brand_id = auth.uid() or public.is_admin());
-- inserts/updates: server only (no policy)

-- ---------------------------------------------------------------------
-- 5. CLIPS + VIEW SNAPSHOTS
-- ---------------------------------------------------------------------
create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform text not null check (platform in ('tiktok', 'youtube', 'instagram')),
  video_url text not null,
  video_key text not null,                         -- normalized platform video id
  view_count bigint not null default 0,            -- latest reading
  paid_views bigint not null default 0,            -- views already settled
  earnings numeric(10, 2) not null default 0,
  status text not null default 'tracking_hold'
    check (status in ('tracking_hold', 'verified', 'rejected', 'flagged')),
  status_reason text,
  hold_until timestamptz not null default now() + interval '48 hours',
  last_checked_at timestamptz,
  owner_check text check (owner_check in ('matched', 'unconfirmed')),  -- set by the server on submit
  owner_handle text,                                -- who posted the video, as read from the platform
  created_at timestamptz not null default now()
);
create unique index if not exists clips_unique_video on public.clips (platform, video_key);
create index if not exists clips_due_idx on public.clips (status, last_checked_at);

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
drop trigger if exists guard_clip on public.clips;
create trigger guard_clip before insert or update on public.clips
  for each row execute function public.guard_clip();

alter table public.clips enable row level security;
create policy "clips: owner, campaign brand or staff" on public.clips
  for select using (
    user_id = auth.uid()
    or public.is_staff()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = auth.uid())
  );
create policy "clips: submit own" on public.clips
  for insert with check (user_id = auth.uid());
create policy "clips: withdraw own while on hold" on public.clips
  for delete using (user_id = auth.uid() and status = 'tracking_hold');

-- Brands can see the handle that posted each clip in their campaigns
create policy "social: brands see accounts on their clips" on public.social_accounts
  for select using (exists (
    select 1 from public.clips k join public.campaigns c on c.id = k.campaign_id
    where k.social_account_id = social_accounts.id and c.brand_id = auth.uid()
  ));

create table if not exists public.view_snapshots (
  id bigserial primary key,
  clip_id uuid not null references public.clips(id) on delete cascade,
  views bigint not null check (views >= 0),
  source text not null,                          -- 'youtube_page', 'youtube_api', 'moderator', 'provider:…'
  recorded_by uuid references public.profiles(id),
  captured_at timestamptz not null default now()
);
create index if not exists view_snapshots_clip_idx on public.view_snapshots (clip_id, captured_at desc);
alter table public.view_snapshots enable row level security;
create policy "snapshots: owner or staff" on public.view_snapshots
  for select using (
    public.is_staff() or exists (select 1 from public.clips c where c.id = clip_id and c.user_id = auth.uid())
  );

-- Log of automatic tracking passes (written by the server, read on the admin page)
create table if not exists public.tracking_runs (
  id bigserial primary key,
  trigger text not null,                         -- 'scheduler' (pg_cron), 'vercel', 'admin'
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  checked int not null default 0,
  recorded int not null default 0,
  unavailable int not null default 0,
  flagged int not null default 0,
  settled int not null default 0,
  paid numeric(12, 2) not null default 0,
  errors jsonb not null default '[]'::jsonb
);
create index if not exists tracking_runs_started_idx on public.tracking_runs (started_at desc);
alter table public.tracking_runs enable row level security;
drop policy if exists "tracking runs: staff read" on public.tracking_runs;
create policy "tracking runs: staff read" on public.tracking_runs for select using (public.is_staff());

-- ---------------------------------------------------------------------
-- 6. PAYOUT METHODS + PAYOUTS
-- ---------------------------------------------------------------------
create table if not exists public.payout_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('paypal', 'usdt_trc20', 'usdc_erc20', 'btc', 'eth', 'sol')),
  address text not null check (length(address) between 5 and 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists payout_methods_one_default on public.payout_methods (user_id) where is_default;
alter table public.payout_methods enable row level security;
create policy "methods: read own or admin" on public.payout_methods
  for select using (user_id = auth.uid() or public.is_admin());
create policy "methods: add own" on public.payout_methods
  for insert with check (user_id = auth.uid());
create policy "methods: update own" on public.payout_methods
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "methods: remove own" on public.payout_methods
  for delete using (user_id = auth.uid());

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method_type text not null,
  recipient text not null,                       -- copied at request time
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  transaction_reference text,
  failure_reason text,
  processed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.payouts enable row level security;
create policy "payouts: read own or admin" on public.payouts
  for select using (user_id = auth.uid() or public.is_admin());
-- writes: functions only

-- ---------------------------------------------------------------------
-- 7. MONEY FUNCTIONS
-- ---------------------------------------------------------------------

-- [service] Crypto invoice paid → fund campaign, send it to moderation
create or replace function public.confirm_escrow_deposit(p_invoice_id bigint, p_amount numeric)
returns boolean language plpgsql security definer set search_path = public as $$
declare d public.escrow_deposits%rowtype;
begin
  if not public.is_service() then raise exception 'service only'; end if;
  perform public.trust();
  select * into d from public.escrow_deposits where invoice_id = p_invoice_id for update;
  if not found or d.status = 'paid' then return false; end if;      -- unknown or already processed (idempotent)
  if p_amount < d.amount then raise exception 'paid amount is lower than the invoice amount'; end if;

  update public.escrow_deposits set status = 'paid', paid_at = now() where id = d.id;

  if d.campaign_id is not null then
    update public.campaigns
       set escrow_budget = escrow_budget + d.amount,
           remaining_budget = remaining_budget + d.amount,
           status = case when status = 'pending_payment' then 'pending_review' else status end
     where id = d.campaign_id;
  else
    update public.profiles set balance_escrow = balance_escrow + d.amount where id = d.brand_id;
  end if;
  return true;
end;
$$;

-- [staff] Approve a funded campaign
create or replace function public.approve_campaign(p_campaign_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.campaigns%rowtype;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  perform public.trust();
  select * into c from public.campaigns where id = p_campaign_id for update;
  if not found or c.status <> 'pending_review' then raise exception 'campaign is not awaiting review'; end if;
  if c.brand_id = auth.uid() then raise exception 'you cannot approve your own campaign'; end if;
  update public.campaigns set status = 'active', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = null
   where id = p_campaign_id;
end;
$$;

-- [staff] Reject a campaign; unspent budget returns to the brand's escrow balance
create or replace function public.reject_campaign(p_campaign_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare c public.campaigns%rowtype;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  perform public.trust();
  select * into c from public.campaigns where id = p_campaign_id for update;
  if not found or c.status not in ('pending_payment', 'pending_review', 'active', 'paused') then
    raise exception 'campaign cannot be rejected in its current state';
  end if;
  if c.remaining_budget > 0 then
    update public.profiles set balance_escrow = balance_escrow + c.remaining_budget where id = c.brand_id;
  end if;
  update public.campaigns
     set status = 'rejected', rejection_reason = p_reason, remaining_budget = 0,
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_campaign_id;
end;
$$;

-- [staff] Reject or flag a clip (no earnings are paid for it after this)
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

-- [service + staff] Record a view reading (tracker, provider or moderator from analytics proof)
create or replace function public.record_view_snapshot(p_clip_id uuid, p_views bigint, p_source text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_service() or public.is_staff()) then raise exception 'not allowed'; end if;
  if p_views < 0 then raise exception 'views must be positive'; end if;
  perform public.trust();
  insert into public.view_snapshots (clip_id, views, source, recorded_by)
  values (p_clip_id, p_views, p_source, auth.uid());
  update public.clips set view_count = greatest(view_count, p_views), last_checked_at = now() where id = p_clip_id;
end;
$$;

-- [service] Settle a clip: pay for new verified views since the last settlement.
-- Earnings = views / 1000 × platform CPM, only once the clip reaches the platform's
-- minimum payout, capped per clip, and limited by the campaign's remaining budget.
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

-- [user] Request a payout of the whole available balance to one of your methods
create or replace function public.request_payout(p_method_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  m public.payout_methods%rowtype;
  v_balance numeric;
  v_id uuid;
begin
  select * into m from public.payout_methods where id = p_method_id and user_id = auth.uid();
  if not found then raise exception 'payout method not found'; end if;
  perform public.trust();

  select balance_earnings into v_balance from public.profiles where id = auth.uid() and not is_suspended for update;
  if v_balance is null or v_balance <= 0 then raise exception 'no balance available'; end if;
  if exists (select 1 from public.payouts where user_id = auth.uid() and status = 'processing') then
    raise exception 'you already have a payout in progress';
  end if;

  update public.profiles set balance_earnings = 0 where id = auth.uid();
  insert into public.payouts (user_id, amount, method_type, recipient)
  values (auth.uid(), v_balance, m.type, m.address)
  returning id into v_id;
  return v_id;
end;
$$;

-- [admin] Mark a payout as sent or failed (failed payouts return to the balance)
create or replace function public.process_payout(p_payout_id uuid, p_status text, p_reference text)
returns void language plpgsql security definer set search_path = public as $$
declare p public.payouts%rowtype;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_status not in ('completed', 'failed') then raise exception 'invalid status'; end if;
  perform public.trust();
  select * into p from public.payouts where id = p_payout_id for update;
  if not found or p.status <> 'processing' then raise exception 'payout is not processing'; end if;

  update public.payouts
     set status = p_status, processed_by = auth.uid(), processed_at = now(),
         transaction_reference = case when p_status = 'completed' then p_reference end,
         failure_reason = case when p_status = 'failed' then p_reference end
   where id = p_payout_id;
  if p_status = 'failed' then
    update public.profiles set balance_earnings = balance_earnings + p.amount where id = p.user_id;
  end if;
end;
$$;

-- Lock down execution: nothing is callable by default …
revoke execute on all functions in schema public from public, anon, authenticated;
-- … then open exactly what each caller needs (functions re-check permissions inside)
-- (helpers are used inside RLS policies, so every role must be able to call them)
grant execute on function public.is_staff(), public.is_admin(), public.is_service(), public.is_trusted() to anon, authenticated;
grant execute on function public.approve_campaign(uuid), public.reject_campaign(uuid, text),
  public.moderate_clip(uuid, text, text), public.record_view_snapshot(uuid, bigint, text),
  public.request_payout(uuid), public.process_payout(uuid, text, text) to authenticated;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. MESSENGER
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct', 'campaign_room', 'support', 'staff')),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  participant_one uuid references public.profiles(id) on delete cascade,
  participant_two uuid references public.profiles(id) on delete cascade,
  title text,
  last_message_text text,
  last_message_sender_id uuid references public.profiles(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (length(text) between 1 and 4000),
  offer_data jsonb,
  is_read boolean not null default false,
  has_leak_warning boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.user_follows enable row level security;

create or replace function public.can_access_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and (
      c.type = 'campaign_room'
      or (c.type = 'support' and (auth.uid() in (c.participant_one, c.participant_two) or public.is_staff()))
      or (c.type = 'staff' and public.is_staff())
      or (c.type = 'direct' and auth.uid() in (c.participant_one, c.participant_two))
    )
  );
$$;
revoke execute on function public.can_access_conversation(uuid) from public, anon;
grant execute on function public.can_access_conversation(uuid) to authenticated, service_role;

create policy "conversations: participants" on public.conversations
  for select using (public.can_access_conversation(id));
create policy "conversations: start direct or support" on public.conversations
  for insert with check (type in ('direct', 'support') and auth.uid() = participant_one);

create policy "messages: read accessible" on public.direct_messages
  for select using (public.can_access_conversation(conversation_id));
create policy "messages: send to accessible" on public.direct_messages
  for insert with check (sender_id = auth.uid() and public.can_access_conversation(conversation_id));
create policy "messages: mark read" on public.direct_messages
  for update using (public.can_access_conversation(conversation_id));

create policy "follows: read all" on public.user_follows for select using (auth.uid() is not null);
create policy "follows: follow as self" on public.user_follows for insert with check (follower_id = auth.uid());
create policy "follows: unfollow as self" on public.user_follows for delete using (follower_id = auth.uid());

-- Realtime (skip tables that are already published)
do $$
declare t text;
begin
  foreach t in array array['conversations', 'direct_messages'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. BACKFILL — profiles for accounts that signed up before this schema
-- ---------------------------------------------------------------------
insert into public.profiles (id, email, full_name, avatar_url)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
       u.raw_user_meta_data->>'avatar_url'
from auth.users u
where u.email is not null
on conflict (id) do nothing;

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

-- Card faces for Discover (v2.2)
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

-- ---------------------------------------------------------------------
-- 11. MESSENGER RULES
-- ---------------------------------------------------------------------
-- One direct chat per pair, one support thread per user, one room per campaign, one staff room
create unique index if not exists conversations_direct_pair on public.conversations
  (least(participant_one, participant_two), greatest(participant_one, participant_two)) where type = 'direct';
create unique index if not exists conversations_support_user on public.conversations (participant_one) where type = 'support';
create unique index if not exists conversations_campaign_room on public.conversations (campaign_id) where type = 'campaign_room';
create unique index if not exists conversations_staff_room on public.conversations (type) where type = 'staff';
create index if not exists direct_messages_conv_time on public.direct_messages (conversation_id, created_at desc);

-- Contact details that move a deal off the platform (shown to the reader as a warning)
create or replace function public.has_contact_leak(p_text text)
returns boolean language sql immutable as $$
  select p_text ~* '(t\.me/|wa\.me/|telegram|whatsapp|discord\.gg/|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\+?[0-9][0-9 ()-]{8,}[0-9])';
$$;

-- Messages: server sets sender / flags; nobody edits text; only the recipient marks as read
create or replace function public.guard_message()
returns trigger language plpgsql as $$
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    new.sender_id := auth.uid();
    new.is_read := false;
    new.offer_data := null;
    new.created_at := now();
    new.has_leak_warning := public.has_contact_leak(new.text);
    return new;
  end if;
  if (new.text, new.sender_id, new.conversation_id, new.offer_data, new.created_at, new.has_leak_warning)
     is distinct from (old.text, old.sender_id, old.conversation_id, old.offer_data, old.created_at, old.has_leak_warning) then
    raise exception 'messages cannot be edited';
  end if;
  if new.is_read is distinct from old.is_read and (old.sender_id = auth.uid() or not new.is_read) then
    raise exception 'only the recipient can mark a message as read';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_message on public.direct_messages;
create trigger guard_message before insert or update on public.direct_messages
  for each row execute function public.guard_message();

-- Keep the conversation preview in sync
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_text = left(new.text, 200), last_message_sender_id = new.sender_id, last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists touch_conversation on public.direct_messages;
create trigger touch_conversation after insert on public.direct_messages
  for each row execute function public.touch_conversation();

-- Conversations are created only through the functions below
drop policy if exists "conversations: start direct or support" on public.conversations;

-- [user] Open (or create) my direct chat with someone. New chats need proof of work:
-- staff, a brand profile, $1+ earned, or talking to staff.
create or replace function public.start_direct(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_me public.profiles%rowtype;
begin
  if auth.uid() is null or p_other is null or p_other = auth.uid() then raise exception 'invalid recipient'; end if;
  select id into v_id from public.conversations
   where type = 'direct' and least(participant_one, participant_two) = least(auth.uid(), p_other)
     and greatest(participant_one, participant_two) = greatest(auth.uid(), p_other);
  if v_id is not null then return v_id; end if;
  if not exists (select 1 from public.profiles where id = p_other and not is_suspended) then raise exception 'user not found'; end if;
  select * into v_me from public.profiles where id = auth.uid();
  if not (v_me.role in ('moderator', 'admin') or v_me.has_brand_profile or v_me.total_earnings >= 1
          or exists (select 1 from public.profiles where id = p_other and role in ('moderator', 'admin'))) then
    raise exception 'direct messages unlock after your first $1 earned';
  end if;
  insert into public.conversations (type, participant_one, participant_two)
  values ('direct', auth.uid(), p_other) returning id into v_id;
  return v_id;
end;
$$;

-- [user] My support thread with the Clipte team
create or replace function public.my_support_conversation()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select id into v_id from public.conversations where type = 'support' and participant_one = auth.uid();
  if v_id is null then
    insert into public.conversations (type, participant_one, title) values ('support', auth.uid(), 'Support')
    on conflict do nothing returning id into v_id;
    if v_id is null then select id into v_id from public.conversations where type = 'support' and participant_one = auth.uid(); end if;
  end if;
  return v_id;
end;
$$;

-- [staff] The shared staff room
create or replace function public.staff_room()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select id into v_id from public.conversations where type = 'staff';
  if v_id is null then
    insert into public.conversations (type, title) values ('staff', 'Staff') on conflict do nothing returning id into v_id;
    if v_id is null then select id into v_id from public.conversations where type = 'staff'; end if;
  end if;
  return v_id;
end;
$$;

-- [user] Group chat of a live campaign
create or replace function public.campaign_room(p_campaign_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; c public.campaigns%rowtype;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into c from public.campaigns where id = p_campaign_id;
  if not found or not (c.status in ('active', 'paused', 'completed') or c.brand_id = auth.uid() or public.is_staff()) then
    raise exception 'campaign not found';
  end if;
  select id into v_id from public.conversations where type = 'campaign_room' and campaign_id = p_campaign_id;
  if v_id is null then
    insert into public.conversations (type, campaign_id, participant_one, title)
    values ('campaign_room', p_campaign_id, c.brand_id, c.title) on conflict do nothing returning id into v_id;
    if v_id is null then select id into v_id from public.conversations where type = 'campaign_room' and campaign_id = p_campaign_id; end if;
  end if;
  return v_id;
end;
$$;

-- [user] Unread messages per direct / support conversation
create or replace function public.my_unread()
returns table (conversation_id uuid, unread int)
language sql stable security definer set search_path = public as $$
  select m.conversation_id, count(*)::int
  from public.direct_messages m
  join public.conversations c on c.id = m.conversation_id
  where not m.is_read and m.sender_id <> auth.uid()
    and c.type in ('direct', 'support')
    and public.can_access_conversation(c.id)
  group by m.conversation_id;
$$;

-- ---------------------------------------------------------------------
-- 12. NOTIFICATIONS (written only by triggers)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_time on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notifications: mark own read" on public.notifications;
create policy "notifications: mark own read" on public.notifications for update using (user_id = auth.uid());
drop policy if exists "notifications: delete own" on public.notifications;
create policy "notifications: delete own" on public.notifications for delete using (user_id = auth.uid());

create or replace function public.guard_notification()
returns trigger language plpgsql as $$
begin
  if public.is_trusted() then return new; end if;
  if (new.user_id, new.kind, new.data, new.link, new.created_at) is distinct from (old.user_id, old.kind, old.data, old.link, old.created_at) then
    raise exception 'notifications cannot be edited';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_notification on public.notifications;
create trigger guard_notification before update on public.notifications
  for each row execute function public.guard_notification();

create or replace function public.notify(p_user uuid, p_kind text, p_data jsonb, p_link text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, data, link) values (p_user, p_kind, coalesce(p_data, '{}'::jsonb), p_link);
$$;

-- Clips: verified / rejected / flagged → clipper; new clip → brand
create or replace function public.notify_clip()
returns trigger language plpgsql security definer set search_path = public as $$
declare c public.campaigns%rowtype;
begin
  select * into c from public.campaigns where id = new.campaign_id;
  if tg_op = 'INSERT' then
    perform public.notify(c.brand_id, 'new_clip', jsonb_build_object('campaign', c.title, 'platform', new.platform), '/dashboard/campaigns/' || c.id);
  elsif new.status is distinct from old.status and new.status in ('verified', 'rejected', 'flagged') then
    perform public.notify(new.user_id, 'clip_' || new.status,
      jsonb_build_object('campaign', c.title, 'reason', new.status_reason), '/dashboard/clips');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_clip on public.clips;
create trigger notify_clip after insert or update of status on public.clips
  for each row execute function public.notify_clip();

-- Campaigns: funded / approved / rejected / completed → brand
create or replace function public.notify_campaign()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'pending_review' then
      perform public.notify(new.brand_id, 'campaign_funded', jsonb_build_object('campaign', new.title), '/dashboard/campaigns/' || new.id);
    elsif new.status = 'active' and old.status = 'pending_review' then
      perform public.notify(new.brand_id, 'campaign_approved', jsonb_build_object('campaign', new.title), '/dashboard/campaigns/' || new.id);
    elsif new.status = 'rejected' then
      perform public.notify(new.brand_id, 'campaign_rejected', jsonb_build_object('campaign', new.title, 'reason', new.rejection_reason), '/dashboard/campaigns/' || new.id);
    elsif new.status = 'completed' then
      perform public.notify(new.brand_id, 'campaign_completed', jsonb_build_object('campaign', new.title), '/dashboard/campaigns/' || new.id);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_campaign on public.campaigns;
create trigger notify_campaign after update of status on public.campaigns
  for each row execute function public.notify_campaign();

-- Payouts: sent / failed → clipper
create or replace function public.notify_payout()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('completed', 'failed') then
    perform public.notify(new.user_id, 'payout_' || new.status,
      jsonb_build_object('amount', new.amount, 'reason', new.failure_reason, 'reference', new.transaction_reference), '/dashboard/payments');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_payout on public.payouts;
create trigger notify_payout after update of status on public.payouts
  for each row execute function public.notify_payout();

-- Social accounts: verified → owner
create or replace function public.notify_account()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.verified_at is null and new.verified_at is not null then
    perform public.notify(new.user_id, 'account_verified', jsonb_build_object('handle', new.handle, 'platform', new.platform), '/dashboard/accounts');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_account on public.social_accounts;
create trigger notify_account after update of verified_at on public.social_accounts
  for each row execute function public.notify_account();

-- ---------------------------------------------------------------------
-- grants + realtime
-- ---------------------------------------------------------------------
revoke execute on function public.start_direct(uuid), public.my_support_conversation(), public.staff_room(),
  public.campaign_room(uuid), public.my_unread(), public.notify(uuid, text, jsonb, text) from public, anon;
revoke execute on function public.notify(uuid, text, jsonb, text) from authenticated;
grant execute on function public.start_direct(uuid), public.my_support_conversation(), public.staff_room(),
  public.campaign_room(uuid), public.my_unread() to authenticated;
grant execute on function public.start_direct(uuid), public.my_support_conversation(), public.staff_room(),
  public.campaign_room(uuid), public.my_unread(), public.notify(uuid, text, jsonb, text), public.has_contact_leak(text) to service_role;
grant execute on function public.has_contact_leak(text) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

-- v2.4: public_profiles reads through this function (re-granted after the global revoke above)
grant execute on function public.list_public_profiles() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- v2.8: earnings ledger, saved campaigns, analytics
-- ---------------------------------------------------------------------

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
