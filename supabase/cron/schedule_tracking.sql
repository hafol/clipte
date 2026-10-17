-- Automatic view tracking every 3 hours, run by Supabase itself (free; Vercel's free plan
-- only allows a daily cron, which stays in vercel.json as a backup).
-- Run this AFTER the site is deployed, in the Supabase SQL Editor.
--
-- Before running, replace the two values in step 2:
--   YOUR-SITE          → your live address, e.g. clipte.vercel.app (no https://, no slash at the end)
--   YOUR-CRON-SECRET   → the same value as CRON_SECRET in Vercel → Settings → Environment Variables
-- The secret is kept in Supabase Vault (encrypted), not in the job text.

-- 1. Extensions (also available in Dashboard → Integrations → Cron)
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 2. Store the address and the secret (re-running replaces them)
select vault.create_secret('https://YOUR-SITE/api/tracking/run', 'tracking_url')
  where not exists (select 1 from vault.secrets where name = 'tracking_url');
select vault.create_secret('YOUR-CRON-SECRET', 'cron_secret')
  where not exists (select 1 from vault.secrets where name = 'cron_secret');
-- to change them later:
-- select vault.update_secret((select id from vault.secrets where name = 'tracking_url'), 'https://new-site/api/tracking/run');
-- select vault.update_secret((select id from vault.secrets where name = 'cron_secret'), 'new-secret');

-- 3. The job: at minute 0 of every 3rd hour (UTC)
select cron.unschedule('clipte-tracking') where exists (select 1 from cron.job where jobname = 'clipte-tracking');
select cron.schedule(
  'clipte-tracking',
  '0 */3 * * *',
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

-- 4. Check it
-- select jobname, schedule, active from cron.job;
-- select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- select status_code, content::text, created from net._http_response order by created desc limit 5;
-- Admin page → Tracking tab shows every pass that reached the site.
--
-- To stop it: select cron.unschedule('clipte-tracking');
