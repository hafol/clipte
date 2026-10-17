import { NextResponse } from 'next/server';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { getAdminClient } from '@/lib/supabase/admin';
import { expandShortLink, parseVideoUrl } from '@/lib/tracking/parse';
import { matchOwner } from '@/lib/tracking/owner';
import { fetchMeta } from '@/lib/tracking/meta';

// "Preview before you submit": as soon as a clipper pastes a link, show the video's
// thumbnail and title, who posted it, and anything that would make the submission fail
// (wrong platform, not their account, already submitted) — before they press Submit.
// Read-only; the real checks run again in /api/clips/submit.
export async function POST(req: Request) {
  const started = Date.now();
  try {
    const { supabase, user } = await requireUser();
    if (!user) return jsonError('Please sign in', 401);

    const { url, campaignId } = await req.json();
    const parsed = url ? parseVideoUrl(await expandShortLink(String(url))) : null;
    if (!parsed) return NextResponse.json({ ok: false, error: 'bad_link' });

    const { data: campaign } = await supabase.from('campaigns').select('platforms').eq('id', campaignId).maybeSingle();
    if (campaign && !(campaign.platforms as string[]).includes(parsed.platform)) {
      return NextResponse.json({ ok: false, platform: parsed.platform, error: 'platform_not_allowed' });
    }

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('id, handle')
      .eq('user_id', user.id)
      .eq('platform', parsed.platform)
      .not('verified_at', 'is', null);

    const [meta, owner, dup] = await Promise.all([
      fetchMeta(parsed),
      accounts?.length ? matchOwner(parsed, accounts) : Promise.resolve(null),
      // only a yes/no — the same thing submitting would reveal
      getAdminClient().from('clips').select('id', { count: 'exact', head: true }).eq('platform', parsed.platform).eq('video_key', parsed.key),
    ]);

    return NextResponse.json(
      {
        ok: true,
        platform: parsed.platform,
        title: meta.title,
        thumbnail: meta.thumbnail,
        author: owner && owner.result !== 'unconfirmed' ? owner.owner : null,
        ownership: !accounts?.length ? 'no_account' : owner!.result,
        accounts: (accounts || []).map((a) => `@${String(a.handle).replace(/^@/, '')}`),
        duplicate: (dup.count || 0) > 0,
      },
      { headers: { 'Server-Timing': `total;dur=${Date.now() - started}` } }
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
