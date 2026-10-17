import { NextResponse } from 'next/server';
import { runTracking } from '@/lib/tracking/run';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';

// "Run now" button on the admin page: the same pass the scheduler runs, started by an admin.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  if (!user) return jsonError('Please sign in', 401);
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return jsonError('Admins only', 403);
  return null;
}

// Which data sources are configured — yes/no only, never the values.
export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    return NextResponse.json({
      ok: true,
      youtubeKey: !!process.env.YOUTUBE_API_KEY,
      provider: !!process.env.SCRAPECREATORS_API_KEY,
      cronSecret: !!process.env.CRON_SECRET,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const summary = await runTracking(30, 'admin');
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return handleRouteError(err);
  }
}
