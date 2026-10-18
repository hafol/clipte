// Security test-suite for supabase/schema.sql — runs a real Postgres (PGlite) locally.
// Usage: npm run test:db
// Loads supabase/schema.sql into PGlite with Supabase stubs, then runs attack/flow scenarios.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const schemaPath = process.argv[2] || new URL('../schema.sql', import.meta.url);
const db = new PGlite();

// ---- Supabase stubs -------------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create publication supabase_realtime;
`);

await db.exec(fs.readFileSync(schemaPath, 'utf8'));
console.log('schema loaded OK\n');

// ---- helpers --------------------------------------------------------
const ids = {
  clipper: '11111111-1111-1111-1111-111111111111',
  brand: '22222222-2222-2222-2222-222222222222',
  mod: '33333333-3333-3333-3333-333333333333',
  admin: '44444444-4444-4444-4444-444444444444',
};
for (const [name, id] of Object.entries(ids)) {
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [id, `${name}@test.dev`]);
}
await db.exec(`update public.profiles set role = 'moderator' where email = 'mod@test.dev';
               update public.profiles set role = 'admin' where email = 'admin@test.dev';`);

const as = async (who) => {
  await db.exec('reset role');
  if (who === 'service') {
    await db.exec(`set role service_role; select set_config('request.jwt.claims', '{"role":"service_role"}', false);`);
  } else if (who === 'anon') {
    await db.exec(`set role anon; select set_config('request.jwt.claims', '{"role":"anon"}', false);`);
  } else {
    await db.exec(`set role authenticated; select set_config('request.jwt.claims', '{"sub":"${ids[who]}","role":"authenticated"}', false);`);
  }
};

let pass = 0, fail = 0;
const expectFail = async (label, who, sql, params = []) => {
  await as(who);
  try { await db.query(sql, params); console.log(`  ✗ SHOULD HAVE FAILED: ${label}`); fail++; }
  catch (e) { console.log(`  ✓ blocked: ${label}  (${e.message.split('\n')[0]})`); pass++; }
};
const expectOk = async (label, who, sql, params = [], check) => {
  await as(who);
  try {
    const r = await db.query(sql, params);
    if (check && !check(r.rows)) { console.log(`  ✗ wrong result: ${label} → ${JSON.stringify(r.rows)}`); fail++; return r.rows; }
    console.log(`  ✓ ok: ${label}`); pass++; return r.rows;
  } catch (e) { console.log(`  ✗ ERROR: ${label}  (${e.message.split('\n')[0]})`); fail++; return []; }
};

// ---- scenarios ------------------------------------------------------
console.log('Profiles');
await expectFail('clipper sets own balance', 'clipper', `update public.profiles set balance_earnings = 9999 where id = $1`, [ids.clipper]);
await expectFail('clipper makes self admin', 'clipper', `update public.profiles set role = 'admin' where id = $1`, [ids.clipper]);
await expectOk('clipper edits own name', 'clipper', `update public.profiles set full_name = 'Alex' where id = $1 returning full_name`, [ids.clipper], (r) => r[0]?.full_name === 'Alex');
await expectOk('clipper cannot read others', 'clipper', `select * from public.profiles where id <> $1`, [ids.clipper], (r) => r.length === 0);
await expectFail('anon cannot read public_profiles', 'anon', `select count(*)::int n from public.public_profiles`);
await expectOk('signed-in user reads public_profiles', 'brand', `select count(*)::int n from public.public_profiles`, [], (r) => r[0].n === 4);
await expectFail('public_profiles has no email column', 'brand', `select email from public.public_profiles`);

console.log('\nMoney functions are not callable by users');
await expectFail('clipper calls internal trust()', 'clipper', `select public.trust()`);
await expectFail('clipper calls settle_clip', 'clipper', `select public.settle_clip(gen_random_uuid())`);
await expectFail('clipper calls confirm_escrow_deposit', 'clipper', `select public.confirm_escrow_deposit(1, 100)`);
await expectFail('anon calls request_payout', 'anon', `select public.request_payout(gen_random_uuid())`);

console.log('\nCampaign lifecycle');
const [camp] = await expectOk('brand creates campaign (forced to pending_payment, $0)', 'brand',
  `insert into public.campaigns (title, brand_name, drive_url, platforms, platform_rates, cpm_rate, status, remaining_budget, escrow_budget)
   values ('Test', 'Brand', 'https://drive', array['youtube'], '{"youtube":{"cpm":2,"minPayout":1,"maxCap":150}}', 2, 'active', 99999, 99999)
   returning id, status, remaining_budget::float rb, brand_id`, [],
  (r) => r[0].status === 'pending_payment' && r[0].rb === 0 && r[0].brand_id === ids.brand);
await expectFail('brand sets own campaign active', 'brand', `update public.campaigns set status = 'active' where id = $1`, [camp.id]);
await expectFail('brand adds budget directly', 'brand', `update public.campaigns set remaining_budget = 5000 where id = $1`, [camp.id]);
await expectFail('brand calls approve_campaign', 'brand', `select public.approve_campaign($1)`, [camp.id]);
await expectOk('anon can read active campaigns list (no permission error)', 'anon', `select count(*)::int n from public.campaigns`, [], (r) => r[0].n === 0);

await expectOk('server records invoice', 'service', `insert into public.escrow_deposits (brand_id, campaign_id, invoice_id, amount) values ($1, $2, 777, 500)`, [ids.brand, camp.id]);
await expectFail('clipper confirms deposit', 'clipper', `select public.confirm_escrow_deposit(777, 500)`);
await expectFail('underpaid invoice rejected', 'service', `select public.confirm_escrow_deposit(777, 10)`);
await expectOk('webhook confirms deposit', 'service', `select public.confirm_escrow_deposit(777, 500) ok`, [], (r) => r[0].ok === true);
await expectOk('duplicate webhook is ignored', 'service', `select public.confirm_escrow_deposit(777, 500) ok`, [], (r) => r[0].ok === false);
await expectOk('campaign now funded & awaiting review', 'service', `select status, remaining_budget::float rb from public.campaigns where id = $1`, [camp.id], (r) => r[0].status === 'pending_review' && r[0].rb === 500);
await expectOk('moderator approves', 'mod', `select public.approve_campaign($1)`, [camp.id]);
await expectOk('campaign active', 'anon', `select status from public.campaigns where id = $1`, [camp.id], (r) => r[0]?.status === 'active');
await expectFail('brand changes rates on live campaign', 'brand', `update public.campaigns set cpm_rate = 0.01 where id = $1`, [camp.id]);
await expectOk('brand may pause own campaign', 'brand', `update public.campaigns set status = 'paused' where id = $1`, [camp.id]);
await expectOk('brand may resume own campaign', 'brand', `update public.campaigns set status = 'active' where id = $1`, [camp.id]);

console.log('\nSocial accounts & clips');
const [acc] = await expectOk('clipper adds account (verified_at forced null)', 'clipper',
  `insert into public.social_accounts (user_id, platform, handle, verified_at, verify_code) values ($1, 'youtube', 'alexclips', now(), 'MINE')
   returning id, verified_at, verify_code`, [ids.clipper], (r) => r[0].verified_at === null && r[0].verify_code !== 'MINE');
await expectOk('clipper marking own account verified changes nothing', 'clipper', `update public.social_accounts set verified_at = now() where id = $1 returning id`, [acc.id], (r) => r.length === 0);
await expectOk('…still unverified', 'service', `select verified_at from public.social_accounts where id = $1`, [acc.id], (r) => r[0].verified_at === null);
await expectFail('clip from unverified account', 'clipper',
  `insert into public.clips (campaign_id, social_account_id, platform, video_url, video_key) values ($1, $2, 'youtube', 'https://youtu.be/x', 'x')`, [camp.id, acc.id]);
await expectOk('server verifies the account', 'service', `update public.social_accounts set verified_at = now() where id = $1`, [acc.id]);
const [clip] = await expectOk('clipper submits clip (counts forced to 0)', 'clipper',
  `insert into public.clips (campaign_id, social_account_id, platform, video_url, video_key, view_count, earnings, status, owner_check, owner_handle)
   values ($1, $2, 'youtube', 'https://youtu.be/abc', 'abc', 9999999, 9999, 'verified', 'matched', 'alexclips') returning id, view_count::int v, earnings::float e, status, owner_check oc`,
  [camp.id, acc.id], (r) => r[0].v === 0 && r[0].e === 0 && r[0].status === 'tracking_hold' && r[0].oc === null);
await expectOk('clipper editing own view count changes nothing', 'clipper', `update public.clips set view_count = 10000000 where id = $1 returning id`, [clip.id], (r) => r.length === 0);
await expectOk('…still 0 views', 'service', `select view_count::int v from public.clips where id = $1`, [clip.id], (r) => r[0].v === 0);
await expectFail('same video submitted twice', 'clipper',
  `insert into public.clips (campaign_id, social_account_id, platform, video_url, video_key) values ($1, $2, 'youtube', 'https://youtube.com/shorts/abc', 'abc')`, [camp.id, acc.id]);
await expectOk('brand sees clips on its campaign', 'brand', `select count(*)::int n from public.clips`, [], (r) => r[0].n === 1);
await expectOk('brand sees the posting handle', 'brand', `select handle from public.social_accounts`, [], (r) => r[0]?.handle === 'alexclips');

console.log('\nTracking & settlement');
await expectFail('clipper records own views', 'clipper', `select public.record_view_snapshot($1, 5000000, 'fake')`, [clip.id]);
await expectOk('tracker records 50,000 views', 'service', `select public.record_view_snapshot($1, 50000, 'youtube_page')`, [clip.id]);
await expectOk('settle during hold pays nothing', 'service', `select public.settle_clip($1)::float paid`, [clip.id], (r) => r[0].paid === 0);
await expectOk('(test) hold ends', 'service', `update public.clips set hold_until = now() - interval '1 minute' where id = $1`, [clip.id]);
await expectOk('settle with owner unconfirmed pays nothing', 'service', `select public.settle_clip($1)::float paid`, [clip.id], (r) => r[0].paid === 0);
await expectOk('…and flags it for a moderator', 'service', `select status, owner_check oc from public.clips where id = $1`, [clip.id], (r) => r[0].status === 'flagged' && r[0].oc === null);
await expectFail('clipper cannot restore own clip', 'clipper', `select public.moderate_clip($1, 'tracking_hold', null)`, [clip.id]);
await expectOk('moderator restore confirms the owner', 'mod', `select public.moderate_clip($1, 'tracking_hold', null)`, [clip.id]);
await expectOk('…owner now matched', 'service', `select status, owner_check oc from public.clips where id = $1`, [clip.id], (r) => r[0].status === 'tracking_hold' && r[0].oc === 'matched');
await expectOk('settle pays 50k × $2 CPM = $100', 'service', `select public.settle_clip($1)::float paid`, [clip.id], (r) => r[0].paid === 100);
await expectOk('settle again pays nothing (idempotent)', 'service', `select public.settle_clip($1)::float paid`, [clip.id], (r) => r[0].paid === 0);
await expectOk('tracker records 200,000 views', 'service', `select public.record_view_snapshot($1, 200000, 'youtube_page')`, [clip.id]);
await expectOk('per-clip cap $150 respected (+$50)', 'service', `select public.settle_clip($1)::float paid`, [clip.id], (r) => r[0].paid === 50);
await expectOk('balances consistent', 'service',
  `select (select balance_earnings::float from public.profiles where id = $1) bal,
          (select remaining_budget::float from public.campaigns where id = $2) rb`, [ids.clipper, camp.id],
  (r) => r[0].bal === 150 && r[0].rb === 350);

console.log('\nPublic read functions');
await expectOk('leaderboard shows the clipper', 'mod', `select views::int v, clips from public.campaign_leaderboard($1)`, [camp.id], (r) => r.length === 1 && r[0].v === 200000);
await expectOk('card stats count clips/clippers', 'clipper', `select clips, clippers from public.campaign_public_stats(array[$1]::uuid[])`, [camp.id], (r) => r[0]?.clips === 1 && r[0]?.clippers === 1);
await expectOk('creator stats', 'brand', `select clips, views::int v from public.creator_public_stats($1)`, [ids.clipper], (r) => r[0].clips === 1 && r[0].v === 200000);
await expectOk('card stats return faces', 'brand', `select clippers, faces from public.campaign_card_stats(array[$1]::uuid[])`, [camp.id], (r) => r[0]?.clippers === 1 && Array.isArray(r[0]?.faces) && r[0].faces.length === 1);
await expectFail('anon cannot read card stats', 'anon', `select * from public.campaign_card_stats(array[$1]::uuid[])`, [camp.id]);
await expectFail('anon cannot read leaderboard', 'anon', `select * from public.campaign_leaderboard($1)`, [camp.id]);
await expectOk('referral count works', 'clipper', `select public.my_referral_count() n`, [], (r) => r[0].n === 0);
await expectOk('brand may edit the brief of a live campaign', 'brand',
  `update public.campaigns set description = 'new brief', dos = array['hook in 3s'] where id = $1 returning description`, [camp.id], (r) => r[0]?.description === 'new brief');

await expectOk('(test) brand adds an unverified account', 'brand', `insert into public.social_accounts (user_id, platform, handle) values ($1, 'tiktok', 'brandtok') returning id`, [ids.brand]);
await expectFail('clipper cannot staff-verify', 'clipper', `select public.staff_verify_account(id) from public.social_accounts where handle = 'alexclips'`);
await expectOk('moderator verifies by hand', 'mod', `select public.staff_verify_account(id) from public.social_accounts where handle = 'brandtok'`);
await expectOk('account is verified', 'brand', `select verified_at is not null v from public.social_accounts where handle = 'brandtok'`, [], (r) => r[0].v === true);

console.log('\nPayouts');
await expectFail('payout without a method', 'clipper', `select public.request_payout(gen_random_uuid())`);
const [method] = await expectOk('clipper adds PayPal method', 'clipper',
  `insert into public.payout_methods (user_id, type, address, is_default) values ($1, 'paypal', 'alex@paypal.test', true) returning id`, [ids.clipper]);
await expectFail("clipper uses another user's method id", 'brand', `select public.request_payout($1)`, [method.id]);
const [po] = await expectOk('clipper requests payout', 'clipper', `select public.request_payout($1) id`, [method.id]);
await expectOk('balance moved to payout', 'clipper', `select balance_earnings::float b from public.profiles where id = $1`, [ids.clipper], (r) => r[0].b === 0);
await expectFail('second payout while one is processing', 'clipper', `select public.request_payout($1)`, [method.id]);
await expectFail('moderator processes payout', 'mod', `select public.process_payout($1, 'completed', 'tx')`, [po.id]);
await expectOk('admin marks payout failed', 'admin', `select public.process_payout($1, 'failed', 'wrong email')`, [po.id]);
await expectOk('failed payout returns to balance', 'clipper', `select balance_earnings::float b from public.profiles where id = $1`, [ids.clipper], (r) => r[0].b === 150);

console.log('\nModeration');
await expectFail('clipper moderates own clip', 'clipper', `select public.moderate_clip($1, 'tracking_hold', null)`, [clip.id]);
await expectOk('moderator flags clip', 'mod', `select public.moderate_clip($1, 'flagged', 'spike')`, [clip.id]);
await expectOk('tracker keeps recording flagged clip', 'service', `select public.record_view_snapshot($1, 900000, 'youtube_page')`, [clip.id]);
await expectOk('flagged clip earns nothing more', 'service', `select public.settle_clip($1)::float paid`, [clip.id], (r) => r[0].paid === 0);
await expectOk('moderator rejects campaign → budget back to brand', 'mod', `select public.reject_campaign($1, 'test')`, [camp.id]);
await expectOk('brand escrow refunded $350', 'brand', `select balance_escrow::float b from public.profiles where id = $1`, [ids.brand], (r) => r[0].b === 350);

console.log('\nMessenger');
await db.exec('reset role');
ids.newbie = '55555555-5555-5555-5555-555555555555';
await db.query(`insert into auth.users (id, email) values ($1, 'newbie@test.dev')`, [ids.newbie]);
const [dm] = await expectOk('clipper with earnings starts a DM', 'clipper', `select public.start_direct($1) id`, [ids.brand]);
await expectOk('same pair reuses the chat', 'brand', `select public.start_direct($1) id`, [ids.clipper], (r) => r[0].id === dm.id);
await expectFail('newbie with $0 cannot cold-DM', 'newbie', `select public.start_direct($1)`, [ids.clipper]);
await expectOk('newbie can always DM staff', 'newbie', `select public.start_direct($1) id`, [ids.mod]);
await expectFail('no DM with yourself', 'clipper', `select public.start_direct($1)`, [ids.clipper]);
await expectFail('conversations cannot be inserted directly', 'clipper',
  `insert into public.conversations (type, participant_one, participant_two) values ('direct', $1, $2)`, [ids.clipper, ids.newbie]);
const [msg] = await expectOk('clipper sends a message (sender forced)', 'clipper',
  `insert into public.direct_messages (conversation_id, sender_id, text) values ($1, $2, 'ping me on t.me/alex') returning id, sender_id, has_leak_warning`, [dm.id, ids.brand],
  (r) => r[0].sender_id === ids.clipper && r[0].has_leak_warning === true);
await expectOk('preview updated', 'brand', `select last_message_text t from public.conversations where id = $1`, [dm.id], (r) => r[0].t === 'ping me on t.me/alex');
await expectOk('brand sees 1 unread', 'brand', `select unread from public.my_unread() where conversation_id = $1`, [dm.id], (r) => r[0]?.unread === 1);
await expectFail('brand cannot edit the text', 'brand', `update public.direct_messages set text = 'edited' where id = $1`, [msg.id]);
await expectFail('sender cannot mark own message read', 'clipper', `update public.direct_messages set is_read = true where id = $1`, [msg.id]);
await expectOk('recipient marks it read', 'brand', `update public.direct_messages set is_read = true where id = $1 returning is_read`, [msg.id], (r) => r[0]?.is_read === true);
await expectOk('outsider sees no messages', 'newbie', `select count(*)::int n from public.direct_messages where conversation_id = $1`, [dm.id], (r) => r[0].n === 0);
const [sup] = await expectOk('clipper opens support', 'clipper', `select public.my_support_conversation() id`);
await expectOk('support is reused', 'clipper', `select public.my_support_conversation() id`, [], (r) => r[0].id === sup.id);
await expectOk('clipper writes to support', 'clipper', `insert into public.direct_messages (conversation_id, text) values ($1, 'help') returning id`, [sup.id]);
await expectOk('moderator reads support', 'mod', `select count(*)::int n from public.direct_messages where conversation_id = $1`, [sup.id], (r) => r[0].n === 1);
await expectOk('brand cannot read clipper support', 'brand', `select count(*)::int n from public.direct_messages where conversation_id = $1`, [sup.id], (r) => r[0].n === 0);
await expectOk('(test) moderator opens campaign room', 'mod', `select public.campaign_room($1) id`, [camp.id]);
await expectFail('anon cannot read campaign chats', 'anon', `select count(*) from public.direct_messages`);
await expectFail('clipper cannot open staff room', 'clipper', `select public.staff_room()`);
await expectOk('moderator opens staff room', 'mod', `select public.staff_room() id`, [], (r) => !!r[0].id);

console.log('\nNotifications');
await expectOk('clipper got clip + payout notifications', 'clipper', `select array_agg(kind order by kind) k from public.notifications`, [],
  (r) => ['clip_flagged', 'clip_verified', 'payout_failed'].every((k) => r[0].k?.includes(k)));
await expectOk('brand got new_clip + campaign notifications', 'brand', `select array_agg(kind order by kind) k from public.notifications`, [],
  (r) => ['campaign_rejected', 'new_clip'].every((k) => r[0].k?.includes(k)));
await expectOk('nobody sees others’ notifications', 'newbie', `select count(*)::int n from public.notifications`, [], (r) => r[0].n === 0);
await expectFail('users cannot create notifications', 'clipper', `insert into public.notifications (user_id, kind) values ($1, 'payout_completed')`, [ids.clipper]);
await expectFail('users cannot call notify()', 'clipper', `select public.notify($1, 'payout_completed', '{}'::jsonb, null)`, [ids.clipper]);
await expectFail('users cannot rewrite a notification', 'clipper', `update public.notifications set kind = 'payout_completed'`);
await expectOk('users can mark their notifications read', 'clipper', `update public.notifications set is_read = true returning id`, [], (r) => r.length >= 3);

console.log('\nTracking log');
await expectOk('server logs a tracking pass', 'service', `insert into public.tracking_runs (trigger, checked) values ('scheduler', 3) returning id`, [], (r) => r.length === 1);
await expectOk('staff can read the log', 'mod', `select count(*)::int n from public.tracking_runs`, [], (r) => r[0].n === 1);
await expectOk('clippers cannot read the log', 'clipper', `select count(*)::int n from public.tracking_runs`, [], (r) => r[0].n === 0);
await expectOk('anon cannot read the log', 'anon', `select count(*)::int n from public.tracking_runs`, [], (r) => r[0].n === 0);
await expectFail('users cannot write the log', 'clipper', `insert into public.tracking_runs (trigger) values ('fake')`);

console.log('\nStats & saved campaigns');
await expectOk('settlements were written to the ledger', 'service', `select count(*)::int n, sum(amount)::float s from public.clip_earnings where clip_id = $1`, [clip.id], (r) => r[0].n >= 2 && r[0].s > 0);
await expectOk('clipper sees own ledger', 'clipper', `select count(*)::int n from public.clip_earnings`, [], (r) => r[0].n >= 2);
await expectOk('campaign brand sees the ledger', 'brand', `select count(*)::int n from public.clip_earnings`, [], (r) => r[0].n >= 2);
await expectOk('outsider sees no ledger', 'newbie', `select count(*)::int n from public.clip_earnings`, [], (r) => r[0].n === 0);
await expectFail('users cannot write the ledger', 'clipper', `insert into public.clip_earnings (clip_id, user_id, campaign_id, amount) values ($1, $2, $3, 999)`, [clip.id, ids.clipper, camp.id]);
await expectOk('clipper series: 7 days, views and earnings', 'clipper', `select sum(views)::int v, sum(earned)::float e, count(*)::int d from public.stats_series('me', null, 7)`, [], (r) => r[0].d === 7 && r[0].v > 0 && r[0].e > 0);
await expectOk('brand series over own campaigns', 'brand', `select sum(views)::int v from public.stats_series('brand', null, 30)`, [], (r) => r[0].v > 0);
await expectOk('brand series for own campaign', 'brand', `select sum(views)::int v from public.stats_series('campaign', $1, 30)`, [camp.id], (r) => r[0].v > 0);
await expectFail('outsider cannot read a campaign series', 'newbie', `select * from public.stats_series('campaign', $1, 30)`, [camp.id]);
await expectFail('clipper cannot read the platform series', 'clipper', `select * from public.stats_series('platform', null, 30)`);
await expectOk('staff read the platform series', 'mod', `select count(*)::int d from public.stats_series('platform', null, 14, 'Asia/Almaty')`, [], (r) => r[0].d === 14);
await expectFail('anon cannot read series', 'anon', `select * from public.stats_series('me', null, 7)`);
await expectOk('brand reads campaign analytics', 'brand', `select public.campaign_analytics($1) a`, [camp.id], (r) => r[0].a.totals.clips >= 1 && r[0].a.clippers.length >= 1);
await expectFail('clipper cannot read campaign analytics', 'clipper', `select public.campaign_analytics($1)`, [camp.id]);
await expectOk('admin reads platform analytics', 'admin', `select public.platform_analytics(30) a`, [], (r) => r[0].a.totals.users >= 4 && Array.isArray(r[0].a.top_clippers));
await expectFail('moderator cannot read platform money', 'mod', `select public.platform_analytics(30)`);
await expectOk('clipper saves a campaign', 'clipper', `insert into public.saved_campaigns (user_id, campaign_id) values ($1, $2) returning campaign_id`, [ids.clipper, camp.id], (r) => r.length === 1);
await expectFail('cannot save for someone else', 'clipper', `insert into public.saved_campaigns (user_id, campaign_id) values ($1, $2)`, [ids.brand, camp.id]);
await expectOk('others cannot see my saved list', 'brand', `select count(*)::int n from public.saved_campaigns`, [], (r) => r[0].n === 0);
await expectOk('clipper unsaves', 'clipper', `delete from public.saved_campaigns where campaign_id = $1 returning campaign_id`, [camp.id], (r) => r.length === 1);

console.log('\nCategory alerts');
await expectOk('clipper follows Gaming', 'clipper', `insert into public.category_follows (user_id, category) values ($1, 'gaming') returning category`, [ids.clipper], (r) => r.length === 1);
await expectFail('unknown category key refused', 'clipper', `insert into public.category_follows (user_id, category) values ($1, 'Gaming & stuff')`, [ids.clipper]);
await expectFail('cannot follow for someone else', 'clipper', `insert into public.category_follows (user_id, category) values ($1, 'music')`, [ids.brand]);
const [game] = await expectOk('(test) brand campaign awaiting review', 'service',
  `insert into public.campaigns (brand_id, title, brand_name, drive_url, platforms, platform_rates, cpm_rate, status, remaining_budget, escrow_budget, category)
   values ($1, 'Game clips', 'Brand', 'https://drive', array['youtube'], '{"youtube":{"cpm":10}}', 10, 'pending_review', 100000, 100000, 'gaming') returning id`, [ids.brand]);
await expectOk('moderator approves it', 'mod', `select public.approve_campaign($1)`, [game.id]);
await expectOk('follower was alerted', 'clipper', `select data->>'campaign' c, data->>'cpm' cpm from public.notifications where kind = 'new_campaign'`, [], (r) => r[0]?.c === 'Game clips' && Number(r[0].cpm) === 10);

console.log('\nReferrals & levels');
const [{ code }] = await expectOk('(test) clipper referral code', 'service', `select referral_code code from public.profiles where id = $1`, [ids.clipper]);
await db.exec('reset role');
ids.ref = '66666666-6666-6666-6666-666666666666';
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'ref@test.dev', $2)`, [ids.ref, JSON.stringify({ referral_code: code, full_name: 'Refi' })]);
await expectOk('invited user is linked to the referrer', 'service', `select referred_by from public.profiles where id = $1`, [ids.ref], (r) => r[0].referred_by === ids.clipper);
await expectOk('new clipper is Bronze, 48h hold', 'ref', `select public.my_level() l`, [], (r) => r[0].l.level === 'bronze' && r[0].l.hold_hours === 48 && r[0].l.next === 'silver');
const [racc] = await expectOk('(test) invited user verified account', 'service',
  `insert into public.social_accounts (user_id, platform, handle, verified_at, verify_code) values ($1, 'youtube', 'refi', now(), 'R') returning id`, [ids.ref]);
