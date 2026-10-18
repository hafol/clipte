-- Clipte schema v2.9 — clipper levels, referral rewards, appeals, category alerts, Telegram notifications.
-- Run once after v2.8 (safe to re-run). Telegram also needs the bot connected from Admin → Tracking.

-- Levels -------------------------------------------------------------------
-- Counted on fraud-checked (paid) views across all of a clipper's clips.
--   bronze 0 · silver 100K · gold 1M · platinum 10M
-- Perks: shorter fraud hold (48h → 36h → 24h → 12h) and access to campaigns with a minimum level.
create or replace function public.level_for(p_views bigint)
returns text language sql immutable as $$
  select case when p_views >= 10000000 then 'platinum' when p_views >= 1000000 then 'gold'
              when p_views >= 100000 then 'silver' else 'bronze' end;
$$;
create or replace function public.level_rank(p_level text)
returns int language sql immutable as $$
  select case p_level when 'platinum' then 3 when 'gold' then 2 when 'silver' then 1 else 0 end;
$$;
create or replace function public.level_hold_hours(p_level text)
returns int language sql immutable as $$
  select case p_level when 'platinum' then 12 when 'gold' then 24 when 'silver' then 36 else 48 end;
$$;
create or replace function public.paid_views_of(p_user uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(paid_views), 0)::bigint from public.clips where user_id = p_user and status <> 'rejected';
$$;
-- the caller's own paid views (used by the clip guard, which runs as the user)
create or replace function public.my_paid_views()
returns bigint language sql stable security definer set search_path = public as $$
  select public.paid_views_of(auth.uid());
$$;
create or replace function public.my_level()
returns json language sql stable security definer set search_path = public as $$
  with v as (select public.paid_views_of(auth.uid()) as views)
  select json_build_object(
    'level', public.level_for(v.views),
    'views', v.views,
    'next', case public.level_for(v.views) when 'bronze' then 'silver' when 'silver' then 'gold' when 'gold' then 'platinum' end,
    'next_at', case public.level_for(v.views) when 'bronze' then 100000 when 'silver' then 1000000 when 'gold' then 10000000 end,
    'hold_hours', public.level_hold_hours(public.level_for(v.views)))
  from v;
