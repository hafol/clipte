// Read-only Supabase access for public, server-rendered pages (search engines, link previews).
// Uses the publishable key with no session: row-level security only lets it see live campaigns.
import { createClient } from '@supabase/supabase-js';
import type { CampaignRow } from './data';

const n = (v: unknown) => Number(v) || 0;
// same shape as data.ts normCampaign (that module is client-only)
const norm = (r: any): CampaignRow => ({
  ...r,
  drive_url: '',
  guidelines: null,
  rejection_reason: null,
  hashtags: r.hashtags || [],
  dos: r.dos || [],
  donts: r.donts || [],
  description: r.description ?? null,
  brand_handle: r.brand_handle ?? null,
  platforms: r.platforms || [],
  platform_rates: r.platform_rates || {},
  cpm_rate: n(r.cpm_rate),
  max_payout_per_clip: r.max_payout_per_clip == null ? null : n(r.max_payout_per_clip),
  escrow_budget: n(r.escrow_budget),
  remaining_budget: n(r.remaining_budget),
  views_delivered: n(r.views_delivered),
});

// everything a visitor may see — no footage link (that's for clippers who joined)
const PUBLIC_COLS =
  'id, brand_id, title, brand_name, category, icon_url, cover_url, hashtags, description, dos, donts, brand_handle, platforms, platform_rates, cpm_rate, max_payout_per_clip, min_level, escrow_budget, remaining_budget, views_delivered, status, created_at';

// before the v2.9 migration the column doesn't exist yet — read without it instead of showing nothing
const COLS_V28 = PUBLIC_COLS.replace(' min_level,', '');
async function withFallback<T>(run: (cols: string) => PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const first = await run(PUBLIC_COLS);
  return first.error && /min_level/.test(first.error.message) ? run(COLS_V28) : first;
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function publicCampaigns(): Promise<CampaignRow[]> {
  const db = client();
  if (!db) return [];
  const { data } = await withFallback<any[]>((cols) =>
    db.from('campaigns').select(cols).eq('status', 'active').gt('remaining_budget', 0).order('created_at', { ascending: false }).limit(200)
  );
  return (data || []).map(norm);
}

export async function publicCampaign(id: string): Promise<CampaignRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = client();
  if (!db) return null;
  const { data } = await withFallback<any>((cols) => db.from('campaigns').select(cols).eq('id', id).eq('status', 'active').maybeSingle());
  return data ? norm(data) : null;
}
