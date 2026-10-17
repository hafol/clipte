// Who posted a video? Used on clip submission so a clipper can't claim someone else's
// video with their own verified account.
//   YouTube   — free oEmbed (author_url), then the Data API (YOUTUBE_API_KEY) or the watch page.
//   TikTok    — free oEmbed (author_unique_id). The @user in a TikTok URL is NOT trusted:
//               TikTok opens a video by its id whatever username is typed in front of it.
//   Instagram — the public embed page (names the author without a login), then the reel page.
// TikTok and Instagram fall back to the paid provider (provider.ts) when it is configured.
// When the owner can't be read the clip is still accepted, marked 'unconfirmed', and is
// not paid until a moderator checks it.
import type { ParsedVideo, Platform } from './parse';
import { fromProvider } from './provider';

export type OwnerReading =
  | { ok: true; handles: string[]; channelId?: string; source: string }
  | { ok: false; reason: string };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** "@TJP-FundedPro " → "tjp-fundedpro" */
export const normHandle = (h: string) => h.trim().replace(/^@/, '').toLowerCase();

async function get(url: string, json = false, plain = false): Promise<{ status: number; body: any } | null> {
  try {
    const res = await fetch(url, {
      headers: plain
        ? { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' } // Instagram serves the static embed (with the author) to simple clients
        : { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Accept: json ? 'application/json' : 'text/html,application/xhtml+xml' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { status: res.status, body: null };
    return { status: res.status, body: json ? await res.json().catch(() => null) : await res.text() };
  } catch {
    return null;
  }
}

const handleFromUrl = (url?: string) => url?.match(/youtube\.com\/@([\w.\-·]+)/i)?.[1];

async function youtube(v: ParsedVideo): Promise<OwnerReading> {
  const handles = new Set<string>();
  let channelId: string | undefined;

  const oembed = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(v.url)}`, true);
  if (oembed?.status === 404 || oembed?.status === 401) return { ok: false, reason: 'not_found' };
  const fromOembed = handleFromUrl(oembed?.body?.author_url);
  if (fromOembed) handles.add(normHandle(decodeURIComponent(fromOembed)));
  channelId = oembed?.body?.author_url?.match(/\/channel\/(UC[\w-]{22})/)?.[1];

  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const vid = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(v.key)}&key=${key}`, true);
    channelId = vid?.body?.items?.[0]?.snippet?.channelId || channelId;
    if (channelId) {
      const ch = await get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${key}`, true);
      const custom = ch?.body?.items?.[0]?.snippet?.customUrl;
      if (custom) handles.add(normHandle(custom));
    }
  }

  if (!handles.size || !channelId) {
    const page = await get(`https://www.youtube.com/watch?v=${v.key}`);
    const html: string = page?.body || '';
    const owner = html.match(/"ownerProfileUrl":"https?:\/\/www\.youtube\.com\/@([^"]+)"/)?.[1];
    if (owner) handles.add(normHandle(decodeURIComponent(owner)));
    channelId = channelId || html.match(/"channelId":"(UC[\w-]{22})"/)?.[1];
  }

  if (!handles.size && !channelId) return { ok: false, reason: 'unavailable' };
  return { ok: true, handles: [...handles], channelId, source: key ? 'youtube_api' : 'youtube_public' };
}

/** YouTube channel id behind a handle — lets us compare ids when the video only exposes one. */
export async function youtubeChannelId(handle: string): Promise<string | undefined> {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    const r = await get(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent('@' + normHandle(handle))}&key=${key}`, true);
    const id = r?.body?.items?.[0]?.id;
    if (id) return id;
  }
  const page = await get(`https://www.youtube.com/@${encodeURIComponent(normHandle(handle))}`);
  const html: string = page?.body || '';
  return html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] || html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1];
}

async function tiktok(v: ParsedVideo): Promise<OwnerReading> {
  const r = await get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(v.url)}`, true);
  const id = r?.body?.author_unique_id || handleFromTikTokUrl(r?.body?.author_url);
  if (id) return { ok: true, handles: [normHandle(id)], source: 'tiktok_oembed' };
  if (r?.status === 400 || r?.status === 404) return { ok: false, reason: 'not_found' };
  return { ok: false, reason: 'unavailable' };
}
const handleFromTikTokUrl = (url?: string) => url?.match(/tiktok\.com\/@([\w.-]+)/)?.[1];

async function instagram(v: ParsedVideo): Promise<OwnerReading> {
  // The embed page (what sites use to show a post) names the author without a login
  const embed: string = (await get(`https://www.instagram.com/p/${v.key}/embed/captioned/`, false, true))?.body || '';
  const fromEmbed =
    embed.match(/data-ios-link="user\?username=([\w.]+)/)?.[1] ||
    embed.match(/href="https:\/\/www\.instagram\.com\/([\w.]+)\/\?utm_source=ig_embed/)?.[1];
  if (fromEmbed) return { ok: true, handles: [normHandle(fromEmbed)], source: 'instagram_embed' };

  const page = await get(v.url);
  const html: string = page?.body || '';
  const user =
    html.match(/"owner":\{[^{}]*?"username":"([\w.]+)"/)?.[1] ||
    html.match(/<meta (?:property|name)="og:description" content="[^"]*? - ([\w.]+) on [A-Z][a-z]+ \d/)?.[1] ||
    html.match(/<meta (?:property|name)="og:url" content="https:\/\/www\.instagram\.com\/([\w.]+)\/(?:reel|p)\//)?.[1];
  return user ? { ok: true, handles: [normHandle(user)], source: 'instagram_page' } : { ok: false, reason: 'unavailable' };
}

const ADAPTERS: Record<Platform, (v: ParsedVideo) => Promise<OwnerReading>> = { youtube, tiktok, instagram };

export async function fetchOwner(v: ParsedVideo): Promise<OwnerReading> {
  const free = await ADAPTERS[v.platform](v);
  if (free.ok || free.reason === 'not_found' || v.platform === 'youtube') return free;
  const paid = await fromProvider(v); // TikTok / Instagram paid fallback, if configured
  return paid?.owner ? { ok: true, handles: [normHandle(paid.owner)], source: paid.source } : free;
}

export type OwnerMatch =
  | { result: 'matched'; accountId: string; owner: string }
  | { result: 'mismatch'; owner: string }
  | { result: 'unconfirmed'; reason: string };

/** Compare the video's owner with the clipper's verified accounts on that platform. */
export async function matchOwner(v: ParsedVideo, accounts: { id: string; handle: string }[]): Promise<OwnerMatch> {
  const owner = await fetchOwner(v);
  if (!owner.ok) return { result: 'unconfirmed', reason: owner.reason };

  const byHandle = accounts.find((a) => owner.handles.includes(normHandle(a.handle)));
  const label = owner.handles[0] ? `@${owner.handles[0]}` : owner.channelId!;
  if (byHandle) return { result: 'matched', accountId: byHandle.id, owner: label };

  // YouTube channels can be known by id only (older channels, or oEmbed without a handle)
  if (v.platform === 'youtube' && owner.channelId) {
    for (const a of accounts) {
      if ((await youtubeChannelId(a.handle)) === owner.channelId) return { result: 'matched', accountId: a.id, owner: label };
    }
    return { result: 'mismatch', owner: label };
  }
  return owner.handles.length ? { result: 'mismatch', owner: label } : { result: 'unconfirmed', reason: 'no_handle' };
}