const [rclip] = await expectOk('invited user submits a clip', 'ref',
  `insert into public.clips (campaign_id, social_account_id, platform, video_url, video_key) values ($1, $2, 'youtube', 'https://youtu.be/g1', 'g1')
   returning id, extract(epoch from hold_until - now()) / 3600 h`, [game.id, racc.id], (r) => r[0].h > 47 && r[0].h <= 48);
await expectOk('(test) owner confirmed', 'service', `update public.clips set owner_check = 'matched' where id = $1`, [rclip.id]);
await expectOk('(test) 5M views recorded', 'service', `select public.record_view_snapshot($1, 5000000, 'test')`, [rclip.id]);
await expectOk('(test) hold over', 'service', `update public.clips set hold_until = now() - interval '1 minute' where id = $1`, [rclip.id]);
await expectOk('settle pays $50,000 (5M × $10 CPM)', 'service', `select public.settle_clip($1)::float paid`, [rclip.id], (r) => r[0].paid === 50000);
await expectOk('referrer got 5% of the first $100 = $5', 'clipper', `select sum(amount)::float s, count(*)::int n from public.referral_rewards`, [], (r) => r[0].s === 5 && r[0].n === 1);
await expectOk('referrer was notified', 'clipper', `select data->>'name' n from public.notifications where kind = 'referral_reward'`, [], (r) => r[0]?.n === 'Refi');
await expectOk('my_referrals shows progress capped at $100', 'clipper', `select name, progress::float p, reward::float w from public.my_referrals()`, [], (r) => r[0]?.name === 'Refi' && r[0].p === 100 && r[0].w === 5);
await expectOk('invited user cannot see referral rewards', 'ref', `select count(*)::int n from public.referral_rewards`, [], (r) => r[0].n === 0);
await expectOk('5M paid views → Gold with a 24h hold', 'ref', `select public.my_level() l`, [], (r) => r[0].l.level === 'gold' && r[0].l.hold_hours === 24);
await expectOk('level-up notification sent', 'ref', `select data->>'level' l from public.notifications where kind = 'level_up'`, [], (r) => r[0]?.l === 'gold');
await expectOk('first payout announced as clip_verified with the amount', 'ref', `select (data->>'amount')::float a from public.notifications where kind = 'clip_verified'`, [], (r) => r[0]?.a === 50000);
await expectOk('Gold clips wait 24h', 'ref',
  `insert into public.clips (campaign_id, social_account_id, platform, video_url, video_key) values ($1, $2, 'youtube', 'https://youtu.be/g2', 'g2')
   returning extract(epoch from hold_until - now()) / 3600 h`, [game.id, racc.id], (r) => r[0].h > 23 && r[0].h <= 24);
