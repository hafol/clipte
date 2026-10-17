// One tracking pass: read views for clips that are due, flag suspicious jumps,
// then settle every clip whose 24–48h hold has ended. Runs with the secret key.
// Clips are read a few at a time and the pass stops starting new reads when its time
// budget runs out (serverless functions are cut off), so whatever is left simply waits
// for the next pass. Every pass is logged in tracking_runs for the admin page.
import { getAdminClient } from '@/lib/supabase/admin';
import { fetchViews } from './fetchers';
import { detectSpike } from './antifraud';
import type { Platform } from './parse';

const RECHECK_HOURS = Number(process.env.TRACKING_RECHECK_HOURS || 6);
const BUDGET_MS = Number(process.env.TRACKING_BUDGET_MS || 45_000);
const PARALLEL = 4;

export type RunSummary = {
  checked: number;
  recorded: number;
  unavailable: number;
  flagged: number;
  settled: number;
  paid: number;
  errors: string[];
};

export async function runTracking(limit = 50, trigger = 'scheduler'): Promise<RunSummary> {
  const db = getAdminClient();
  const started = Date.now();
  const s: RunSummary = { checked: 0, recorded: 0, unavailable: 0, flagged: 0, settled: 0, paid: 0, errors: [] };
  const dueBefore = new Date(started - RECHECK_HOURS * 3_600_000).toISOString();

  try {
    // 1) Clips due for a new reading (only on live campaigns)
    const { data: due, error } = await db
      .from('clips')
      .select('id, platform, video_key, video_url, campaigns!inner(status)')
      .in('status', ['tracking_hold', 'verified'])
      .in('campaigns.status', ['active', 'paused'])
      .or(`last_checked_at.is.null,last_checked_at.lt.${dueBefore}`)
      .order('last_checked_at', { ascending: true, nullsFirst: true })
      .limit(limit);
    if (error) throw error;

    const readOne = async (clip: NonNullable<typeof due>[number]) => {
      s.checked++;
      const reading = await fetchViews({ platform: clip.platform as Platform, key: clip.video_key, url: clip.video_url });
      if (!reading.ok) {
        s.unavailable++;
        await db.from('clips').update({ last_checked_at: new Date().toISOString() }).eq('id', clip.id);
        return;
      }

      const { data: prev } = await db
        .from('view_snapshots')
        .select('views, captured_at')
        .eq('clip_id', clip.id)
        .order('captured_at', { ascending: false })
        .limit(1);

      const { error: recErr } = await db.rpc('record_view_snapshot', {
        p_clip_id: clip.id,
        p_views: reading.views,
        p_source: reading.source,
      });
      if (recErr) {
        s.errors.push(`${clip.id}: ${recErr.message}`);
        return;
      }
      s.recorded++;

      const spike = detectSpike(prev?.[0], reading.views);
      if (spike) {
        await db.from('clips').update({ status: 'flagged', status_reason: `Auto-flag: ${spike}` }).eq('id', clip.id);
        s.flagged++;
      }
    };

    const queue = [...(due ?? [])];
    while (queue.length && Date.now() - started < BUDGET_MS) {
      await Promise.all(queue.splice(0, PARALLEL).map((c) => readOne(c).catch((e) => void s.errors.push(`${c.id}: ${e?.message || e}`))));
    }

    // 2) Settle clips whose hold has ended
    const { data: ready } = await db
      .from('clips')
      .select('id')
      .in('status', ['tracking_hold', 'verified'])
      .lte('hold_until', new Date().toISOString())
      .limit(500);

    for (const clip of ready ?? []) {
      const { data: paid, error: setErr } = await db.rpc('settle_clip', { p_clip_id: clip.id });
      if (setErr) {
        s.errors.push(`settle ${clip.id}: ${setErr.message}`);
        continue;
      }
      // count only clips that earned something; re-checking an already paid clip pays $0
      if (Number(paid) > 0) {
        s.settled++;
        s.paid += Number(paid);
      }
    }
  } catch (err) {
    s.errors.push(err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    s.paid = Math.round(s.paid * 100) / 100;
    // the log must never break the pass itself
    await db
      .from('tracking_runs')
      .insert({
        trigger,
        started_at: new Date(started).toISOString(),
        finished_at: new Date().toISOString(),
        checked: s.checked,
        recorded: s.recorded,
        unavailable: s.unavailable,
        flagged: s.flagged,
        settled: s.settled,
        paid: s.paid,
        errors: s.errors.slice(0, 20),
      })
      .then(
        () => undefined,
        () => undefined
      );
  }
  return s;
}
