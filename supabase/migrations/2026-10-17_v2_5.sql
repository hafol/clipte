-- Clipte schema v2.5 — campaign chats are for signed-in users only (anonymous visitors could read them).
-- Run once after v2.4 (safe to re-run).
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
