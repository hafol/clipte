'use client';
import { EmptyCampaigns } from '@/components/illustrations';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile, type Profile } from '@/lib/supabase/hooks';
import { useLiveCampaigns, useMyCampaigns, topCpm, type Platform, type CampaignRow } from '@/lib/supabase/data';
import { NotchButton } from '@/components/pi';
import { PageHeader, EmptyState, ErrorNote } from '@/components/dashboard/ui';
import { Tabs } from '@/components/dashboard/forms';
import { CampaignRowLine } from '@/components/dashboard/campaign';
import DiscoverView from '@/components/dashboard/DiscoverView';

export default function CampaignsPage() {
  const { profile } = useUserProfile();
  if (!profile) return null;
  return profile.active_mode === 'brand' ? <BrandCampaigns profile={profile} /> : <DiscoverView />;
}

/* ============================== Brand: my campaigns ============================== */

type Filter = 'all' | 'live' | 'funding' | 'review' | 'ended';
const MATCH: Record<Filter, (c: CampaignRow) => boolean> = {
  all: () => true,
  live: (c) => c.status === 'active' || c.status === 'paused',
  funding: (c) => c.status === 'pending_payment',
  review: (c) => c.status === 'pending_review',
  ended: (c) => c.status === 'completed' || c.status === 'rejected',
};

function BrandCampaigns({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const { data, loading, error, refresh } = useMyCampaigns(profile.id);
  const [filter, setFilter] = useState<Filter>('all');
  const list = data.campaigns.filter(MATCH[filter]);
  const count = (f: Filter) => data.campaigns.filter(MATCH[f]).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t('shell.brandStudio')}
        title={t('shell.myCampaigns')}
        subtitle={t('disc.brandSubtitle')}
        actions={
          <NotchButton href="/dashboard/campaigns/create" size="md">
            {t('shell.newCampaign')}
          </NotchButton>
        }
      />

      <Tabs
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: t('disc.fAll'), count: count('all') },
          { id: 'live', label: t('disc.fLive'), count: count('live') },
          { id: 'funding', label: t('dash.campaignStatus.pending_payment'), count: count('funding') },
          { id: 'review', label: t('dash.campaignStatus.pending_review'), count: count('review') },
          { id: 'ended', label: t('disc.fEnded'), count: count('ended') },
        ]}
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse bg-[var(--pi-line)]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          art={<EmptyCampaigns />}
          title={data.campaigns.length ? t('disc.noneHere') : t('overview.b.noCampaigns')}
          desc={data.campaigns.length ? undefined : t('overview.b.noCampaignsDesc')}
          action={
            !data.campaigns.length && (
              <NotchButton href="/dashboard/campaigns/create" size="sm" variant="outline">
                {t('shell.newCampaign')}
              </NotchButton>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--pi-line)] border-b border-[var(--pi-line)]">
          {list.map((c) => (
            <li key={c.id}>
              <CampaignRowLine c={c} clips={data.stats[c.id]?.clips ?? 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
