-- Automatic view tracking, run by Supabase itself (free; Vercel's free plan only allows a
-- daily cron, which stays in vercel.json as a backup).
-- Run this AFTER the site is deployed, in the Supabase SQL Editor. Safe to re-run: it updates
-- the stored values and replaces the jobs.
--
-- Fill in the two values in step 1 IN THE SQL EDITOR ONLY — never save the secret into this
-- file (it is on GitHub). The values are kept in Supabase Vault (encrypted).

-- 1. Your values ---------------------------------------------------------------------------
do $$
declare
  v_site   text := 'YOUR-SITE';          -- e.g. clipte.vercel.app  (no https://, no slash)
  v_secret text := 'YOUR-CRON-SECRET';   -- same as CRON_SECRET in Vercel → Environment Variables
  v_url    text;
begin
  if v_site like 'YOUR-%' or v_secret like 'YOUR-%' then
    raise exception 'Replace YOUR-SITE and YOUR-CRON-SECRET at the top of the script first';
  end if;
  v_url := 'https://' || trim(both '/' from regexp_replace(v_site, '^https?://', '')) || '/api/tracking/run';

  -- create or update (re-running fixes a typo)
  if exists (select 1 from vault.secrets where name = 'tracking_url') then
    perform vault.update_secret((select id from vault.secrets where name = 'tracking_url'), v_url);
  else
    perform vault.create_secret(v_url, 'tracking_url');
  end if;
  if exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.update_secret((select id from vault.secrets where name = 'cron_secret'), v_secret);
  else
    perform vault.create_secret(v_secret, 'cron_secret');
  end if;
  raise notice 'Saved. Tracking will call %', v_url;
end;
$$;

-- 2. Extensions (also available in Dashboard → Integrations → Cron) -----------------------
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 3. Tracking: every hour at minute 0 (UTC) ------------------------------------------------
-- Cheap to run often: a pass only reads clips that are due (each clip at most every 6 hours),
-- and paying a clip right after its hold ends no longer waits up to 3 hours.
select cron.unschedule(jobname) from cron.job where jobname in ('clipte-tracking', 'clipte-cleanup');
select cron.schedule(
  'clipte-tracking',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'tracking_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 60000
  );
  $$
);

-- 4. Nightly clean-up at 03:30 UTC: old scheduler logs and tracking history -----------------
select cron.schedule(
  'clipte-cleanup',
  '30 3 * * *',
  $$
  delete from cron.job_run_details where end_time < now() - interval '14 days';
  delete from public.tracking_runs where started_at < now() - interval '90 days';
  $$
);

-- 5. Check it --------------------------------------------------------------------------------
select jobname, schedule, active from cron.job where jobname like 'clipte-%';
-- Last runs of the scheduler:
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- What the site answered (200 = ok, 401 = wrong secret, 404 = wrong address):
--   select status_code, left(content::text, 200), created from net._http_response order by created desc limit 5;
-- Admin page → Tracking tab shows every pass that reached the site.
--
-- To stop: select cron.unschedule('clipte-tracking'); select cron.unschedule('clipte-cleanup');
