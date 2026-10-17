// Normalizes a clip URL into { platform, key } so the same video can't be
// submitted twice through different URL shapes (youtu.be, /shorts/, ?si=…).

export type Platform = 'youtube' | 'tiktok' | 'instagram';
export type ParsedVideo = { platform: Platform; key: string; url: string };

export function parseVideoUrl(raw: string): ParsedVideo | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();
  const path = u.pathname;

  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /live/ID
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') {
    const id =
      (host === 'youtu.be' ? path.split('/')[1] : null) ||
      u.searchParams.get('v') ||
      path.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) {
      return { platform: 'youtube', key: id, url: `https://www.youtube.com/watch?v=${id}` };
    }
    return null;
  }

  // TikTok: /@user/video/ID (vm.tiktok.com short links must be expanded first)
  if (host === 'tiktok.com') {
    const m = path.match(/^\/@([\w.-]+)\/video\/(\d{8,25})/);
    if (m) return { platform: 'tiktok', key: m[2], url: `https://www.tiktok.com/@${m[1]}/video/${m[2]}` };
    return null;
  }

  // Instagram: /reel/CODE, /reels/CODE, /p/CODE
  if (host === 'instagram.com') {
    const m = path.match(/^\/(?:reel|reels|p)\/([\w-]{5,})/);
    if (m) return { platform: 'instagram', key: m[1], url: `https://www.instagram.com/reel/${m[1]}/` };
    return null;
  }

  return null;
}

/** Expands short links like vm.tiktok.com/… by following the redirect. */
export async function expandShortLink(raw: string): Promise<string> {
  try {
    const host = new URL(raw).hostname;
    if (!/^(vm|vt)\.tiktok\.com$/.test(host)) return raw;
    const res = await fetch(raw, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
    return res.url || raw;
  } catch {
    return raw;
  }
}
