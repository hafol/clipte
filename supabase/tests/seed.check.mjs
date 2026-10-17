// Checks that migration v2.1 + demo seed run on a v2 database (PGlite). Usage: node supabase/tests/seed.check.mjs
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
await db.exec(read('../migrations/2026-10-12_v2_1.sql'));
await db.exec(read('../migrations/2026-10-12_v2_2.sql'));
await db.exec(read('../migrations/2026-10-13_v2_3.sql'));
await db.exec(read('../migrations/2026-10-13_v2_3.sql'));
await db.exec(read('../migrations/2026-10-13_v2_4.sql'));
await db.exec(read('../migrations/2026-10-13_v2_4.sql'));
await db.exec(read('../seed/demo_campaigns.sql'));
await db.exec(read('../seed/demo_campaigns.sql')); // re-run is safe
const r = await db.query(`select count(*)::int n, min(status) s from public.campaigns`);
const p = await db.query(`select brand_name from public.profiles where email = 'demo-brand@clipte.dev'`);
console.log('campaigns', r.rows[0], 'brand', p.rows[0]);
await db.exec(read('../seed/remove_demo.sql'));
console.log('after remove', (await db.query(`select count(*)::int n from public.campaigns`)).rows[0]);