await expectOk('creator level is public to signed-in users', 'brand', `select public.creator_level($1) l`, [ids.ref], (r) => r[0].l === 'gold');
await expectOk('(test) campaign becomes Platinum-only', 'service', `update public.campaigns set min_level = 'platinum' where id = $1`, [game.id]);
await expectFail('Gold clipper cannot join a Platinum campaign', 'ref',
  `insert into public.clips (campaign_id, social_account_id, platform, video_url, video_key) values ($1, $2, 'youtube', 'https://youtu.be/g3', 'g3')`, [game.id, racc.id]);
await expectFail('brand cannot change who may join a live campaign', 'brand', `update public.campaigns set min_level = null where id = $1`, [game.id]);

console.log('\nAppeals');
await expectFail('appeal needs a real explanation', 'clipper', `select public.appeal_clip($1, 'pls')`, [clip.id]);
await expectFail('cannot appeal someone else’s clip', 'ref', `select public.appeal_clip($1, 'this is my clip honestly')`, [clip.id]);
const [ap] = await expectOk('clipper appeals the flagged clip', 'clipper', `select public.appeal_clip($1, 'The spike came from a repost by a big channel', 'https://drive.google.com/x') id`, [clip.id]);
await expectFail('only one open appeal per clip', 'clipper', `select public.appeal_clip($1, 'second try while the first is open')`, [clip.id]);
await expectFail('appeals cannot be inserted directly', 'clipper', `insert into public.clip_appeals (clip_id, user_id, message) values ($1, $2, 'direct insert attempt')`, [clip.id, ids.clipper]);
await expectOk('staff were notified', 'mod', `select count(*)::int n from public.notifications where kind = 'new_appeal'`, [], (r) => r[0].n === 1);
await expectOk('staff see the appeal', 'mod', `select message from public.clip_appeals where id = $1`, [ap.id], (r) => r[0]?.message.startsWith('The spike'));
await expectOk('others cannot see it', 'brand', `select count(*)::int n from public.clip_appeals`, [], (r) => r[0].n === 0);
await expectFail('clipper cannot decide own appeal', 'clipper', `select public.decide_appeal($1, true, 'ok')`, [ap.id]);
await expectOk('moderator accepts', 'mod', `select public.decide_appeal($1, true, 'Thanks, verified the repost')`, [ap.id]);
await expectOk('clip is back in tracking, owner confirmed', 'service', `select status, owner_check from public.clips where id = $1`, [clip.id], (r) => r[0].status === 'tracking_hold' && r[0].owner_check === 'matched');
await expectOk('clipper heard back with the reply', 'clipper', `select data->>'reason' r from public.notifications where kind = 'appeal_accepted'`, [], (r) => r[0]?.r === 'Thanks, verified the repost');
await expectFail('a decided appeal cannot be decided again', 'mod', `select public.decide_appeal($1, false, 'no')`, [ap.id]);

