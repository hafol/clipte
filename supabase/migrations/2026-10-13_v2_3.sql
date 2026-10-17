-- Clipte schema v2.3 — real messenger + notifications. Run once after v2.2 (safe to re-run).

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
