// Paid fallback for TikTok and Instagram, used only when the free public pages can't be read
// (Instagram hides reel view counts from logged-out visitors; TikTok often blocks servers).
// ScrapeCreators — about 1 credit per request. Turned on by SCRAPECREATORS_API_KEY; without
// the key nothing here runs and the clip goes to the moderator queue as before.
//   Instagram  GET /v1/instagram/post?url=…  → data.xdt_shortcode_media.{video_play_count, owner.username}
//   TikTok     GET /v2/tiktok/video?url=…    → aweme_detail.{statistics.play_count, author.unique_id}
import type { ParsedVideo } from './parse';

export type ProviderReading = { views?: number; owner?: string; source: 'scrapecreators' };

export const providerEnabled = () => !!process.env.SCRAPECREATORS_API_KEY;

const ENDPOINT: Partial<Record<ParsedVideo['platform'], string>> = {
  instagram: 'https://api.scrapecreators.com/v1/instagram/post',
  tiktok: 'https://api.scrapecreators.com/v2/tiktok/video',
};

const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : undefined);

export async function fromProvider(v: ParsedVideo): Promise<ProviderReading | null> {
  const key = process.env.SCRAPECREATORS_API_KEY;
  const endpoint = ENDPOINT[v.platform];
  if (!key || !endpoint) return null;
  try {
    const res = await fetch(`${endpoint}?url=${encodeURIComponent(v.url)}`, {
      headers: { 'x-api-key': key },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (v.platform === 'instagram') {
      const m = body?.data?.xdt_shortcode_media;
      if (!m) return null;
      // reels report plays in video_play_count; video_view_count is the older (often 0) metric
      const views = num(m.video_play_count) ?? (num(m.video_view_count) || undefined);
      return { views, owner: m.owner?.username, source: 'scrapecreators' };
    }
    const a = body?.aweme_detail;
    if (!a) return null;
    return { views: num(a.statistics?.play_count), owner: a.author?.unique_id, source: 'scrapecreators' };
  } catch {
    return null;
  }
}
