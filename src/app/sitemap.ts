import type { MetadataRoute } from 'next';
import { GUIDES } from '@/content/guides';
import { COMPARE_PAGES } from '@/content/compare';
import { LEGAL_PAGES } from '@/content/legal';
import { publicCampaigns } from '@/lib/supabase/public';

// Every public page, including each live campaign (refreshed hourly).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_APP_URL || 'https://clipte.vercel.app').replace(/\/$/, '');
  const now = new Date();
  const page = (path: string, priority = 0.6, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  const campaigns = await publicCampaigns();
  return [
    page('/', 1, 'daily'),
    page('/campaigns', 0.9, 'hourly'),
    ...['/clip', '/brands', '/enterprise', '/docs', '/blog', '/compare', '/contact'].map((p) => page(p, 0.7)),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, 0.7)),
    ...Object.keys(COMPARE_PAGES).map((s) => page(`/compare/${s}`, 0.6)),
    ...Object.keys(LEGAL_PAGES).map((s) => page(`/legal/${s}`, 0.3, 'monthly')),
    ...campaigns.map((c) => ({ url: `${site}/campaigns/${c.id}`, lastModified: new Date(c.created_at), changeFrequency: 'daily' as const, priority: 0.8 })),
  ];
}