console.log('\nTelegram');
const [{ c: tgcode }] = await expectOk('clipper gets a link code', 'clipper', `select public.telegram_link_code('ru') c`, [], (r) => r[0].c?.length === 12);
await expectFail('users cannot link chats themselves', 'clipper', `select public.telegram_connect($1, 42, 'alex')`, [tgcode]);
await expectOk('bot links the chat', 'service', `select public.telegram_connect($1, 42, 'alex') j`, [tgcode], (r) => r[0].j?.lang === 'ru');
await expectOk('code is single-use', 'service', `select public.telegram_connect($1, 43, 'eve') j`, [tgcode], (r) => r[0].j === null);
await expectOk('clipper sees the link', 'clipper', `select chat_id::int c, username, enabled from public.telegram_links`, [], (r) => r[0]?.c === 42 && r[0].enabled === true);
await expectOk('notifications still save with Telegram linked (no bot token here)', 'service', `select public.notify($1, 'clip_earned', '{"amount": 12.5, "campaign": "A"}'::jsonb, '/dashboard/clips')`, [ids.clipper]);
await expectOk('message text: amount, escaping, language', 'service',
  `select public.telegram_text('clip_earned', '{"amount": 12.5, "campaign": "A<b>&"}'::jsonb, 'ru') t`, [],
  (r) => r[0].t.includes('$12.50') && r[0].t.includes('A&lt;b&gt;&amp;') && r[0].t.includes('заработал'));
