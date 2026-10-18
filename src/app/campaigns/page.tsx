import type { Metadata } from 'next';
import { PublicCampaignList } from '@/components/info/PublicCampaigns';
import { publicCampaigns } from '@/lib/supabase/public';

// Public list of live campaigns — rebuilt at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Paid clipping campaigns — get paid per view | Clipte',
  description:
    'Live clipping jobs from brands and creators: post short clips on TikTok, YouTube Shorts and Instagram Reels and earn per 1,000 views. Free to join.',
  alternates: { canonical: '/campaigns' },
  openGraph: {
    title: 'Paid clipping campaigns | Clipte',
    description: 'Join a campaign, post clips, earn per view. TikTok, YouTube Shorts and Instagram Reels.',
    type: 'website',
  },
};

export default async function Page() {
  return <PublicCampaignList campaigns={await publicCampaigns()} />;
}
