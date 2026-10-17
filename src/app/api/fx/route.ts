import { NextResponse } from 'next/server';

// USD → KZT rate for showing prices in tenge (display only — every payment stays in USD).
// Official National Bank of Kazakhstan rate first, open.er-api.com as a fallback; both are
// cached for 6 hours. Also returns the visitor's country from Vercel's edge header so the
// site can pick tenge by default for visitors in Kazakhstan — nothing is stored.
export const dynamic = 'force-dynamic';

const SIX_HOURS = 6 * 3600;

async function nationalBank(): Promise<{ rate: number; date: string } | null> {
  try {
    const res = await fetch('https://nationalbank.kz/rss/rates_all.xml', { next: { revalidate: SIX_HOURS }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const xml = (await res.text()).replace(/\s+/g, ' ');
    const m = xml.match(/<title>USD<\/title>\s*<pubDate>([\d.]+)<\/pubDate>\s*<description>([\d.]+)<\/description>/);
    return m ? { rate: Number(m[2]), date: m[1] } : null;
  } catch {
    return null;
  }
}

async function openRates(): Promise<{ rate: number; date: string } | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: SIX_HOURS }, signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    const rate = Number(json?.rates?.KZT);
    return rate > 0 ? { rate, date: String(json.time_last_update_utc || '') } : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const nb = await nationalBank();
  const fx = nb ? { ...nb, source: 'nationalbank.kz' } : await openRates().then((r) => (r ? { ...r, source: 'open.er-api.com' } : null));
  return NextResponse.json(
    { ok: !!fx, rate: fx?.rate ?? null, date: fx?.date ?? null, source: fx?.source ?? null, country: req.headers.get('x-vercel-ip-country') },
    { headers: { 'Cache-Control': 'private, max-age=3600' } }
  );
}
