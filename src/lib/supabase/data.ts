'use client';

// Supabase-only data hooks for the redesigned dashboard. No localStorage, no demo rows:
// an empty database renders empty states. Row access is enforced by RLS (supabase/schema.sql).

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from './client';

export type Platform = 'tiktok' | 'youtube' | 'instagram';
export const PLATFORMS: Platform[] = ['tiktok', 'youtube', 'instagram'];
export const PLATFORM_NAME: Record<Platform, string> = { tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram' };
export type PlatformRate = { cpm?: number; minPayout?: number; maxCap?: number };

export type CampaignStatus = 'pending_payment' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected';
export type ClipStatus = 'tracking_hold' | 'verified' | 'rejected' | 'flagged';

export interface CampaignRow {
  id: string;
  brand_id: string;
  title: string;
  brand_name: string;
  category: string | null;
  min_level?: 'silver' | 'gold' | 'platinum' | null;
  drive_url: string;
  icon_url: string | null;
  cover_url: string | null;
  hashtags: string[];
  guidelines: string | null;
  description: string | null;
  dos: string[];
  donts: string[];
  brand_handle: string | null;
  platforms: Platform[];
  platform_rates: Partial<Record<Platform, PlatformRate>>;
  cpm_rate: number;
  max_payout_per_clip: number | null;
  escrow_budget: number;
  remaining_budget: number;
  views_delivered: number;
  status: CampaignStatus;
  rejection_reason: string | null;
  created_at: string;
}

export interface ClipRow {
  id: string;
  user_id: string;
  campaign_id: string;
  platform: Platform;
  video_url: string;
  view_count: number;
  paid_views: number;
  earnings: number;
  status: ClipStatus;
  status_reason: string | null;
  hold_until: string;
  last_checked_at: string | null;
  created_at: string;
  owner_check?: 'matched' | 'unconfirmed' | null; // staff queue only
  owner_handle?: string | null;
  campaign?: { title: string; brand_name: string } | null;
  account?: { handle: string } | null;
}

export interface SocialAccountRow {
  id: string;
  platform: Platform;
  handle: string;
  verify_code?: string;
  verified_at: string | null;
  created_at?: string;
}

export interface PayoutMethodRow {
  id: string;
  type: 'paypal' | 'usdt_trc20' | 'usdc_erc20' | 'btc' | 'eth' | 'sol';
  address: string;
  is_default: boolean;
  created_at: string;
}

export const METHOD_NAME: Record<string, string> = {
  paypal: 'PayPal', usdt_trc20: 'USDT · TRC-20', usdc_erc20: 'USDC · ERC-20', btc: 'Bitcoin', eth: 'Ethereum', sol: 'Solana',
};

export interface PayoutRow {
  id: string;
  user_id: string;
  amount: number;
  method_type: string;
  recipient: string;
  status: 'processing' | 'completed' | 'failed';
  transaction_reference: string | null;
  failure_reason: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface DepositRow {
  id: string;
  campaign_id: string | null;
  invoice_id: number;
  amount: number;
  asset: string;
  status: 'pending' | 'paid' | 'expired';
  created_at: string;
  paid_at: string | null;
  campaign?: { title: string } | null;
}

export interface LeaderRow {
  user_id: string;
  name: string;
  avatar_url: string | null;
  clips: number;
  views: number;
  earnings: number;
}

export type Face = { name: string | null; avatar: string | null };
export type CampaignStats = Record<string, { clips: number; clippers: number; faces: Face[] }>;

const num = (v: unknown) => Number(v) || 0;
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export const normCampaign = (r: any): CampaignRow => ({
  ...r,
  hashtags: r.hashtags || [],
  dos: r.dos || [],
  donts: r.donts || [],
  description: r.description ?? null,
  brand_handle: r.brand_handle ?? null,
  platforms: r.platforms || [],
  platform_rates: r.platform_rates || {},
  cpm_rate: num(r.cpm_rate),
  max_payout_per_clip: r.max_payout_per_clip == null ? null : num(r.max_payout_per_clip),
  escrow_budget: num(r.escrow_budget),
  remaining_budget: num(r.remaining_budget),
  views_delivered: num(r.views_delivered),
});

export const normClip = (r: any): ClipRow => ({
  ...r,
  view_count: num(r.view_count),
  paid_views: num(r.paid_views),
  earnings: num(r.earnings),
  campaign: one(r.campaign),
  account: one(r.account),
});

const normPayout = (r: any): PayoutRow => ({ ...r, amount: num(r.amount) });

/** The rate a campaign pays on one platform (falls back to the campaign-wide CPM). */
export const rateFor = (c: CampaignRow, p: Platform): Required<Pick<PlatformRate, 'cpm'>> & PlatformRate => {
  const r = c.platform_rates?.[p] || {};
  return {
    cpm: num(r.cpm) || c.cpm_rate,
    minPayout: r.minPayout == null ? undefined : num(r.minPayout),
    maxCap: r.maxCap == null ? (c.max_payout_per_clip ?? undefined) : num(r.maxCap),
  };
};

/** Best CPM a campaign pays across its platforms. */
export const topCpm = (c: CampaignRow) => Math.max(c.cpm_rate, ...c.platforms.map((p) => rateFor(c, p).cpm));

export const CAMPAIGN_COLS =
  'id, brand_id, title, brand_name, category, drive_url, icon_url, cover_url, hashtags, guidelines, description, dos, donts, brand_handle, platforms, platform_rates, cpm_rate, max_payout_per_clip, min_level, escrow_budget, remaining_budget, views_delivered, status, rejection_reason, created_at';
const CLIP_COLS =
  'id, user_id, campaign_id, platform, video_url, view_count, paid_views, earnings, status, status_reason, hold_until, last_checked_at, created_at, campaign:campaigns(title, brand_name)';

/** Turns a Supabase/Postgres error into a short message for the UI. */
export const errText = (e: any) => {
  const m = String(e?.message || e || 'Something went wrong');
  return m.replace(/^.*?exception:\s*/i, '').slice(0, 240);
};

/** Tiny loader: runs `fn` when `key` changes, exposes loading/error/refresh. */
function useLoad<T>(fn: () => Promise<T>, key: string | null, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (key === null) return;
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(errText(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, setData, loading: key === null ? true : loading, error, refresh: run };
}

const must = <T,>(res: { data: T | null; error: any }): T => {
  if (res.error) throw res.error;
  return (res.data ?? []) as T;
};

/** Optional RPC: returns `fallback` if the function is missing (migration not run yet). */
async function softRpc<T>(name: string, args: Record<string, unknown>, fallback: T): Promise<T> {
  const { data, error } = await getSupabaseBrowserClient().rpc(name, args);
  if (error) {
    console.warn(`rpc ${name}:`, error.message);
    return fallback;
  }
  return (data ?? fallback) as T;
}

async function statsFor(ids: string[]): Promise<CampaignStats> {
  if (!ids.length) return {};
  // v2.2 adds clipper faces; fall back to plain counts if that migration isn't applied yet
  let rows = await softRpc<any[] | null>('campaign_card_stats', { p_ids: ids }, null);
  if (!rows) rows = await softRpc<any[]>('campaign_public_stats', { p_ids: ids }, []);
  return Object.fromEntries(
    rows.map((r) => [r.campaign_id, { clips: num(r.clips), clippers: num(r.clippers), faces: Array.isArray(r.faces) ? r.faces : [] }])
  );
}

/* ============================== Overview ============================== */

export interface ClipperOverview {
  clips: ClipRow[];
  accounts: SocialAccountRow[];
  campaigns: CampaignRow[];
  activeCount: number;
}

export function useClipperOverview(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<ClipperOverview>(
    async () => {
      const [clips, accounts, campaigns, active] = await Promise.all([
        supabase.from('clips').select(CLIP_COLS).eq('user_id', userId!).order('created_at', { ascending: false }),
        supabase.from('social_accounts').select('id, platform, handle, verified_at').eq('user_id', userId!),
        supabase
          .from('campaigns')
          .select(CAMPAIGN_COLS)
          .eq('status', 'active')
          .gt('remaining_budget', 0)
          .order('remaining_budget', { ascending: false })
          .limit(3),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      if (active.error) throw active.error;
      return {
        clips: must<any[]>(clips).map(normClip),
        accounts: must<SocialAccountRow[]>(accounts),
        campaigns: must<any[]>(campaigns).map(normCampaign),
        activeCount: active.count || 0,
      };
    },
    userId ? `clipper:${userId}` : null,
    { clips: [], accounts: [], campaigns: [], activeCount: 0 }
  );
}

export interface BrandOverview {
  campaigns: CampaignRow[];
  clips: ClipRow[];
}

export function useBrandOverview(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<BrandOverview>(
    async () => {
      const campaigns = must<any[]>(
        await supabase.from('campaigns').select(CAMPAIGN_COLS).eq('brand_id', userId!).order('created_at', { ascending: false })
      ).map(normCampaign);
      const ids = campaigns.map((c) => c.id);
      const clips = ids.length
        ? must<any[]>(
            await supabase.from('clips').select(CLIP_COLS).in('campaign_id', ids).order('created_at', { ascending: false }).limit(50)
          ).map(normClip)
        : [];
      return { campaigns, clips };
    },
    userId ? `brand:${userId}` : null,
    { campaigns: [], clips: [] }
  );
}

/* ============================== Campaigns ============================== */

/** Live campaigns for clippers, with public clip/clipper counts. */
export function useLiveCampaigns(enabled = true) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<{ campaigns: CampaignRow[]; stats: CampaignStats }>(
    async () => {
      const campaigns = must<any[]>(
        await supabase.from('campaigns').select(CAMPAIGN_COLS).eq('status', 'active').order('created_at', { ascending: false })
      ).map(normCampaign);
      return { campaigns, stats: await statsFor(campaigns.map((c) => c.id)) };
    },
    enabled ? 'live' : null,
    { campaigns: [], stats: {} }
  );
}

/** A brand's own campaigns (every status), with counts. */
export function useMyCampaigns(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<{ campaigns: CampaignRow[]; stats: CampaignStats }>(
    async () => {
      const campaigns = must<any[]>(
        await supabase.from('campaigns').select(CAMPAIGN_COLS).eq('brand_id', userId!).order('created_at', { ascending: false })
      ).map(normCampaign);
      return { campaigns, stats: await statsFor(campaigns.map((c) => c.id)) };
    },
    userId ? `mine:${userId}` : null,
    { campaigns: [], stats: {} }
  );
}

export interface CampaignDetail {
  campaign: CampaignRow | null;
  myClips: ClipRow[];
  leaderboard: LeaderRow[];
  accounts: SocialAccountRow[];
  /** owner only */
  clips: ClipRow[];
  deposits: DepositRow[];
}

export function useCampaignDetail(id?: string, userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<CampaignDetail>(
    async () => {
      const row = await supabase.from('campaigns').select(CAMPAIGN_COLS).eq('id', id!).maybeSingle();
      if (row.error) throw row.error;
      const campaign = row.data ? normCampaign(row.data) : null;
      if (!campaign) return { campaign: null, myClips: [], leaderboard: [], accounts: [], clips: [], deposits: [] };
      const isOwner = campaign.brand_id === userId;

      const [myClips, accounts, leaderboard, clips, deposits] = await Promise.all([
        supabase.from('clips').select(CLIP_COLS).eq('campaign_id', id!).eq('user_id', userId!).order('created_at', { ascending: false }),
        supabase.from('social_accounts').select('id, platform, handle, verified_at').eq('user_id', userId!),
        softRpc<any[]>('campaign_leaderboard', { p_campaign_id: id }, []),
        isOwner
          ? supabase
              .from('clips')
              .select(`${CLIP_COLS}, account:social_accounts(handle)`)
              .eq('campaign_id', id!)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        isOwner
          ? supabase
              .from('escrow_deposits')
              .select('id, campaign_id, invoice_id, amount, asset, status, created_at, paid_at')
              .eq('campaign_id', id!)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);
      return {
        campaign,
        myClips: must<any[]>(myClips).map(normClip),
        accounts: must<SocialAccountRow[]>(accounts),
        leaderboard: leaderboard.map((r) => ({ ...r, clips: num(r.clips), views: num(r.views), earnings: num(r.earnings) })),
        clips: must<any[]>(clips as any).map(normClip),
        deposits: must<any[]>(deposits as any).map((d) => ({ ...d, amount: num(d.amount) })),
      };
    },
    id && userId ? `campaign:${id}:${userId}` : null,
    { campaign: null, myClips: [], leaderboard: [], accounts: [], clips: [], deposits: [] }
  );
}

export type CampaignDraft = {
  title: string;
  brand_name: string;
  category: string | null;
  drive_url: string;
  cover_url: string | null;
  icon_url: string | null;
  hashtags: string[];
  description: string | null;
  dos: string[];
  donts: string[];
  brand_handle: string | null;
  platforms: Platform[];
  platform_rates: Partial<Record<Platform, PlatformRate>>;
  cpm_rate: number;
  max_payout_per_clip: number | null;
  min_level?: 'silver' | 'gold' | 'platinum' | null; // premium campaigns (v2.9)
};

/** Brief text kept in `guidelines` too, for older readers. */
const briefText = (d: Pick<CampaignDraft, 'description' | 'dos' | 'donts'>) =>
  [d.description, d.dos.length ? `Do: ${d.dos.join('; ')}` : '', d.donts.length ? `Don't: ${d.donts.join('; ')}` : '']
    .filter(Boolean)
    .join('\n\n');

export async function createCampaign(draft: CampaignDraft) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('campaigns')
    .insert({ ...draft, guidelines: briefText(draft) })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateCampaign(id: string, patch: Partial<CampaignDraft> & { status?: 'active' | 'paused' }) {
  const body: Record<string, unknown> = { ...patch };
  if (patch.description !== undefined || patch.dos || patch.donts) {
    body.guidelines = briefText({ description: patch.description ?? null, dos: patch.dos ?? [], donts: patch.donts ?? [] });
  }
  const { error } = await getSupabaseBrowserClient().from('campaigns').update(body).eq('id', id);
  if (error) throw error;
}

/* ============================== Clips ============================== */

export function useMyClips(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<ClipRow[]>(
    async () =>
      must<any[]>(
        await supabase
          .from('clips')
          .select(`${CLIP_COLS}, account:social_accounts(handle)`)
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
      ).map(normClip),
    userId ? `clips:${userId}` : null,
    []
  );
}

/** Submits through the server route (it normalizes the link and picks the verified account). */
export async function submitClip(campaignId: string, url: string) {
  const res = await fetch('/api/clips/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, url }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw Object.assign(new Error(json.error || 'Could not submit the clip'), { code: json.code as string | undefined, owner: json.owner as string | undefined });
  return { ...(json.clip as { id: string; status: ClipStatus; hold_until: string }), ownership: json.ownership as 'matched' | 'unconfirmed' };
}

/** Withdraw a clip while it is still on hold. */
export async function withdrawClip(id: string) {
  const { error } = await getSupabaseBrowserClient().from('clips').delete().eq('id', id);
  if (error) throw error;
}

/* ============================== Social accounts ============================== */

export function useAccounts(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<SocialAccountRow[]>(
    async () =>
      must<SocialAccountRow[]>(
        await supabase
          .from('social_accounts')
          .select('id, platform, handle, verify_code, verified_at, created_at')
          .eq('user_id', userId!)
          .order('created_at', { ascending: true })
      ),
    userId ? `accounts:${userId}` : null,
    []
  );
}

export const cleanHandle = (h: string) =>
  h
    .trim()
    .replace(/^https?:\/\/(www\.)?(tiktok\.com\/@|instagram\.com\/|youtube\.com\/@?)/i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');

export async function addAccount(userId: string, platform: Platform, handle: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('social_accounts')
    .insert({ user_id: userId, platform, handle: cleanHandle(handle) })
    .select('id, platform, handle, verify_code, verified_at, created_at')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('This account is already connected on Clipte');
    throw error;
  }
  return data as SocialAccountRow;
}

export async function removeAccount(id: string) {
  const { error } = await getSupabaseBrowserClient().from('social_accounts').delete().eq('id', id);
  if (error) throw error;
}

export async function verifyAccount(accountId: string) {
  const res = await fetch('/api/social/verify-bio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && !json.error) throw new Error('Verification service is unavailable');
  return { verified: !!json.verified, error: (json.error as string) || null };
}

/* ============================== Money ============================== */

export function useWallet(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<{ methods: PayoutMethodRow[]; payouts: PayoutRow[]; deposits: DepositRow[] }>(
    async () => {
      const [methods, payouts, deposits] = await Promise.all([
        supabase.from('payout_methods').select('id, type, address, is_default, created_at').eq('user_id', userId!).order('created_at'),
        supabase.from('payouts').select('*').eq('user_id', userId!).order('created_at', { ascending: false }),
        supabase
          .from('escrow_deposits')
          .select('id, campaign_id, invoice_id, amount, asset, status, created_at, paid_at, campaign:campaigns(title)')
          .eq('brand_id', userId!)
          .order('created_at', { ascending: false }),
      ]);
      return {
        methods: must<PayoutMethodRow[]>(methods),
        payouts: must<any[]>(payouts).map(normPayout),
        deposits: must<any[]>(deposits).map((d) => ({ ...d, amount: num(d.amount), campaign: one(d.campaign) })),
      };
    },
    userId ? `wallet:${userId}` : null,
    { methods: [], payouts: [], deposits: [] }
  );
}

export async function addPayoutMethod(userId: string, type: PayoutMethodRow['type'], address: string, makeDefault: boolean) {
  const supabase = getSupabaseBrowserClient();
  if (makeDefault) await supabase.from('payout_methods').update({ is_default: false }).eq('user_id', userId);
  const { error } = await supabase.from('payout_methods').insert({ user_id: userId, type, address: address.trim(), is_default: makeDefault });
  if (error) throw error;
}

export async function setDefaultMethod(userId: string, id: string) {
  const supabase = getSupabaseBrowserClient();
  await supabase.from('payout_methods').update({ is_default: false }).eq('user_id', userId);
  const { error } = await supabase.from('payout_methods').update({ is_default: true }).eq('id', id);
  if (error) throw error;
}

export async function removePayoutMethod(id: string) {
  const { error } = await getSupabaseBrowserClient().from('payout_methods').delete().eq('id', id);
  if (error) throw error;
}

export async function requestPayout(methodId: string) {
  const { error } = await getSupabaseBrowserClient().rpc('request_payout', { p_method_id: methodId });
  if (error) throw error;
}

/** Creates a CryptoPay invoice for one of the brand's campaigns. */
export async function createInvoice(campaignId: string, amount: number) {
  const res = await fetch('/api/payments/crypto/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, amount }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'Could not create the invoice');
  return {
    invoiceId: json.invoice.invoice_id as number,
    payUrl: json.payUrl as string,
    miniAppUrl: (json.miniAppUrl as string) || null,
    amount: String(json.invoice.amount),
    asset: String(json.invoice.fiat || 'USD'),
  };
}

export async function checkInvoice(invoiceId: number) {
  const res = await fetch(`/api/payments/crypto/check-invoice?invoiceId=${invoiceId}`);
  const json = await res.json().catch(() => ({}));
  return { paid: !!json.isPaid, status: (json.status as string) || 'unknown' };
}

/* ============================== Staff ============================== */

export interface StaffQueue {
  campaigns: CampaignRow[];
  clips: ClipRow[];
  accounts: (SocialAccountRow & { user_id: string })[];
}

export function useStaffQueue(enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<StaffQueue>(
    async () => {
      const [campaigns, clips, accounts] = await Promise.all([
        supabase.from('campaigns').select(CAMPAIGN_COLS).in('status', ['pending_review', 'active', 'paused']).order('created_at'),
        supabase
          .from('clips')
          .select(`${CLIP_COLS}, owner_check, owner_handle, account:social_accounts(handle)`)
          .in('status', ['tracking_hold', 'flagged', 'verified'])
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('social_accounts')
          .select('id, user_id, platform, handle, verify_code, verified_at, created_at')
          .is('verified_at', null)
          .order('created_at')
          .limit(100),
      ]);
      return {
        campaigns: must<any[]>(campaigns).map(normCampaign),
        clips: must<any[]>(clips).map(normClip),
        accounts: must<any[]>(accounts),
      };
    },
    enabled ? 'staff' : null,
    { campaigns: [], clips: [], accounts: [] }
  );
}

const rpc = async (name: string, args: Record<string, unknown>) => {
  const { error } = await getSupabaseBrowserClient().rpc(name, args);
  if (error) throw error;
};
export const approveCampaign = (id: string) => rpc('approve_campaign', { p_campaign_id: id });
export const rejectCampaign = (id: string, reason: string) => rpc('reject_campaign', { p_campaign_id: id, p_reason: reason });
export const moderateClip = (id: string, status: 'rejected' | 'flagged' | 'tracking_hold', reason: string | null) =>
  rpc('moderate_clip', { p_clip_id: id, p_status: status, p_reason: reason });
export const recordViews = (id: string, views: number) =>
  rpc('record_view_snapshot', { p_clip_id: id, p_views: Math.round(views), p_source: 'moderator' });
export const staffVerifyAccount = (id: string) => rpc('staff_verify_account', { p_account_id: id });
export const processPayout = (id: string, status: 'completed' | 'failed', reference: string) =>
  rpc('process_payout', { p_payout_id: id, p_status: status, p_reference: reference });

export function useAdminData(enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<{ payouts: PayoutRow[]; users: number; campaigns: CampaignRow[] }>(
    async () => {
      const [payouts, users, campaigns] = await Promise.all([
        supabase.from('payouts').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('campaigns').select(CAMPAIGN_COLS).order('created_at', { ascending: false }),
      ]);
      if (users.error) throw users.error;
      return {
        payouts: must<any[]>(payouts).map(normPayout),
        users: users.count || 0,
        campaigns: must<any[]>(campaigns).map(normCampaign),
      };
    },
    enabled ? 'admin' : null,
    { payouts: [], users: 0, campaigns: [] }
  );
}

/* ============================== Stats ============================== */

export type StatScope = 'me' | 'brand' | 'campaign' | 'clip' | 'platform';
export interface SeriesPoint { day: string; views: number; earned: number; clips: number }

const viewerTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/** Daily views gained / money settled / clips submitted for a chart. Empty until v2.8 is run. */
export function useSeries(scope: StatScope, id: string | null | undefined, days: number, enabled = true) {
  const needsId = scope === 'campaign' || scope === 'clip';
  return useLoad<SeriesPoint[]>(
    async () => {
      const rows = await softRpc<any[]>('stats_series', { p_scope: scope, p_id: id ?? null, p_days: days, p_tz: viewerTz() }, []);
      return rows.map((r) => ({ day: String(r.day), views: num(r.views), earned: num(r.earned), clips: num(r.clips) }));
    },
    enabled && (!needsId || id) ? `series:${scope}:${id ?? ''}:${days}` : null,
    []
  );
}

export interface CampaignAnalytics {
  totals: { views: number; paid_views: number; clips: number; clippers: number; earned: number; verified: number; hold: number; problems: number };
  platforms: { platform: Platform; views: number; clips: number; earned: number }[];
  clippers: { id: string; name: string | null; avatar: string | null; views: number; earned: number; clips: number }[];
  top_clips: { id: string; platform: Platform; url: string; views: number; earned: number; status: ClipStatus; created_at: string; handle: string | null }[];
}

const numify = <T extends Record<string, any>>(rows: T[] | null | undefined, keys: (keyof T)[]) =>
  (rows || []).map((r) => ({ ...r, ...Object.fromEntries(keys.map((k) => [k, num(r[k])])) })) as T[];
const numObj = <T,>(o: Record<string, unknown> | null | undefined) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, num(v)])) as T;

export function useCampaignAnalytics(id: string | null | undefined, enabled: boolean) {
  return useLoad<CampaignAnalytics | null>(
    async () => {
      const a = await softRpc<any>('campaign_analytics', { p_campaign_id: id }, null);
      if (!a) return null;
      return {
        totals: numObj<CampaignAnalytics['totals']>(a.totals),
        platforms: numify(a.platforms, ['views', 'clips', 'earned']),
        clippers: numify(a.clippers, ['views', 'earned', 'clips']),
        top_clips: numify(a.top_clips, ['views', 'earned']),
      };
    },
    enabled && id ? `canalytics:${id}` : null,
    null
  );
}

export interface PlatformAnalytics {
  totals: Record<
    | 'users' | 'new_users' | 'active_clippers' | 'brands' | 'live_campaigns' | 'funded' | 'funded_period' | 'in_escrow'
    | 'earned' | 'earned_period' | 'paid_out' | 'pending_payouts' | 'views' | 'clips' | 'clips_period' | 'flagged',
    number
  >;
  signups: { day: string; n: number }[];
  funding: { day: string; amount: number }[];
  platforms: { platform: Platform; views: number; clips: number; earned: number }[];
  top_campaigns: { id: string; title: string; brand_name: string; status: CampaignStatus; views: number; spent: number; budget: number }[];
  top_clippers: { id: string; name: string | null; avatar: string | null; earned: number; views: number; clips: number }[];
}

export function usePlatformAnalytics(days: number, enabled: boolean) {
  return useLoad<PlatformAnalytics | null>(
    async () => {
      const a = await softRpc<any>('platform_analytics', { p_days: days }, null);
      if (!a) return null;
      return {
        totals: numObj<PlatformAnalytics['totals']>(a.totals),
        signups: numify(a.signups, ['n']),
        funding: numify(a.funding, ['amount']),
        platforms: numify(a.platforms, ['views', 'clips', 'earned']),
        top_campaigns: numify(a.top_campaigns, ['views', 'spent', 'budget']),
        top_clippers: numify(a.top_clippers, ['earned', 'views', 'clips']),
      };
    },
    enabled ? `panalytics:${days}` : null,
    null
  );
}

/** Every view reading of one clip (owner / staff), oldest first — the clip detail chart. */
export function useClipReadings(clipId: string | null | undefined) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<{ views: number; at: string; source: string }[]>(
    async () => {
      const { data, error } = await supabase
        .from('view_snapshots')
        .select('views, captured_at, source')
        .eq('clip_id', clipId!)
        .order('captured_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data || []).map((r: any) => ({ views: num(r.views), at: r.captured_at, source: r.source }));
    },
    clipId ? `readings:${clipId}` : null,
    []
  );
}

/** Readings of the last 14 days per clip → sparkline + "+12k today" on clip lists. */
export function useClipDeltas(clipIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  const key = clipIds.length ? `deltas:${clipIds.slice().sort().join(',')}` : null;
  return useLoad<Record<string, { day: number; series: number[] }>>(
    async () => {
      const since = new Date(Date.now() - 14 * 86400_000).toISOString();
      const { data } = await supabase
        .from('view_snapshots')
        .select('clip_id, views, captured_at')
        .in('clip_id', clipIds)
        .gte('captured_at', since)
        .order('captured_at', { ascending: true })
        .limit(3000);
      const out: Record<string, { day: number; series: number[] }> = {};
      const dayAgo = Date.now() - 86400_000;
      for (const id of clipIds) {
        const rows = (data || []).filter((r: any) => r.clip_id === id);
        if (!rows.length) continue;
        const last = num(rows[rows.length - 1].views);
        const before = rows.filter((r: any) => Date.parse(r.captured_at) <= dayAgo);
        const base = before.length ? num(before[before.length - 1].views) : 0;
        out[id] = { day: Math.max(0, last - base), series: rows.map((r: any) => num(r.views)) };
      }
      return out;
    },
    key,
    {}
  );
}

/* ============================== Saved campaigns ============================== */

export function useSavedCampaigns(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  const load = useLoad<string[]>(
    async () => {
      const { data, error } = await supabase.from('saved_campaigns').select('campaign_id').order('created_at', { ascending: false });
      if (error) return []; // v2.8 not run yet
      return (data || []).map((r: any) => r.campaign_id);
    },
    userId ? `saved:${userId}` : null,
    []
  );
  const toggle = async (campaignId: string) => {
    const before = load.data;
    const saved = before.includes(campaignId);
    load.setData(saved ? before.filter((x) => x !== campaignId) : [campaignId, ...before]); // optimistic
    const { error } = saved
      ? await supabase.from('saved_campaigns').delete().eq('campaign_id', campaignId)
      : await supabase.from('saved_campaigns').insert({ user_id: userId, campaign_id: campaignId });
    if (error) {
      load.setData(before);
      throw error;
    }
    return !saved;
  };
  return { saved: load.data, isSaved: (id: string) => load.data.includes(id), toggle, loading: load.loading };
}

/* ============================== Clip preview ============================== */

export interface ClipPreview {
  ok: boolean;
  platform?: Platform;
  title?: string | null;
  thumbnail?: string | null;
  author?: string | null;
  ownership?: 'matched' | 'mismatch' | 'unconfirmed' | 'no_account';
  accounts?: string[];
  duplicate?: boolean;
  error?: string;
}

export async function previewClip(url: string, campaignId: string, signal?: AbortSignal): Promise<ClipPreview> {
  const res = await fetch('/api/clips/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, campaignId }),
    signal,
  });
  return res.json().catch(() => ({ ok: false }));
}

/* ============================== Levels ============================== */

export type Level = 'bronze' | 'silver' | 'gold' | 'platinum';
export const LEVELS: Level[] = ['bronze', 'silver', 'gold', 'platinum'];
export const LEVEL_AT: Record<Level, number> = { bronze: 0, silver: 100_000, gold: 1_000_000, platinum: 10_000_000 };
export const LEVEL_HOLD: Record<Level, number> = { bronze: 48, silver: 36, gold: 24, platinum: 12 };
export const levelRank = (l: Level | null | undefined) => (l ? LEVELS.indexOf(l) : 0);
export interface MyLevel { level: Level; views: number; next: Level | null; next_at: number | null; hold_hours: number }

export function useMyLevel(enabled: boolean) {
  return useLoad<MyLevel | null>(
    async () => {
      const l = await softRpc<any>('my_level', {}, null);
      return l ? { ...l, views: num(l.views), next_at: l.next_at == null ? null : num(l.next_at), hold_hours: num(l.hold_hours) } : null;
    },
    enabled ? 'mylevel' : null,
    null
  );
}

export const creatorLevel = (id: string) => softRpc<Level | null>('creator_level', { p_user: id }, null);

/* ============================== Referrals ============================== */

export interface Referral { id: string; name: string | null; avatar: string | null; joined_at: string; progress: number; reward: number }

export function useMyReferrals(enabled: boolean) {
  return useLoad<Referral[]>(
    async () => (await softRpc<any[]>('my_referrals', {}, [])).map((r) => ({ ...r, progress: num(r.progress), reward: num(r.reward) })),
    enabled ? 'referrals' : null,
    []
  );
}

/** Claim an invite code after a Google sign-up (no-op if already referred or the account isn't new). */
export const claimReferral = (code: string) => softRpc<boolean>('claim_referral', { p_code: code }, false);

/* ============================== Appeals ============================== */

export interface Appeal {
  id: number;
  clip_id: string;
  user_id: string;
  message: string;
  proof_url: string | null;
  status: 'open' | 'accepted' | 'declined';
  reply: string | null;
  created_at: string;
  decided_at: string | null;
}

/** My appeals, keyed by clip (latest first). */
export function useMyAppeals(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<Record<string, Appeal[]>>(
    async () => {
      const { data, error } = await supabase.from('clip_appeals').select('*').eq('user_id', userId!).order('created_at', { ascending: false });
      if (error) return {}; // v2.9 not run yet
      const out: Record<string, Appeal[]> = {};
      for (const a of data || []) (out[a.clip_id] ||= []).push(a as Appeal);
      return out;
    },
    userId ? `appeals:${userId}` : null,
    {}
  );
}

export interface StaffAppeal extends Appeal {
  clip: { id: string; platform: Platform; video_url: string; status: ClipStatus; status_reason: string | null; view_count: number; campaign: { title: string } | null; account: { handle: string } | null } | null;
  author: { full_name: string | null; avatar_url: string | null } | null;
}

export function useStaffAppeals(enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<StaffAppeal[]>(
    async () => {
      const { data, error } = await supabase
        .from('clip_appeals')
        .select('*, clip:clips(id, platform, video_url, status, status_reason, view_count, campaign:campaigns(title), account:social_accounts(handle))')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return [];
      const ids = [...new Set((data || []).map((a: any) => a.user_id))];
      const people = ids.length ? await softRpc<any[]>('list_public_profiles', {}, []) : [];
      const byId = Object.fromEntries(people.map((p: any) => [p.id, p]));
      return (data || []).map((a: any) => ({
        ...a,
        clip: a.clip ? { ...one(a.clip), view_count: num(one(a.clip)?.view_count), campaign: one(one(a.clip)?.campaign), account: one(one(a.clip)?.account) } : null,
        author: byId[a.user_id] ? { full_name: byId[a.user_id].full_name, avatar_url: byId[a.user_id].avatar_url } : null,
      }));
    },
    enabled ? 'staff-appeals' : null,
    []
  );
}

export const appealClip = (clipId: string, message: string, proofUrl: string | null) =>
  rpc('appeal_clip', { p_clip_id: clipId, p_message: message, p_proof_url: proofUrl });
export const decideAppeal = (id: number, accept: boolean, reply: string) => rpc('decide_appeal', { p_appeal_id: id, p_accept: accept, p_reply: reply });

/* ============================== Category alerts ============================== */

export const CATEGORY_KEYS = ['podcasts', 'streaming', 'gaming', 'music', 'sports', 'tech', 'finance', 'lifestyle', 'education', 'other'] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];
const isCategoryKey = (c: string): c is CategoryKey => (CATEGORY_KEYS as readonly string[]).includes(c);

/** Campaign categories are stored as keys since v2.9; older free-text values are shown as they are. */
export const categoryLabel = (c: string | null | undefined, t: (k: string) => string) => (!c ? '' : isCategoryKey(c) ? t(`create.cat.${c}`) : c);

export function useCategoryFollows(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  const load = useLoad<CategoryKey[]>(
    async () => {
      const { data, error } = await supabase.from('category_follows').select('category');
      if (error) return [];
      return (data || []).map((r: any) => r.category);
    },
    userId ? `follows:${userId}` : null,
    []
  );
  const toggle = async (c: CategoryKey) => {
    const before = load.data;
    const on = before.includes(c);
    load.setData(on ? before.filter((x) => x !== c) : [...before, c]);
    const { error } = on
      ? await supabase.from('category_follows').delete().eq('category', c)
      : await supabase.from('category_follows').insert({ user_id: userId, category: c });
    if (error) {
      load.setData(before);
      throw error;
    }
    return !on;
  };
  return { follows: load.data, toggle, loading: load.loading };
}

/* ============================== Telegram ============================== */

export interface TelegramLink { chat_id: number | null; username: string | null; enabled: boolean; linked_at: string | null }

export function useTelegramLink(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<TelegramLink | null>(
    async () => {
      const { data } = await supabase.from('telegram_links').select('chat_id, username, enabled, linked_at').maybeSingle();
      return data && data.chat_id ? (data as TelegramLink) : null;
    },
    userId ? `tg:${userId}` : null,
    null
  );
}

/** Deep link that opens the bot with a one-time code. */
export async function telegramConnectLink(lang: string): Promise<string> {
  const res = await fetch('/api/telegram/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'Telegram is not set up yet');
  return json.url as string;
}
export const telegramSetEnabled = (on: boolean) => rpc('telegram_set_enabled', { p_enabled: on });
export const telegramUnlink = () => rpc('telegram_unlink', {});

/* ============================== Tracking ============================== */

export interface TrackingRun {
  id: number;
  trigger: 'scheduler' | 'vercel' | 'admin' | string;
  started_at: string;
  finished_at: string | null;
  checked: number;
  recorded: number;
  unavailable: number;
  flagged: number;
  settled: number;
  paid: number;
  errors: string[];
}
export interface TrackingConfig { youtubeKey: boolean; provider: boolean; cronSecret: boolean }

/** Recent tracking passes + which data sources the server has (admin page). */
export function useTracking(enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<{ runs: TrackingRun[]; config: TrackingConfig | null; missingTable: boolean }>(
    async () => {
      const [runs, config] = await Promise.all([
        supabase.from('tracking_runs').select('*').order('started_at', { ascending: false }).limit(25),
        fetch('/api/tracking/run-now').then((r) => r.json()).catch(() => null),
      ]);
      // v2.7 not run yet → show a hint instead of an error
      const missingTable = !!runs.error && /tracking_runs/.test(runs.error.message);
      if (runs.error && !missingTable) throw runs.error;
      return {
        runs: (runs.data || []).map((r: any) => ({ ...r, paid: num(r.paid), errors: Array.isArray(r.errors) ? r.errors : [] })),
        config: config?.ok ? config : null,
        missingTable,
      };
    },
    enabled ? 'tracking' : null,
    { runs: [], config: null, missingTable: false }
  );
}

export async function runTrackingNow() {
  const res = await fetch('/api/tracking/run-now', { method: 'POST' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'Tracking pass failed');
  return json as Omit<TrackingRun, 'id' | 'trigger' | 'started_at' | 'finished_at'>;
}

/* ============================== People ============================== */

export function useReferralCount(enabled: boolean) {
  return useLoad<number>(async () => num(await softRpc('my_referral_count', {}, 0)), enabled ? 'refs' : null, 0);
}

export interface PublicCreator {
  profile: { id: string; full_name: string | null; avatar_url: string | null; bio: string | null; brand_name: string | null; has_brand_profile: boolean; role: string } | null;
  stats: { clips: number; views: number; campaigns: number; followers: number; following: number };
  following: boolean;
}

export function usePublicCreator(id?: string, me?: string) {
  const supabase = getSupabaseBrowserClient();
  return useLoad<PublicCreator>(
    async () => {
      const [p, stats, follow] = await Promise.all([
        supabase.from('public_profiles').select('id, full_name, avatar_url, bio, brand_name, has_brand_profile, role').eq('id', id!).maybeSingle(),
        softRpc<any[]>('creator_public_stats', { p_user_id: id }, []),
        me && me !== id
          ? supabase.from('user_follows').select('follower_id').eq('follower_id', me).eq('following_id', id!).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (p.error) throw p.error;
      const s = stats[0] || {};
      return {
        profile: p.data as PublicCreator['profile'],
        stats: { clips: num(s.clips), views: num(s.views), campaigns: num(s.campaigns), followers: num(s.followers), following: num(s.following) },
        following: !!(follow as any).data,
      };
    },
    id ? `creator:${id}:${me || ''}` : null,
    { profile: null, stats: { clips: 0, views: 0, campaigns: 0, followers: 0, following: 0 }, following: false }
  );
}

export async function setFollow(me: string, target: string, follow: boolean) {
  const supabase = getSupabaseBrowserClient();
  const { error } = follow
    ? await supabase.from('user_follows').insert({ follower_id: me, following_id: target })
    : await supabase.from('user_follows').delete().eq('follower_id', me).eq('following_id', target);
  if (error) throw error;
}

export async function updateProfile(id: string, patch: Record<string, unknown>) {
  const { error } = await getSupabaseBrowserClient().from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}
