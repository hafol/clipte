-- Demo campaigns for previewing the dashboard (Discover, campaign pages, brand view).
-- Run AFTER supabase/migrations/2026-10-12_v2_1.sql, in the Supabase SQL Editor.
-- Everything belongs to one demo brand account (demo-brand@clipte.dev) that nobody can log in to.
-- Remove it all before launch with supabase/seed/remove_demo.sql.

-- 1. demo brand (no password → cannot sign in); the profile is created by the handle_new_user trigger
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  'd3d3d3d3-0000-4000-8000-000000000001',
  'authenticated', 'authenticated',
  'demo-brand@clipte.dev',
  '{"full_name": "Clipte Demo Brand"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  now(), now()
)
on conflict (id) do nothing;

update public.profiles
   set has_brand_profile = true, brand_name = 'Clipte Demo Brand'
 where id = 'd3d3d3d3-0000-4000-8000-000000000001';

-- 2. campaigns (inserted from the SQL editor, so the guard lets status / budget through)
insert into public.campaigns
  (id, brand_id, title, brand_name, category, drive_url, cover_url, hashtags, description, dos, donts, brand_handle,
   platforms, platform_rates, cpm_rate, escrow_budget, remaining_budget, views_delivered, status, created_at)
values
  ('d3d3d3d3-c000-4000-8000-000000000001', 'd3d3d3d3-0000-4000-8000-000000000001',
   'Best moments from The Late Talk podcast', 'Late Talk', 'Podcasts & interviews',
   'https://drive.google.com/drive/folders/demo-late-talk',
   'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1280&auto=format&fit=crop&q=80',
   array['#latetalk', '#podcast', '#clipte'],
   'Two hosts, one hot topic every week. Clip the funniest and sharpest moments — the kind that make people want the full episode.',
   array['Vertical 9:16, at least 1080p', 'Strong hook in the first 3 seconds', 'Clear subtitles', 'Tag our account in the caption'],
   array['No footage that isn’t ours', 'No bought views, bots or engagement pods'],
   'latetalkshow', array['tiktok', 'youtube', 'instagram'],
   '{"tiktok": {"cpm": 1.75, "maxCap": 400}, "youtube": {"cpm": 2.25, "minPayout": 1, "maxCap": 500}, "instagram": {"cpm": 1.5, "maxCap": 300}}',
   1.5, 4000, 2850, 657000, 'active', now() - interval '6 days'),

  ('d3d3d3d3-c000-4000-8000-000000000002', 'd3d3d3d3-0000-4000-8000-000000000001',
   'Ranked clutch plays & funny fails', 'Respawn Arena', 'Gaming',
   'https://drive.google.com/drive/folders/demo-respawn',
   'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1280&auto=format&fit=crop&q=80',
   array['#respawnarena', '#gaming', '#clutch'],
   'Weekly tournament VODs. Find the 1v3 clutches, the rage moments and the chat reactions. Fast cuts, loud sound, big captions.',
   array['Show the scoreboard or kill feed', 'Keep it under 60 seconds', 'Credit the player in the caption'],
   array['No reposting other creators’ clips', 'No misleading thumbnails or captions'],
   'respawnarena', array['tiktok', 'youtube'],
   '{"tiktok": {"cpm": 1.5, "maxCap": 250}, "youtube": {"cpm": 2.0, "maxCap": 350}}',
   1.5, 2500, 2100, 210000, 'active', now() - interval '3 days'),

  ('d3d3d3d3-c000-4000-8000-000000000003', 'd3d3d3d3-0000-4000-8000-000000000001',
   'AI app feature demos in 30 seconds', 'Nova AI', 'Tech & apps',
   'https://drive.google.com/drive/folders/demo-nova',
   'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&auto=format&fit=crop&q=80',
   array['#novaai', '#ai', '#productivity'],
   'Screen recordings of our app doing something useful in seconds. Turn them into “wait, it can do that?” clips with a clear before/after.',
   array['Show the result in the first 5 seconds', 'Add a short voice-over or captions', 'Mention “Nova AI” on screen'],
   array['No fake claims about features', 'No competitor bashing'],
   'novaai', array['tiktok', 'youtube', 'instagram'],
   '{"tiktok": {"cpm": 2.5, "minPayout": 2, "maxCap": 600}, "youtube": {"cpm": 3.0, "minPayout": 2, "maxCap": 800}, "instagram": {"cpm": 2.25, "maxCap": 500}}',
   2.25, 6000, 5400, 240000, 'active', now() - interval '1 day'),

  ('d3d3d3d3-c000-4000-8000-000000000004', 'd3d3d3d3-0000-4000-8000-000000000001',
   'Street football skills from the summer cup', 'Urban Cup', 'Sports',
   'https://drive.google.com/drive/folders/demo-urban-cup',
   null,
   array['#urbancup', '#football', '#skills'],
   'Raw footage from 40 matches. Nutmegs, rainbow flicks, last-minute goals. Make it hype.',
   array['Slow-motion on the key moment', 'Music must be royalty-free'],
   array['No clips from other tournaments'],
   'urbancup', array['tiktok', 'instagram'],
   '{"tiktok": {"cpm": 1.25, "maxCap": 200}, "instagram": {"cpm": 1.25, "maxCap": 200}}',
   1.25, 1500, 1320, 144000, 'active', now() - interval '9 days'),

  ('d3d3d3d3-c000-4000-8000-000000000005', 'd3d3d3d3-0000-4000-8000-000000000001',
   'Money tips that fit in one clip', 'Smart Coin', 'Finance',
   'https://drive.google.com/drive/folders/demo-smart-coin',
   'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1280&auto=format&fit=crop&q=80',
   array['#smartcoin', '#money', '#tips'],
   'Short lessons from our long-form finance videos. One tip per clip, explained simply — for students and first jobs.',
   array['One idea per clip', 'Add on-screen text with the key number'],
   array['No “get rich quick” promises', 'No investment advice beyond the source video'],
   'smartcoin', array['youtube', 'instagram'],
   '{"youtube": {"cpm": 2.75, "maxCap": 450}, "instagram": {"cpm": 2.0, "maxCap": 300}}',
   2.0, 3000, 2950, 22000, 'active', now() - interval '12 hours'),

  ('d3d3d3d3-c000-4000-8000-000000000006', 'd3d3d3d3-0000-4000-8000-000000000001',
   'Live session highlights — new album tour', 'Moonline', 'Music',
   'https://drive.google.com/drive/folders/demo-moonline',
   null,
   array['#moonline', '#livemusic', '#tour'],
   'Backstage, crowd singing, the chorus drop. Clip the moments that give goosebumps.',
   array['Keep the original audio', 'Tag the city in the caption'],
   array['No speeding up or pitching the songs'],
   'moonlineband', array['tiktok', 'youtube', 'instagram'],
   '{"tiktok": {"cpm": 1.5, "maxCap": 300}, "youtube": {"cpm": 1.75, "maxCap": 300}, "instagram": {"cpm": 1.5, "maxCap": 300}}',
   1.5, 2000, 640, 905000, 'active', now() - interval '15 days')
on conflict (id) do nothing;
