// Checks that seed/test_fast_forward.sql pays a fresh clip immediately (PGlite).
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (instance_id uuid, id uuid primary key, aud text, role text, email text,
    raw_user_meta_data jsonb default '{}'::jsonb, raw_app_meta_data jsonb, created_at timestamptz, updated_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
  create publication supabase_realtime;
`);
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
await db.exec(read('../schema.sql'));
await db.exec(read('../seed/demo_campaigns.sql'));
const clipper = '77777777-7777-7777-7777-777777777777';
await db.query(`insert into auth.users (id, email) values ($1, 'c@test.dev')`, [clipper]);
await db.exec(`insert into public.social_accounts (user_id, platform, handle, verified_at) values ('${clipper}', 'youtube', 'testyt', now())`);
await db.exec(`insert into public.clips (user_id, campaign_id, social_account_id, platform, video_url, video_key)
  select '${clipper}', 'd3d3d3d3-c000-4000-8000-000000000001', id, 'youtube', 'https://youtube.com/shorts/x', 'x' from public.social_accounts where handle = 'testyt'`);
const out = await db.exec(read('../seed/test_fast_forward.sql'));
const last = out[out.length - 1].rows[0];
console.log('paid row:', out[out.length - 2].rows[0], 'result:', last);
