-- TEST ONLY — skip the 48-hour fraud hold for the newest clip and pay it now.
-- Run in the Supabase SQL Editor (it runs as the service role, so the money functions allow it).
-- Never run this on real clips in production.

-- 1. See the newest clips
select id, platform, video_url, owner_check, owner_handle, view_count, earnings, status, hold_until
from public.clips order by created_at desc limit 5;

-- 2. Fast-forward: give the newest clip some views and end its hold
--    (change 25000 to any view count you want to test with)
with c as (select id from public.clips order by created_at desc limit 1)
select public.record_view_snapshot(c.id, 25000, 'test'), c.id from c;

--    and mark its owner as confirmed (in real use a moderator does that by restoring the clip)
update public.clips set hold_until = now() - interval '1 minute', owner_check = 'matched'
where id = (select id from public.clips order by created_at desc limit 1);

-- 3. Pay it (returns the amount credited to the clipper)
select public.settle_clip(id) as paid_now
from public.clips order by created_at desc limit 1;

-- 4. Check the result
select k.status, k.view_count, k.earnings, p.balance_earnings as clipper_balance, c.remaining_budget as campaign_left
from public.clips k
join public.profiles p on p.id = k.user_id
join public.campaigns c on c.id = k.campaign_id
order by k.created_at desc limit 1;
