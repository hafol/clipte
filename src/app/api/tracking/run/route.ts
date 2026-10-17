import { NextResponse } from 'next/server';
import { runTracking } from '@/lib/tracking/run';
import { handleRouteError, jsonError } from '@/lib/api';

// Scheduled tracking pass. Called with  Authorization: Bearer <CRON_SECRET>  by:
//   - Supabase pg_cron every 3 hours (supabase/cron/schedule_tracking.sql)
//   - Vercel Cron once a day as a backup (vercel.json; Vercel sends the header itself)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError('CRON_SECRET is not set', 503);
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return jsonError('Unauthorized', 401);
  try {
    const trigger = /vercel-cron/i.test(req.headers.get('user-agent') || '') ? 'vercel' : 'scheduler';
    const summary = await runTracking(Number(new URL(req.url).searchParams.get('limit')) || 50, trigger);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return handleRouteError(err);
  }
}

export const GET = handle;
export const POST = handle;
