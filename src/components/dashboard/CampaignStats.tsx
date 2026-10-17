'use client';

import React from 'react';
import { Download, ExternalLink } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useCampaignAnalytics, useSeries, PLATFORM_NAME, type CampaignRow, type ClipRow } from '@/lib/supabase/data';
import { Chip, PlatformIcon, money, compact, CLIP_TONE } from '@/components/dashboard/ui';
import { timeAgo } from '@/components/dashboard/forms';
import Performance from '@/components/dashboard/Performance';
import { ChartCard, RankList, ShareBar, PLATFORM_COLOR } from '@/components/dashboard/charts';

const initials = (name: string | null) => (name || '?').trim().slice(0, 1).toUpperCase();

function Face({ name, src }: { name: string | null; src: string | null }) {
  return src ? (
    <img src={src} alt="" className="size-7 rounded-full object-cover" />
  ) : (
    <span className="flex size-7 items-center justify-center rounded-full bg-[var(--pi-btn)] text-[11px] font-semibold text-[var(--pi-btn-fg)]">{initials(name)}</span>
  );
}

function csv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(',')).join('\n');
}

/** Brand / staff view of how a campaign performs: spend efficiency, runway, who and what drives views. */
export default function CampaignStats({ c, clips }: { c: CampaignRow; clips: ClipRow[] }) {
  const { t, lang } = useLanguage();
  const { data: a, loading } = useCampaignAnalytics(c.id, true);
  const { data: week } = useSeries('campaign', c.id, 7);

  const spent = Math.max(0, c.escrow_budget - c.remaining_budget);
  const paidViews = a?.totals.paid_views || 0;
  const cpm = paidViews > 0 ? (spent / paidViews) * 1000 : 0;
  const daily = week.reduce((s, d) => s + d.earned, 0) / 7;
  const runway = daily > 0 ? Math.ceil(c.remaining_budget / daily) : null;
  const burn = c.escrow_budget > 0 ? Math.min(100, (spent / c.escrow_budget) * 100) : 0;

  const exportCsv = () => {
    const rows: (string | number)[][] = [[t('cs.colDate'), t('cs.colPlatform'), t('cs.colHandle'), t('cs.colUrl'), t('cs.colStatus'), t('cs.colViews'), t('cs.colEarned')]];
    const list = clips.length
      ? clips.map((k) => [k.created_at.slice(0, 10), PLATFORM_NAME[k.platform], k.account?.handle || '', k.video_url, k.status, k.view_count, k.earnings.toFixed(2)])
      : (a?.top_clips || []).map((k) => [k.created_at.slice(0, 10), PLATFORM_NAME[k.platform], k.handle || '', k.url, k.status, k.views, k.earned.toFixed(2)]);
    const blob = new Blob(['﻿' + csv([...rows, ...list])], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clipte-${c.title.replace(/[^\w-]+/g, '-').slice(0, 40)}-clips.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: t('cs.views'), value: compact(a?.totals.views ?? c.views_delivered), hint: t('cs.viewsHint').replace('{n}', compact(paidViews)) },
    { label: t('cs.cpm'), value: cpm ? money(cpm) : '—', hint: t('cs.cpmHint') },
    {
      label: t('cs.runway'),
      value: runway === null ? '—' : t('cs.days').replace('{n}', String(runway)),
      hint: daily > 0 ? t('cs.runwayHint').replace('{n}', money(daily)) : t('cs.runwayNone'),
    },
    {
      label: t('cs.clips'),
      value: String(a?.totals.clips ?? 0),
      hint: t('cs.clipsHint')
        .replace('{ok}', String(a?.totals.verified ?? 0))
        .replace('{hold}', String(a?.totals.hold ?? 0))
        .replace('{bad}', String(a?.totals.problems ?? 0)),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI band + budget burn */}
      <section className="pi-notch pi-edge bg-[var(--pi-surface)]">
        <div className="grid grid-cols-2 lg:grid-cols-4!">
          {kpis.map((k, i) => (
            <div key={k.label} className={`min-w-0 p-5 ${i % 2 ? 'border-l border-[var(--pi-line)]' : ''} ${i >= 2 ? 'border-t border-[var(--pi-line)] lg:border-t-0!' : ''} ${i === 2 ? 'lg:border-l!' : ''}`}>
              <span className="block text-[12px] text-[var(--pi-muted)]">{k.label}</span>
              {loading && !a ? (
                <span className="mt-2 block h-7 w-20 animate-pulse rounded bg-[var(--pi-line)]" />
              ) : (
                <span className="mt-1.5 block truncate text-[28px] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">{k.value}</span>
              )}
              <span className="mt-1.5 block truncate text-[11px] text-[var(--pi-muted)]">{k.hint}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--pi-line)] px-5 py-4">
          <div className="mb-2 flex items-baseline justify-between text-[12px]">
            <span className="text-[var(--pi-muted)]">{t('cs.burn')}</span>
            <span className="tabular-nums text-[var(--pi-ink)]">
              {money(spent, 0)} / {money(c.escrow_budget, 0)} · {burn.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pi-line)]">
            <div className="ch-grow-x h-full rounded-full bg-[var(--pi-ink-strong)]" style={{ width: `${burn}%` }} />
          </div>
        </div>
      </section>

      <Performance scope="campaign" id={c.id} moneyLabel={t('stats.spent')} clipsLabel={t('stats.received')} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]!">
        <ChartCard title={t('cs.platforms')}>
          <ShareBar
            format={(n) => `${compact(n)} ${t('common.views')}`}
            items={(a?.platforms || []).map((p) => ({
              key: p.platform,
              color: PLATFORM_COLOR[p.platform],
              value: p.views,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <PlatformIcon platform={p.platform} className="size-3.5" /> {PLATFORM_NAME[p.platform]}
                  <span className="text-[var(--pi-muted)]">· {p.clips} {t('common.clips')}</span>
                </span>
              ),
            }))}
          />
          {!a?.platforms.length && <p className="mt-3 text-xs text-[var(--pi-muted)]">{t('stats.empty')}</p>}
        </ChartCard>

        <ChartCard title={t('cs.topClippers')}>
          <RankList
            empty={<p className="text-xs text-[var(--pi-muted)]">{t('stats.empty')}</p>}
            items={(a?.clippers || []).map((r) => ({
              key: r.id,
              lead: <Face name={r.name} src={r.avatar} />,
              label: r.name || t('msg.someone'),
              sub: `${r.clips} ${t('common.clips')} · ${money(r.earned)}`,
              value: r.views,
              display: compact(r.views),
              href: `/dashboard/creators/${r.id}`,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard
        title={t('cs.topClips')}
        action={
          <button type="button" onClick={exportCsv} className="pi-notch inline-flex h-9 items-center gap-1.5 bg-[var(--pi-line)] px-3 text-[12px] text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-line-strong)] cursor-pointer">
            <Download className="size-3.5" /> {t('cs.export')}
          </button>
        }
      >
        {!a?.top_clips.length ? (
          <p className="text-xs text-[var(--pi-muted)]">{t('stats.empty')}</p>
        ) : (
          <ul className="divide-y divide-[var(--pi-line)]">
            {a.top_clips.map((k, i) => (
              <li key={k.id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 text-center text-[12px] tabular-nums text-[var(--pi-muted)]">{i + 1}</span>
                <PlatformIcon platform={k.platform} className="size-4 shrink-0 text-[var(--pi-ink-strong)]" />
                <a href={k.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[13px] text-[var(--pi-ink-strong)] hover:underline">
                  {k.handle ? `@${k.handle}` : PLATFORM_NAME[k.platform]} <span className="text-[var(--pi-muted)]">· {timeAgo(k.created_at, lang)}</span>
                  <ExternalLink className="ml-1 inline size-3 opacity-50" />
                </a>
                <span className="w-16 text-right text-[13px] tabular-nums text-[var(--pi-ink-strong)]">{compact(k.views)}</span>
                <span className="hidden w-20 text-right text-[13px] tabular-nums text-[var(--pi-ink)] sm:block!">{money(k.earned)}</span>
                <Chip tone={CLIP_TONE[k.status]}>{t(`dash.clipStatus.${k.status}`)}</Chip>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
