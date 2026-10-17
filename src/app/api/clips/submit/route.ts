import { NextResponse } from 'next/server';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { getAdminClient } from '@/lib/supabase/admin';
import { expandShortLink, parseVideoUrl } from '@/lib/tracking/parse';
import { matchOwner } from '@/lib/tracking/owner';

// Clipper submits a clip link to a campaign. The link is normalized on the server and the
// video's owner is compared with the clipper's verified accounts: someone else's video is
// refused; if the owner can't be read, the clip is accepted as 'unconfirmed' and is not paid
// until a moderator checks it. The database enforces the rest (active campaign, verified
// account, zeroed counters, owner_check cleared on any insert that bypasses this route).
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return jsonError('Please sign in', 401);

    const { campaignId, url } = await req.json();
    if (!campaignId || !url) return jsonError('campaignId and url are required');

    const parsed = parseVideoUrl(await expandShortLink(String(url)));
    if (!parsed) return jsonError('That link does not look like a TikTok, YouTube or Instagram video');

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('id, handle')
      .eq('user_id', user.id)
      .eq('platform', parsed.platform)
      .not('verified_at', 'is', null);
    if (!accounts?.length) return jsonError(`Connect and verify your ${parsed.platform} account first`);

    const owner = await matchOwner(parsed, accounts);
    if (owner.result === 'mismatch') {
      const mine = accounts.map((a) => `@${String(a.handle).replace(/^@/, '')}`).join(', ');
      return NextResponse.json(
        { ok: false, code: 'not_owner', owner: owner.owner, error: `This video was posted by ${owner.owner}, not by your verified account ${mine}. You can only submit videos from your own accounts.` },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('clips')
      .insert({
        campaign_id: campaignId,
        social_account_id: owner.result === 'matched' ? owner.accountId : accounts[0].id,
        platform: parsed.platform,
        video_url: parsed.url,
        video_key: parsed.key,
      })
      .select('id, status, hold_until')
      .single();

    if (error) {
      if (error.code === '23505') return jsonError('This video has already been submitted', 409);
      return jsonError(error.message);
    }

    // Only the server (secret key) can set the ownership result
    await getAdminClient()
      .from('clips')
      .update(owner.result === 'matched' ? { owner_check: 'matched', owner_handle: owner.owner } : { owner_check: 'unconfirmed', owner_handle: null })
      .eq('id', data.id);

    return NextResponse.json({ ok: true, clip: data, ownership: owner.result });
  } catch (err) {
    return handleRouteError(err);
  }
}
