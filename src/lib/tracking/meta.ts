// Title + thumbnail of a video for the "preview before you submit" card. Free public sources:
//   YouTube / TikTok — oEmbed;  Instagram — the embed page (image + caption, no login).
// Anything missing is null; the preview simply shows less.
import type { ParsedVideo } from './parse';

export type VideoMeta = { title: string | null; thumbnail: string | null };

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&#064;/g, '@').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function json(url: string) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function fetchMeta(v: ParsedVideo): Promise<VideoMeta> {
  if (v.platform === 'youtube') {
    const o = await json(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(v.url)}`);
    return { title: o?.title ?? null, thumbnail: o?.thumbnail_url ?? `https://i.ytimg.com/vi/${v.key}/hqdefault.jpg` };
  }
  if (v.platform === 'tiktok') {
    const o = await json(`https://www.tiktok.com/oembed?url=${encodeURIComponent(v.url)}`);
    return { title: o?.title || null, thumbnail: o?.thumbnail_url ?? null };
  }
  try {
    const res = await fetch(`https://www.instagram.com/p/${v.key}/embed/captioned/`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const html = res.ok ? await res.text() : '';
    const img = html.match(/class="EmbeddedMediaImage"[^>]*?src="([^"]+)"/)?.[1];
    const caption = html.match(/<div class="Caption">[\s\S]*?<\/a>([\s\S]*?)<div class="CaptionComments">/)?.[1];
    const text = caption ? decode(caption.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
    return { title: text ? text.slice(0, 140) : null, thumbnail: img ? decode(img) : null };
  } catch {
    return { title: null, thumbnail: null };
  }
}