$$;
-- level shown on public creator profiles
create or replace function public.creator_level(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select public.level_for(public.paid_views_of(p_user));
$$;

-- Premium campaigns: brands may require a minimum level
alter table public.campaigns add column if not exists min_level text check (min_level in ('silver', 'gold', 'platinum'));

-- Clips: hold length follows the clipper's level; premium campaigns check it
create or replace function public.guard_clip()
returns trigger language plpgsql as $$
declare
  v_min text;
  v_level text;
begin
  if public.is_trusted() then return new; end if;
  if tg_op = 'INSERT' then
    v_level := public.level_for(public.my_paid_views());
    new.user_id := auth.uid();
    new.view_count := 0;
    new.paid_views := 0;
    new.earnings := 0;
    new.status := 'tracking_hold';
    new.status_reason := null;
    new.hold_until := now() + make_interval(hours => public.level_hold_hours(v_level));
    new.last_checked_at := null;
    new.owner_check := null;
    new.owner_handle := null;
    select c.min_level into v_min from public.campaigns c
     where c.id = new.campaign_id and c.status = 'active' and new.platform = any (c.platforms);
    if not found then
      raise exception 'campaign is not active for this platform';
    end if;
    if v_min is not null and public.level_rank(v_level) < public.level_rank(v_min) then
      raise exception 'this campaign is for % clippers and above', initcap(v_min);
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

-- Campaigns: the minimum level is locked once the campaign is live (like the rates)
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
  -- rates and who may join can't change once clippers may be working on the campaign
  if old.status in ('active', 'paused') and (new.platform_rates, new.cpm_rate, new.max_payout_per_clip, new.min_level)
     is distinct from (old.platform_rates, old.cpm_rate, old.max_payout_per_clip, old.min_level) then
    raise exception 'rates cannot change on a live campaign';
  end if;
  return new;
end;
$$;

-- Referral rewards -----------------------------------------------------------
-- The referrer earns 5% of what the invited clipper earns, up to the invited clipper's first $100
-- (so at most $5 per invite). Paid by Clipte — it is not taken from the brand's campaign budget.
create table if not exists public.referral_rewards (
  id bigserial primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  clip_id uuid references public.clips(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists referral_rewards_referrer_idx on public.referral_rewards (referrer_id, created_at);
alter table public.referral_rewards enable row level security;
drop policy if exists "referral rewards: referrer or staff" on public.referral_rewards;
create policy "referral rewards: referrer or staff" on public.referral_rewards
  for select using (referrer_id = auth.uid() or public.is_staff());

-- People who joined with my code: progress toward the $100 cap, and what they earned me
create or replace function public.my_referrals()
returns table (id uuid, name text, avatar text, joined_at timestamptz, progress numeric, reward numeric)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_url, p.created_at, least(p.total_earnings, 100),
         coalesce((select sum(r.amount) from public.referral_rewards r where r.referrer_id = auth.uid() and r.referred_id = p.id), 0)
  from public.profiles p where p.referred_by = auth.uid()
  order by p.created_at desc;
$$;

-- Settlement: ledger + earnings notification + referral reward + level-up
create or replace function public.settle_clip(p_clip_id uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  k public.clips%rowtype;
  c public.campaigns%rowtype;
  v_rate jsonb;
  v_cpm numeric; v_min numeric; v_cap numeric;
  v_target numeric; v_delta numeric;
  v_ref uuid; v_before numeric; v_bonus numeric;
  v_new_views bigint; v_after bigint;
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

  v_new_views := greatest(0, k.view_count - k.paid_views);
  update public.clips
     set earnings = earnings + v_delta, paid_views = view_count, status = 'verified'
   where id = k.id;
  insert into public.clip_earnings (clip_id, user_id, campaign_id, amount, views)
  values (k.id, k.user_id, c.id, v_delta, v_new_views);
  update public.campaigns
     set remaining_budget = remaining_budget - v_delta,
         views_delivered = views_delivered + v_new_views,
         status = case when remaining_budget - v_delta <= 0 then 'completed' else status end
   where id = c.id;
  update public.profiles
     set balance_earnings = balance_earnings + v_delta, total_earnings = total_earnings + v_delta
   where id = k.user_id
   returning referred_by, total_earnings - v_delta into v_ref, v_before;

  -- "💸 your clip earned $X" for clips that were already paid before (the first payout is
  -- announced by clip_verified); at most every 12 hours per clip
  if k.status = 'verified' and v_delta >= 1 and not exists (
       select 1 from public.notifications n
        where n.user_id = k.user_id and n.kind = 'clip_earned' and n.data->>'clip' = k.id::text
          and n.created_at > now() - interval '12 hours') then
    perform public.notify(k.user_id, 'clip_earned', jsonb_build_object('amount', v_delta, 'campaign', c.title, 'clip', k.id), '/dashboard/clips');
  end if;

  -- referral reward (paid by Clipte)
  if v_ref is not null and v_before < 100 then
    v_bonus := round(least(v_delta, 100 - v_before) * 0.05, 2);
    if v_bonus > 0 then
      update public.profiles
         set balance_earnings = balance_earnings + v_bonus, total_earnings = total_earnings + v_bonus
       where id = v_ref and not is_suspended;
      if found then
        insert into public.referral_rewards (referrer_id, referred_id, clip_id, amount) values (v_ref, k.user_id, k.id, v_bonus);
        perform public.notify(v_ref, 'referral_reward',
          jsonb_build_object('amount', v_bonus, 'name', (select full_name from public.profiles where id = k.user_id)), '/dashboard/teams');
      end if;
    end if;
  end if;

  -- level up
  v_after := public.paid_views_of(k.user_id);
  if public.level_for(v_after) <> public.level_for(v_after - v_new_views) then
    perform public.notify(k.user_id, 'level_up',
      jsonb_build_object('level', public.level_for(v_after), 'hours', public.level_hold_hours(public.level_for(v_after))), '/dashboard');
  end if;
  return v_delta;
end;
$$;

-- Clip status notifications now carry the amount (first payout: "passed the check and earned $X")
create or replace function public.notify_clip()
returns trigger language plpgsql security definer set search_path = public as $$
declare c public.campaigns%rowtype;
begin
  select * into c from public.campaigns where id = new.campaign_id;
  if tg_op = 'INSERT' then
    perform public.notify(c.brand_id, 'new_clip', jsonb_build_object('campaign', c.title, 'platform', new.platform), '/dashboard/campaigns/' || c.id);
  elsif new.status is distinct from old.status and new.status in ('verified', 'rejected', 'flagged') then
    perform public.notify(new.user_id, 'clip_' || new.status,
      jsonb_build_object('campaign', c.title, 'reason', new.status_reason, 'amount', nullif(new.earnings, 0)), '/dashboard/clips');
  end if;
  return new;
end;
$$;

-- Appeals ----------------------------------------------------------------------
create table if not exists public.clip_appeals (
  id bigserial primary key,
  clip_id uuid not null references public.clips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 10 and 1000),
  proof_url text check (proof_url is null or proof_url ~* '^https?://'),
  status text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  reply text,
  decided_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists clip_appeals_one_open on public.clip_appeals (clip_id) where status = 'open';
alter table public.clip_appeals enable row level security;
drop policy if exists "appeals: owner or staff" on public.clip_appeals;
create policy "appeals: owner or staff" on public.clip_appeals
  for select using (user_id = auth.uid() or public.is_staff());
-- writes: appeal_clip / decide_appeal only

-- [clipper] Contest a rejected or flagged clip (twice at most)
create or replace function public.appeal_clip(p_clip_id uuid, p_message text, p_proof_url text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_title text;
begin
  select c.title into v_title from public.clips k join public.campaigns c on c.id = k.campaign_id
   where k.id = p_clip_id and k.user_id = auth.uid() and k.status in ('rejected', 'flagged');
  if not found then raise exception 'only your rejected or flagged clips can be appealed'; end if;
  if exists (select 1 from public.clip_appeals where clip_id = p_clip_id and status = 'open') then
    raise exception 'this clip already has an open appeal';
  end if;
  if (select count(*) from public.clip_appeals where clip_id = p_clip_id) >= 2 then
    raise exception 'this clip has already been appealed twice';
  end if;
  insert into public.clip_appeals (clip_id, user_id, message, proof_url)
  values (p_clip_id, auth.uid(), trim(p_message), nullif(trim(coalesce(p_proof_url, '')), ''))
  returning id into v_id;
  perform public.notify(p.id, 'new_appeal', jsonb_build_object('campaign', v_title), '/dashboard/moderation')
     from public.profiles p where p.role in ('moderator', 'admin');
  return v_id;
end;
$$;

-- [staff] Accept (the clip goes back to tracking and can be paid) or decline, with a reply
create or replace function public.decide_appeal(p_appeal_id bigint, p_accept boolean, p_reply text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.clip_appeals%rowtype; v_title text;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  select * into a from public.clip_appeals where id = p_appeal_id for update;
  if not found or a.status <> 'open' then raise exception 'appeal is not open'; end if;
  if a.user_id = auth.uid() then raise exception 'you cannot decide your own appeal'; end if;
  perform public.trust();
  update public.clip_appeals
     set status = case when p_accept then 'accepted' else 'declined' end,
         reply = nullif(trim(coalesce(p_reply, '')), ''), decided_by = auth.uid(), decided_at = now()
   where id = a.id;
  if p_accept then
    update public.clips set status = 'tracking_hold', status_reason = null, owner_check = 'matched' where id = a.clip_id;
  end if;
  select c.title into v_title from public.clips k join public.campaigns c on c.id = k.campaign_id where k.id = a.clip_id;
  perform public.notify(a.user_id, case when p_accept then 'appeal_accepted' else 'appeal_declined' end,
    jsonb_build_object('campaign', v_title, 'reason', nullif(trim(coalesce(p_reply, '')), '')), '/dashboard/clips');
end;
$$;

-- Category alerts ----------------------------------------------------------------
-- Categories are stored as language-neutral keys from now on (the site translates them).
do $$ begin perform public.trust(); update public.campaigns set category = case when category in ('Podcasts & interviews', 'podcasts', 'Подкасттар мен сұхбаттар', 'Подкасты и интервью') then 'podcasts' when category in ('Streaming', 'streaming', 'Стримдер', 'Стримы') then 'streaming' when category in ('Gaming', 'gaming', 'Игры', 'Ойындар') then 'gaming' when category in ('Music', 'music', 'Музыка') then 'music' when category in ('Sports', 'sports', 'Спорт') then 'sports' when category in ('Tech & apps', 'tech', 'Технологии и приложения', 'Технология және қосымшалар') then 'tech' when category in ('Finance', 'finance', 'Финансы', 'Қаржы') then 'finance' when category in ('Lifestyle', 'lifestyle', 'Лайфстайл') then 'lifestyle' when category in ('Education', 'education', 'Білім', 'Образование') then 'education' when category in ('Other', 'other', 'Басқа', 'Другое') then 'other' else category end
 where category is not null; end $$;

create table if not exists public.category_follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('podcasts', 'streaming', 'gaming', 'music', 'sports', 'tech', 'finance', 'lifestyle', 'education', 'other')),
  created_at timestamptz not null default now(),
  primary key (user_id, category)
);
alter table public.category_follows enable row level security;
drop policy if exists "follows: own" on public.category_follows;
create policy "follows: own" on public.category_follows
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A campaign goes live → everyone following its category hears about it
create or replace function public.notify_category_followers()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_cpm numeric;
begin
  if new.status = 'active' and old.status = 'pending_review' and new.category is not null then
    select coalesce(max((v->>'cpm')::numeric), new.cpm_rate) into v_cpm from jsonb_each(coalesce(new.platform_rates, '{}'::jsonb)) e(k, v);
    insert into public.notifications (user_id, kind, data, link)
    select f.user_id, 'new_campaign',
           jsonb_build_object('campaign', new.title, 'brand', new.brand_name, 'category', new.category, 'cpm', v_cpm),
           '/dashboard/campaigns/' || new.id
      from public.category_follows f
     where f.category = new.category and f.user_id <> new.brand_id;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_category_followers on public.campaigns;
create trigger notify_category_followers after update of status on public.campaigns
  for each row execute function public.notify_category_followers();

-- Telegram ---------------------------------------------------------------------------
-- A user links Telegram by opening t.me/<bot>?start=<code>; the bot webhook calls
-- telegram_connect(). From then on every notification is also sent to their chat by the
-- trigger below, straight from the database (pg_net), with the bot token kept in Vault.
create table if not exists public.telegram_links (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  chat_id bigint unique,
  username text,
  lang text not null default 'en' check (lang in ('en', 'ru', 'kk')),
  enabled boolean not null default true,
  link_code text unique,
  code_expires_at timestamptz,
  linked_at timestamptz
);
alter table public.telegram_links enable row level security;
drop policy if exists "telegram: read own" on public.telegram_links;
create policy "telegram: read own" on public.telegram_links for select using (user_id = auth.uid());
-- writes: functions only

-- [user] One-time code for the deep link (valid 15 minutes)
create or replace function public.telegram_link_code(p_lang text default 'en')
returns text language plpgsql security definer set search_path = public as $$
declare v_code text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  insert into public.telegram_links (user_id, link_code, code_expires_at, lang)
  values (auth.uid(), v_code, now() + interval '15 minutes', case when p_lang in ('en', 'ru', 'kk') then p_lang else 'en' end)
  on conflict (user_id) do update
     set link_code = excluded.link_code, code_expires_at = excluded.code_expires_at, lang = excluded.lang;
  return v_code;
end;
$$;

-- [service] The bot received /start <code>
create or replace function public.telegram_connect(p_code text, p_chat_id bigint, p_username text)
returns json language plpgsql security definer set search_path = public as $$
declare l public.telegram_links%rowtype;
begin
  if not public.is_service() then raise exception 'service only'; end if;
  select * into l from public.telegram_links where link_code = p_code and code_expires_at > now() for update;
  if not found then return null; end if;
  delete from public.telegram_links where chat_id = p_chat_id and user_id <> l.user_id;  -- one account per chat
  update public.telegram_links
     set chat_id = p_chat_id, username = p_username, enabled = true, link_code = null, code_expires_at = null, linked_at = now()
   where user_id = l.user_id;
  return (select json_build_object('name', p.full_name, 'lang', l.lang) from public.profiles p where p.id = l.user_id);
end;
$$;

-- [service] The user sent /stop (or /start again) in the bot
create or replace function public.telegram_chat_enabled(p_chat_id bigint, p_enabled boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v_lang text;
begin
  if not public.is_service() then raise exception 'service only'; end if;
  update public.telegram_links set enabled = p_enabled where chat_id = p_chat_id returning lang into v_lang;
  return v_lang;
end;
$$;

-- [user] Pause / resume / disconnect from the site
create or replace function public.telegram_set_enabled(p_enabled boolean)
returns void language sql security definer set search_path = public as $$
  update public.telegram_links set enabled = p_enabled where user_id = auth.uid();
$$;
create or replace function public.telegram_unlink()
returns void language sql security definer set search_path = public as $$
  delete from public.telegram_links where user_id = auth.uid();
$$;

-- [service] Store the bot token and site address in Vault (called by the admin "Connect bot" button)
create or replace function public.configure_telegram(p_token text, p_site text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_value text;
begin
  if not public.is_service() then raise exception 'service only'; end if;
  foreach v_name in array array['telegram_bot_token', 'telegram_site_url'] loop
    v_value := case v_name when 'telegram_bot_token' then p_token else rtrim(p_site, '/') end;
    if exists (select 1 from vault.secrets where name = v_name) then
      perform vault.update_secret((select id from vault.secrets where name = v_name), v_value);
    else
      perform vault.create_secret(v_value, v_name);
    end if;
  end loop;
end;
$$;

create or replace function public.tg_esc(p text)
returns text language sql immutable as $$
  select replace(replace(replace(coalesce(p, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$$;

-- Notification → message text in the user's language (HTML parse mode)
create or replace function public.telegram_text(p_kind text, p_data jsonb, p_lang text)
returns text language plpgsql immutable as $$
declare
  t jsonb := '{"en": {"clip_verified": "✅ Your clip for {campaign} passed the check {amount}", "clip_rejected": "❌ Your clip for {campaign} was rejected", "clip_flagged": "⚠️ Your clip for {campaign} is being reviewed", "clip_earned": "💸 Your clip earned {amount} more in {campaign}", "new_clip": "🎬 New clip in {campaign} ({platform})", "campaign_funded": "💳 {campaign} is funded and waiting for review", "campaign_approved": "🚀 {campaign} is live — clippers can join now", "campaign_rejected": "❌ {campaign} was not approved", "campaign_completed": "🏁 {campaign} spent its whole budget", "payout_completed": "💸 Payout of {amount} sent", "payout_failed": "❌ Payout of {amount} failed — the money is back on your balance", "account_verified": "✅ {handle} is verified — you can submit clips from it", "appeal_accepted": "✅ Appeal accepted: your clip for {campaign} is back in tracking", "appeal_declined": "❌ Appeal declined for {campaign}", "new_appeal": "📝 New appeal on a clip in {campaign}", "referral_reward": "🎁 You earned {amount} — {name} is earning with Clipte", "level_up": "🏆 You reached {level}! Your clips now wait only {hours}h before payout", "new_campaign": "🔔 New {category} campaign: {campaign} by {brand} — up to {cpm} per 1K views"}, "ru": {"clip_verified": "✅ Ваш клип для {campaign} прошёл проверку {amount}", "clip_rejected": "❌ Ваш клип для {campaign} отклонён", "clip_flagged": "⚠️ Ваш клип для {campaign} на проверке", "clip_earned": "💸 Ваш клип заработал ещё {amount} в {campaign}", "new_clip": "🎬 Новый клип в {campaign} ({platform})", "campaign_funded": "💳 {campaign} оплачена и ждёт проверки", "campaign_approved": "🚀 {campaign} запущена — клиперы уже могут участвовать", "campaign_rejected": "❌ {campaign} не одобрена", "campaign_completed": "🏁 {campaign} израсходовала весь бюджет", "payout_completed": "💸 Выплата {amount} отправлена", "payout_failed": "❌ Выплата {amount} не прошла — деньги вернулись на баланс", "account_verified": "✅ {handle} подтверждён — с него можно отправлять клипы", "appeal_accepted": "✅ Апелляция принята: клип для {campaign} снова отслеживается", "appeal_declined": "❌ Апелляция по {campaign} отклонена", "new_appeal": "📝 Новая апелляция по клипу в {campaign}", "referral_reward": "🎁 Вы получили {amount} — {name} зарабатывает в Clipte", "level_up": "🏆 Новый уровень: {level}! Теперь холд перед выплатой всего {hours} ч", "new_campaign": "🔔 Новая кампания в категории «{category}»: {campaign} от {brand} — до {cpm} за 1K просмотров"}, "kk": {"clip_verified": "✅ {campaign} үшін клипіңіз тексеруден өтті {amount}", "clip_rejected": "❌ {campaign} үшін клипіңіз қабылданбады", "clip_flagged": "⚠️ {campaign} үшін клипіңіз тексерілуде", "clip_earned": "💸 Клипіңіз {campaign} науқанында тағы {amount} тапты", "new_clip": "🎬 {campaign} науқанында жаңа клип ({platform})", "campaign_funded": "💳 {campaign} төленді және тексеруді күтуде", "campaign_approved": "🚀 {campaign} іске қосылды — клиперлер қатыса алады", "campaign_rejected": "❌ {campaign} мақұлданбады", "campaign_completed": "🏁 {campaign} бүкіл бюджетін жұмсады", "payout_completed": "💸 {amount} төлем жіберілді", "payout_failed": "❌ {amount} төлем өтпеді — ақша балансқа қайтарылды", "account_verified": "✅ {handle} расталды — одан клип жіберуге болады", "appeal_accepted": "✅ Апелляция қабылданды: {campaign} клипі қайта бақылануда", "appeal_declined": "❌ {campaign} бойынша апелляция қабылданбады", "new_appeal": "📝 {campaign} науқанындағы клип бойынша жаңа апелляция", "referral_reward": "🎁 Сіз {amount} алдыңыз — {name} Clipte-те табыс табуда", "level_up": "🏆 Жаңа деңгей: {level}! Енді төлем алдындағы холд небәрі {hours} сағ", "new_campaign": "🔔 «{category}» санатында жаңа науқан: {brand} — {campaign}, 1K қаралымға {cpm} дейін"}}'::jsonb;
  levels jsonb := '{"en":{"bronze":"Bronze","silver":"Silver","gold":"Gold","platinum":"Platinum"},"ru":{"bronze":"Бронза","silver":"Серебро","gold":"Золото","platinum":"Платина"},"kk":{"bronze":"Қола","silver":"Күміс","gold":"Алтын","platinum":"Платина"}}'::jsonb;
  cats jsonb := '{"en": {"podcasts": "Podcasts & interviews", "streaming": "Streaming", "gaming": "Gaming", "music": "Music", "sports": "Sports", "tech": "Tech & apps", "finance": "Finance", "lifestyle": "Lifestyle", "education": "Education", "other": "Other"}, "ru": {"podcasts": "Подкасты и интервью", "streaming": "Стримы", "gaming": "Игры", "music": "Музыка", "sports": "Спорт", "tech": "Технологии и приложения", "finance": "Финансы", "lifestyle": "Лайфстайл", "education": "Образование", "other": "Другое"}, "kk": {"podcasts": "Подкасттар мен сұхбаттар", "streaming": "Стримдер", "gaming": "Ойындар", "music": "Музыка", "sports": "Спорт", "tech": "Технология және қосымшалар", "finance": "Қаржы", "lifestyle": "Лайфстайл", "education": "Білім", "other": "Басқа"}}'::jsonb;
  lang text := case when p_lang in ('en', 'ru', 'kk') then p_lang else 'en' end;
  tpl text;
  money text;
begin
  tpl := coalesce(t -> lang ->> p_kind, t -> 'en' ->> p_kind);
  if tpl is null then return null; end if;
  money := case when p_data ? 'amount' and p_data->>'amount' is not null then '$' || to_char((p_data->>'amount')::numeric, 'FM999999990.00') else '' end;
  tpl := replace(tpl, '{campaign}', '<b>' || public.tg_esc(p_data->>'campaign') || '</b>');
  tpl := replace(tpl, '{amount}', '<b>' || money || '</b>');
  tpl := replace(tpl, '{handle}', public.tg_esc(coalesce('@' || (p_data->>'handle'), '')));
  tpl := replace(tpl, '{platform}', public.tg_esc(p_data->>'platform'));
  tpl := replace(tpl, '{name}', public.tg_esc(coalesce(p_data->>'name', '—')));
  tpl := replace(tpl, '{brand}', public.tg_esc(p_data->>'brand'));
  tpl := replace(tpl, '{level}', '<b>' || coalesce(levels -> lang ->> (p_data->>'level'), p_data->>'level', '') || '</b>');
  tpl := replace(tpl, '{hours}', coalesce(p_data->>'hours', ''));
  tpl := replace(tpl, '{category}', public.tg_esc(coalesce(cats -> lang ->> (p_data->>'category'), p_data->>'category', '')));
  tpl := replace(tpl, '{cpm}', case when p_data->>'cpm' is not null then '$' || to_char((p_data->>'cpm')::numeric, 'FM999990.##') else '' end);
  if coalesce(p_data->>'reason', p_data->>'reference', '') <> '' then
    tpl := tpl || E'\n<i>' || public.tg_esc(coalesce(p_data->>'reason', p_data->>'reference')) || '</i>';
  end if;
  return tpl;
end;
$$;

-- Every new notification → Telegram (when linked and enabled). Never blocks the notification:
-- missing pg_net / Vault / token, or any send error, is ignored.
create or replace function public.telegram_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  l public.telegram_links%rowtype;
  v_text text; v_token text; v_site text; v_button text;
begin
  select * into l from public.telegram_links where user_id = new.user_id and chat_id is not null and enabled;
  if not found then return new; end if;
  v_text := public.telegram_text(new.kind, new.data, l.lang);
  if v_text is null then return new; end if;
  begin
    execute 'select decrypted_secret from vault.decrypted_secrets where name = ''telegram_bot_token''' into v_token;
    execute 'select decrypted_secret from vault.decrypted_secrets where name = ''telegram_site_url''' into v_site;
    if v_token is null then return new; end if;
    v_button := case l.lang when 'ru' then 'Открыть Clipte' when 'kk' then 'Clipte ашу' else 'Open Clipte' end;
    execute 'select net.http_post(url := $1, body := $2, headers := ''{"Content-Type": "application/json"}''::jsonb)'
      using 'https://api.telegram.org/bot' || v_token || '/sendMessage',
            jsonb_strip_nulls(jsonb_build_object(
              'chat_id', l.chat_id,
              'text', v_text,
              'parse_mode', 'HTML',
              'disable_web_page_preview', true,
              'reply_markup', case when v_site is not null and new.link is not null then
                jsonb_build_object('inline_keyboard', jsonb_build_array(jsonb_build_array(jsonb_build_object('text', v_button, 'url', v_site || new.link))))
              end));
  exception when others then
    null;
  end;
  return new;
end;
$$;
drop trigger if exists telegram_on_notification on public.notifications;
create trigger telegram_on_notification after insert on public.notifications
  for each row execute function public.telegram_on_notification();

-- grants ---------------------------------------------------------------------------
revoke execute on function
  public.level_for(bigint), public.level_rank(text), public.level_hold_hours(text), public.paid_views_of(uuid), public.my_paid_views(),
  public.my_level(), public.creator_level(uuid), public.my_referrals(), public.appeal_clip(uuid, text, text), public.decide_appeal(bigint, boolean, text),
  public.telegram_link_code(text), public.telegram_connect(text, bigint, text), public.telegram_chat_enabled(bigint, boolean),
  public.telegram_set_enabled(boolean), public.telegram_unlink(), public.configure_telegram(text, text),
  public.tg_esc(text), public.telegram_text(text, jsonb, text)
  from public, anon;
grant execute on function
  public.level_for(bigint), public.level_rank(text), public.level_hold_hours(text), public.my_paid_views(),
  public.my_level(), public.creator_level(uuid), public.my_referrals(), public.appeal_clip(uuid, text, text), public.decide_appeal(bigint, boolean, text),
  public.telegram_link_code(text), public.telegram_set_enabled(boolean), public.telegram_unlink()
  to authenticated;
grant execute on function
  public.level_for(bigint), public.level_rank(text), public.level_hold_hours(text), public.paid_views_of(uuid), public.my_paid_views(),
  public.my_level(), public.creator_level(uuid), public.my_referrals(), public.appeal_clip(uuid, text, text), public.decide_appeal(bigint, boolean, text),
  public.telegram_link_code(text), public.telegram_connect(text, bigint, text), public.telegram_chat_enabled(bigint, boolean),
  public.telegram_set_enabled(boolean), public.telegram_unlink(), public.configure_telegram(text, text),
  public.tg_esc(text), public.telegram_text(text, jsonb, text)
  to service_role;

-- [user] Google sign-ups can't carry the invite code through OAuth, so the site remembers it and
-- claims it on the first dashboard visit: only within a day of joining, only once, never your own.
create or replace function public.claim_referral(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ref uuid;
begin
  select id into v_ref from public.profiles where referral_code = p_code and id <> auth.uid();
  if v_ref is null then return false; end if;
  perform public.trust();
  update public.profiles set referred_by = v_ref
   where id = auth.uid() and referred_by is null and created_at > now() - interval '1 day';
  return found;
end;
$$;
revoke execute on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated, service_role;
