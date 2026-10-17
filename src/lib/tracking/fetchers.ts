// Our own view tracker. Each platform adapter reads the public view count.
//   YouTube   — official Data API when YOUTUBE_API_KEY is set, otherwise the public watch page.
//   TikTok    — public embed page (/embed/v2/<id>), then the video page (TikTok often blocks servers).
//   Instagram — public reel page (view counts are usually hidden from logged-out visitors).
// TikTok and Instagram fall back to the paid provider (provider.ts) when it is configured.
// When nothing can read a clip, it stays in the moderator queue, where staff record views
// from the clipper's analytics proof.
import type { ParsedVideo, Platform } from './parse';
import { fromProvider } from './provider';

export type ViewReading =
  | { ok: true; views: number; source: string }
  | { ok: false; reason: 'unavailable' | 'not_found' | 'error'; detail?: string };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function getPage(url: string, plain = false): Promise<{ status: number; text: string } | null> {
  try {
    const res = await fetch(url, {
      // embed pages serve their data to simple clients and block browser-looking servers
      headers: plain ? { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' } : { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', Accept: 'text/html,application/xhtml+xml' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    return { status: res.status, text: await res.text() };
  } catch {
    return null;
  }
}

const firstMatch = (text: string, patterns: RegExp[]) => {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return Number(m[1].replace(/[,\s]/g, ''));
  }
  return null;
};

async function youtube(v: ParsedVideo): Promise<ViewReading> {
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(v.key)}&key=${key}`,
        { cache: 'no-store', signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      const item = data?.items?.[0];
      if (res.ok && !item) return { ok: false, reason: 'not_found' };
      if (item?.statistics?.viewCount != null) return { ok: true, views: Number(item.statistics.viewCount), source: 'youtube_api' };
    } catch {
      /* fall through to the public page */
    }
  }
  const page = await getPage(`https://www.youtube.com/watch?v=${v.key}`);
  if (!page) return { ok: false, reason: 'error', detail: 'network' };
  const views = firstMatch(page.text, [/"viewCount":"(\d+)"/, /"viewCount":\{"simpleText":"([\d,]+)/]);
  if (views != null) return { ok: true, views, source: 'youtube_page' };
  if (/"playabilityStatus":\{"status":"(?:ERROR|LOGIN_REQUIRED)"/.test(page.text)) return { ok: false, reason: 'not_found' };
  return { ok: false, reason: 'unavailable', detail: `status ${page.status}` };
}

/** Free reading failed → ask the paid provider (if configured) before giving up. */
async function orProvider(v: ParsedVideo, failed: ViewReading): Promise<ViewReading> {
  const p = await fromProvider(v);
  return p?.views != null ? { ok: true, views: p.views, source: p.source } : failed;
}

async function tiktok(v: ParsedVideo): Promise<ViewReading> {
  const embed = await getPage(`https://www.tiktok.com/embed/v2/${v.key}`, true);
  const fromEmbed = embed && firstMatch(embed.text, [/"playCount":(\d+)/]);
  if (fromEmbed != null) return { ok: true, views: fromEmbed, source: 'tiktok_embed' };
  const page = await getPage(v.url);
  if (!page) return orProvider(v, { ok: false, reason: 'error', detail: 'network' });
  const views = firstMatch(page.text, [/"playCount":(\d+)/, /"playCount":"(\d+)"/]);
  return views != null ? { ok: true, views, source: 'tiktok_page' } : orProvider(v, { ok: false, reason: 'unavailable', detail: `status ${page.status}` });
}

async function instagram(v: ParsedVideo): Promise<ViewReading> {
  const page = await getPage(v.url);
  if (!page) return orProvider(v, { ok: false, reason: 'error', detail: 'network' });
  const views = firstMatch(page.text, [/"play_count":(\d+)/, /"video_play_count":(\d+)/, /"video_view_count":(\d+)/]);
  return views != null ? { ok: true, views, source: 'instagram_page' } : orProvider(v, { ok: false, reason: 'unavailable', detail: `status ${page.status}` });
}

const ADAPTERS: Record<Platform, (v: ParsedVideo) => Promise<ViewReading>> = { youtube, tiktok, instagram };

export const fetchViews = (v: ParsedVideo) => ADAPTERS[v.platform](v);
