-- Clipte schema v2.7 — log of automatic view-tracking passes.
-- Every pass (Supabase schedule, Vercel backup, or the admin "Run now" button) writes one row,
-- so the admin page can show when tracking last ran and what it did.
-- Run once after v2.6 (safe to re-run).
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