await expectOk('category names are translated', 'service', `select public.telegram_text('new_campaign', '{"campaign":"X","brand":"B","category":"gaming","cpm":4}'::jsonb, 'en') t`, [],
  (r) => r[0].t.includes('Gaming') && r[0].t.includes('$4'));
await expectOk('/stop in the bot pauses messages', 'service', `select public.telegram_chat_enabled(42, false) l`, [], (r) => r[0].l === 'ru');
await expectOk('…paused', 'clipper', `select enabled from public.telegram_links`, [], (r) => r[0]?.enabled === false);
await expectFail('users cannot configure the bot', 'admin', `select public.configure_telegram('x', 'https://x')`);
await expectOk('clipper disconnects', 'clipper', `select public.telegram_unlink()`);
await expectOk('…gone', 'clipper', `select count(*)::int n from public.telegram_links`, [], (r) => r[0].n === 0);

console.log('\nReferral claim (Google sign-ups)');
await expectOk('cannot claim your own code', 'newbie', `select public.claim_referral(referral_code) ok from public.profiles where id = $1`, [ids.newbie], (r) => r[0].ok === false);
await expectOk('new user claims an invite code', 'newbie', `select public.claim_referral($1) ok`, [code], (r) => r[0].ok === true);
await expectOk('…linked to the referrer', 'service', `select referred_by from public.profiles where id = $1`, [ids.newbie], (r) => r[0].referred_by === ids.clipper);
await expectOk('a second claim changes nothing', 'newbie', `select public.claim_referral((select referral_code from public.profiles where id = $1)) ok`, [ids.brand], (r) => r[0].ok === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
