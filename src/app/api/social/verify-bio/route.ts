import { NextResponse } from 'next/server';
import { handleRouteError, jsonError, requireUser } from '@/lib/api';
import { getAdminClient } from '@/lib/supabase/admin';

// Verifies a connected social account: the user places the code the SERVER issued
// (social_accounts.verify_code) in their public bio, then calls this route.
// Previously the browser chose its own code, so any account could be "verified".

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const PROFILE_URL: Record<string, (h: string) => string> = {
  youtube: (h) => `https://www.youtube.com/@${encodeURIComponent(h)}/about`,
  tiktok: (h) => `https://www.tiktok.com/@${encodeURIComponent(h)}`,
  instagram: (h) => `https://www.instagram.com/${encodeURIComponent(h)}/`,
};

async function pageContains(url: string, code: string) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html,application/xhtml+xml' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    return (await res.text()).toUpperCase().includes(code);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return jsonError('Please sign in', 401);

    const { accountId } = await req.json();
    if (!accountId) return jsonError('accountId is required');

    // RLS: only the owner can read this row
    const { data: account } = await supabase
      .from('social_accounts')
      .select('id, platform, handle, verify_code, verified_at')
      .eq('id', accountId)
      .maybeSingle();
    if (!account) return jsonError('Account not found', 404);
    if (account.verified_at) return NextResponse.json({ ok: true, verified: true, alreadyVerified: true });

    const handle = String(account.handle).replace(/^@/, '').trim();
    const found = await pageContains(PROFILE_URL[account.platform](handle), String(account.verify_code).toUpperCase());

    if (!found) {
      return NextResponse.json({
        ok: false,
        verified: false,
        error: `Code ${account.verify_code} was not found in @${handle}'s public bio yet. Add it, save, and try again in a minute.`,
      });
    }

    const { error } = await getAdminClient()
      .from('social_accounts')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', account.id);
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ ok: true, verified: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
