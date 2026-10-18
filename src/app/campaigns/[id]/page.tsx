import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicCampaignPage } from '@/components/info/PublicCampaigns';
import { publicCampaign, publicCampaigns } from '@/lib/supabase/public';
import type { CampaignRow } from '@/lib/supabase/data';

// One live campaign, public. Rebuilt at most every 5 minutes; ended or hidden campaigns 404.
export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

const topRate = (c: CampaignRow) =>
  Math.max(c.cpm_rate, ...c.platforms.map((p) => Number(c.platform_rates?.[p]?.cpm) || 0));
const PLATFORM: Record<string, string> = { tiktok: 'TikTok', youtube: 'YouTube Shorts', instagram: 'Instagram Reels' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await publicCampaign((await params).id);
  if (!c) return { title: 'Campaign not found | Clipte', robots: { index: false } };
  const where = c.platforms.map((p) => PLATFORM[p]).join(', ');
  const title = `${c.title} — earn up to $${topRate(c)} per 1K views | Clipte`;
  const description = (c.description || `Clip for ${c.brand_name} on ${where} and get paid per view.`).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/campaigns/${c.id}` },
    openGraph: { title, description, type: 'article', images: c.cover_url ? [{ url: c.cover_url }] : undefined },
    twitter: { card: c.cover_url ? 'summary_large_image' : 'summary', title, description, images: c.cover_url ? [c.cover_url] : undefined },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const c = await publicCampaign(id);
  if (!c) notFound();
  const all = await publicCampaigns();
  const similar = all
    .filter((x) => x.id !== c.id)
    .sort((a, b) => Number(b.category === c.category) - Number(a.category === c.category) || b.remaining_budget - a.remaining_budget)
    .slice(0, 4);

  const site = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Campaigns', item: `${site}/campaigns` },
      { '@type': 'ListItem', position: 2, name: c.title, item: `${site}/campaigns/${c.id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }} />
      <PublicCampaignPage c={c} similar={similar} />
    </>
  );
}
