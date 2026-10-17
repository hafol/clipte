'use client';
import { EmptyCampaigns, EmptyClips } from '@/components/illustrations';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile, type Profile } from '@/lib/supabase/hooks';
import { useClipperOverview, useBrandOverview, topCpm, type ClipRow, type CampaignRow } from '@/lib/supabase/data';
import { NotchButton } from '@/components/pi';
import {
  PageHeader, StatStrip, Section, PlatformIcon, Chip, EmptyState, SkeletonRows, ErrorNote, Meter, usd, compact, CLIP_TONE, CAMPAIGN_TONE,
} from '@/components/dashboard/ui';

type T = (k: string) => string;

const firstName = (p: Profile) => (p.full_name || p.email.split('@')[0]).split(' ')[0];

const hoursLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 3_600_000));

export default function DashboardOverviewPage() {
  const { profile } = useUserProfile();
  if (!profile) return null; // the shell shows the sign-in gate
  return profile.active_mode === 'brand' ? <BrandOverview profile={profile} /> : <ClipperOverview profile={profile} />;
}

/* ============================== Clipper ============================== */

function ClipperOverview({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const { data, loading, error, refresh } = useClipperOverview(profile.id);
  const { clips, accounts, campaigns, activeCount } = data;

  const views = clips.reduce((a, c) => a + c.view_count, 0);
  const onHold = clips.filter((c) => c.status === 'tracking_hold').length;
  const verified = clips.filter((c) => c.status === 'verified').length;
  const verifiedAccounts = accounts.filter((a) => a.verified_at).length;

  const steps = [
    { title: t('overview.c.step1'), desc: t('overview.c.step1d'), href: '/dashboard/accounts', done: verifiedAccounts > 0 },
    { title: t('overview.c.step2'), desc: t('overview.c.step2d'), href: '/dashboard/campaigns', done: clips.length > 0 },
    { title: t('overview.c.step3'), desc: t('overview.c.step3d'), href: '/dashboard/clips', done: verified > 0 },
    { title: t('overview.c.step4'), desc: t('overview.c.step4d'), href: '/dashboard/payments', done: profile.total_earnings > profile.balance_earnings },
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={t('shell.overview')}
        title={t('overview.hello').replace('{name}', firstName(profile))}
        subtitle={t('overview.c.subtitle')}
        actions={
          <NotchButton href="/dashboard/campaigns" size="md">
            {t('overview.c.cta')}
          </NotchButton>
        }
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      <StatStrip
        loading={loading}
        items={[
          { label: t('overview.c.available'), value: usd(profile.balance_earnings), hint: t('overview.c.availableHint') },
          { label: t('overview.c.earned'), value: usd(profile.total_earnings), hint: t('overview.c.earnedHint') },
          { label: t('overview.c.views'), value: compact(views), hint: t('overview.c.viewsHint').replace('{n}', String(clips.length)) },
          {
            label: t('overview.c.clips'),
            value: String(clips.length),
            hint: t('overview.c.clipsHint').replace('{hold}', String(onHold)).replace('{ok}', String(verified)),
          },
        ]}
      />

      {!loading && steps.some((s) => !s.done) && <Checklist title={t('overview.startTitle')} steps={steps} t={t} />}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12!">
        <Section
          className="lg:col-span-7!"
          title={t('overview.c.recent')}
          action={clips.length > 0 && <MoreLink href="/dashboard/clips" label={t('overview.viewAll')} />}
        >
          {loading ? (
            <SkeletonRows />
          ) : clips.length === 0 ? (
            <EmptyState art={<EmptyClips />} title={t('overview.c.noClips')} desc={t('overview.c.noClipsDesc')} />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {clips.slice(0, 6).map((c) => (
                <ClipLine key={c.id} clip={c} t={t} />
              ))}
            </ul>
          )}
        </Section>

        <Section
          className="lg:col-span-5!"
          title={t('overview.c.forYou')}
          action={<MoreLink href="/dashboard/campaigns" label={`${t('overview.viewAll')} (${activeCount})`} />}
        >
          {loading ? (
            <SkeletonRows />
          ) : campaigns.length === 0 ? (
            <EmptyState art={<EmptyCampaigns />} title={t('overview.c.noCampaigns')} desc={t('overview.c.noCampaignsDesc')} />
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} c={c} t={t} />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function ClipLine({ clip, t }: { clip: ClipRow; t: T }) {
  return (
    <li className="flex items-center gap-4 py-3.5">
      <span className="pi-notch flex size-9 shrink-0 items-center justify-center bg-[var(--pi-line)] text-[var(--pi-ink-strong)]">
        <PlatformIcon platform={clip.platform} />
      </span>
      <div className="min-w-0 flex-1">
        <a href={clip.video_url} target="_blank" rel="noreferrer" className="block truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
          {clip.campaign?.title || clip.video_url}
        </a>
        <span className="block truncate text-xs text-[var(--pi-muted)]">
          {clip.status === 'tracking_hold'
            ? t('overview.holdLeft').replace('{h}', String(hoursLeft(clip.hold_until)))
            : clip.status_reason || clip.campaign?.brand_name}
        </span>
      </div>
      <div className="hidden text-right text-xs text-[var(--pi-muted)] tabular-nums sm:block!">
        <span className="block text-sm text-[var(--pi-ink-strong)]">{compact(clip.view_count)}</span>
        {t('overview.viewsShort')}
      </div>
      <div className="w-20 text-right text-sm tabular-nums text-[var(--pi-ink-strong)]">{usd(clip.earnings)}</div>
      <Chip tone={CLIP_TONE[clip.status]}>{t(`dash.clipStatus.${clip.status}`)}</Chip>
    </li>
  );
}

function CampaignCard({ c, t }: { c: CampaignRow; t: T }) {
  return (
    <li>
      <Link
        href={`/dashboard/campaigns/${c.id}`}
        className="pi-notch pi-edge group flex items-center gap-4 bg-[var(--pi-surface)] p-4 transition-colors hover:bg-[var(--pi-bg)]"
      >
        <span className="pi-notch flex size-11 shrink-0 items-center justify-center overflow-hidden bg-[var(--pi-line)] text-sm text-[var(--pi-ink-strong)]">
          {c.icon_url ? <img src={c.icon_url} alt="" className="size-full object-cover" /> : c.brand_name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm text-[var(--pi-ink-strong)]">{c.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--pi-muted)]">
            {c.brand_name}
            <span aria-hidden>·</span>
            {c.platforms.map((p) => (
              <PlatformIcon key={p} platform={p} className="size-3" />
            ))}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-sm tabular-nums text-[var(--pi-ink-strong)]">
            {usd(topCpm(c))}
            <span className="text-[var(--pi-muted)]"> / 1K</span>
          </span>
          <span className="block text-xs tabular-nums text-[var(--pi-muted)]">
            {usd(c.remaining_budget, 0)} {t('overview.left')}
          </span>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-[var(--pi-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/* ============================== Brand ============================== */

function BrandOverview({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const { data, loading, error, refresh } = useBrandOverview(profile.id);
  const { campaigns, clips } = data;

  const live = campaigns.filter((c) => c.status === 'active').length;
  const views = campaigns.reduce((a, c) => a + c.views_delivered, 0);
  const spent = campaigns.reduce((a, c) => a + Math.max(0, c.escrow_budget - c.remaining_budget), 0);
  const funded = campaigns.some((c) => c.status !== 'pending_payment');

  const steps = [
    { title: t('overview.b.step1'), desc: t('overview.b.step1d'), href: '/dashboard/campaigns/create', done: campaigns.length > 0 },
    { title: t('overview.b.step2'), desc: t('overview.b.step2d'), href: '/dashboard/campaigns', done: funded },
    { title: t('overview.b.step3'), desc: t('overview.b.step3d'), href: '/dashboard/campaigns', done: live > 0 || campaigns.some((c) => c.status === 'completed') },
    { title: t('overview.b.step4'), desc: t('overview.b.step4d'), href: '/dashboard/campaigns', done: clips.length > 0 },
  ];

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={t('shell.overview')}
        title={t('overview.hello').replace('{name}', firstName(profile))}
        subtitle={t('overview.b.subtitle')}
        actions={
          <NotchButton href="/dashboard/campaigns/create" size="md">
            {t('shell.newCampaign')}
          </NotchButton>
        }
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      <StatStrip
        loading={loading}
        items={[
          { label: t('shell.escrowBalance'), value: usd(profile.balance_escrow), hint: t('overview.b.escrowHint') },
          { label: t('overview.b.live'), value: String(live), hint: t('overview.b.liveHint').replace('{n}', String(campaigns.length)) },
          { label: t('overview.b.views'), value: compact(views), hint: t('overview.b.viewsHint') },
          { label: t('overview.b.spent'), value: usd(spent), hint: t('overview.b.spentHint') },
        ]}
      />

      {!loading && steps.some((s) => !s.done) && <Checklist title={t('overview.startTitleBrand')} steps={steps} t={t} />}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12!">
        <Section
          className="lg:col-span-7!"
          title={t('shell.myCampaigns')}
          action={campaigns.length > 0 && <MoreLink href="/dashboard/campaigns" label={t('overview.viewAll')} />}
        >
          {loading ? (
            <SkeletonRows />
          ) : campaigns.length === 0 ? (
            <EmptyState
              art={<EmptyCampaigns />}
              title={t('overview.b.noCampaigns')}
              desc={t('overview.b.noCampaignsDesc')}
              action={
                <NotchButton href="/dashboard/campaigns/create" size="sm" variant="outline">
                  {t('shell.newCampaign')}
                </NotchButton>
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {campaigns.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/campaigns/${c.id}`} className="group block py-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="min-w-0 truncate text-sm text-[var(--pi-ink-strong)] group-hover:underline">{c.title}</span>
                      <Chip tone={CAMPAIGN_TONE[c.status]}>{t(`dash.campaignStatus.${c.status}`)}</Chip>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Meter value={c.escrow_budget - c.remaining_budget} max={c.escrow_budget} />
                      <span className="shrink-0 text-xs tabular-nums text-[var(--pi-muted)]">
                        {usd(c.escrow_budget - c.remaining_budget, 0)} / {usd(c.escrow_budget, 0)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="lg:col-span-5!" title={t('overview.b.submissions')}>
          {loading ? (
            <SkeletonRows />
          ) : clips.length === 0 ? (
            <EmptyState art={<EmptyClips />} title={t('overview.b.noClips')} desc={t('overview.b.noClipsDesc')} />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {clips.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <PlatformIcon platform={c.platform} className="size-4 shrink-0 text-[var(--pi-ink-strong)]" />
                  <a href={c.video_url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
                    {c.campaign?.title || c.video_url}
                  </a>
                  <span className="text-xs tabular-nums text-[var(--pi-muted)]">{compact(c.view_count)}</span>
                  <Chip tone={CLIP_TONE[c.status]}>{t(`dash.clipStatus.${c.status}`)}</Chip>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ============================== shared ============================== */

function Checklist({ title, steps, t }: { title: string; steps: { title: string; desc: string; href: string; done: boolean }[]; t: T }) {
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.findIndex((s) => !s.done);
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{title}</h2>
        <span className="text-xs tabular-nums text-[var(--pi-muted)]">
          {doneCount}/{steps.length} {t('overview.done')}
        </span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2! lg:grid-cols-4!">
        {steps.map((s, i) => {
          const current = i === next;
          return (
            <li key={s.title}>
              <Link
                href={s.href}
                className={`pi-notch group flex h-full flex-col justify-between gap-8 p-5 transition-colors ${
                  current
                    ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]'
                    : 'pi-edge bg-[var(--pi-surface)] text-[var(--pi-ink)] hover:bg-[var(--pi-bg)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[2.5rem] font-light leading-none tracking-[-0.06em] tabular-nums ${s.done ? 'opacity-35' : ''}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.done ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3.5" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <ArrowUpRight className="size-4 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  )}
                </div>
                <div>
                  <span className={`block text-[15px] tracking-tight ${current ? '' : 'text-[var(--pi-ink-strong)]'} ${s.done ? 'line-through opacity-50' : ''}`}>
                    {s.title}
                  </span>
                  <span className={`mt-1.5 block text-[13px] font-light leading-snug ${current ? 'opacity-75' : 'text-[var(--pi-muted)]'}`}>{s.desc}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 text-[13px] text-[var(--pi-ink)] transition-colors hover:text-[var(--pi-ink-strong)]">
      {label}
      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
