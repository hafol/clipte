'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlatformAnalytics, PLATFORM_NAME } from '@/lib/supabase/data';
import { PlatformIcon, money, compact, Chip, CAMPAIGN_TONE } from '@/components/dashboard/ui';
import Performance from '@/components/dashboard/Performance';
import { BarChart, ChartCard, RangePicker, RankList, ShareBar, PLATFORM_COLOR, type Point } from '@/components/dashboard/charts';

/** Fill every day of the range so bar charts don't skip quiet days. */
function fillDays(rows: { day: string; v: number }[], days: number): Point[] {
  const map = new Map(rows.map((r) => [r.day.slice(0, 10), r.v]));
  const out: Point[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push({ x: key, y: map.get(key) || 0 });
  }
  return out;
}

function Face({ name, src }: { name: string | null; src: string | null }) {
  return src ? (
    <img src={src} alt="" className="size-7 rounded-full object-cover" />
  ) : (
    <span className="flex size-7 items-center justify-center rounded-full bg-[var(--pi-btn)] text-[11px] font-semibold text-[var(--pi-btn-fg)]">{(name || '?').slice(0, 1).toUpperCase()}</span>
  );
}

/** Admin: the whole business on one screen — money in and out, growth, content, leaders. */
export default function PlatformStats() {
  const { t, lang } = useLanguage();
  const [days, setDays] = useState(30);
  const { data: a, loading } = usePlatformAnalytics(days, true);
  const T = a?.totals;

  const signups = useMemo(() => fillDays((a?.signups || []).map((r) => ({ day: r.day, v: r.n })), days), [a, days]);
  const funding = useMemo(() => fillDays((a?.funding || []).map((r) => ({ day: r.day, v: r.amount })), days), [a, days]);

  const cards: { label: string; value: string; hint: string; tone?: 'amber' }[] = T
    ? [
        { label: t('ps.funded'), value: money(T.funded_period, 0), hint: t('ps.fundedHint').replace('{n}', money(T.funded, 0)) },
        { label: t('ps.earned'), value: money(T.earned_period, 0), hint: t('ps.earnedHint').replace('{n}', money(T.earned, 0)) },
        { label: t('ps.escrow'), value: money(T.in_escrow, 0), hint: t('ps.escrowHint') },
        { label: t('ps.pending'), value: money(T.pending_payouts), hint: t('ps.pendingHint').replace('{n}', money(T.paid_out, 0)), tone: T.pending_payouts > 0 ? 'amber' : undefined },
        { label: t('ps.users'), value: compact(T.users), hint: t('ps.usersHint').replace('{n}', String(T.new_users)) },
        { label: t('ps.clippers'), value: String(T.active_clippers), hint: t('ps.clippersHint') },
        { label: t('ps.campaigns'), value: String(T.live_campaigns), hint: t('ps.campaignsHint').replace('{n}', String(T.brands)) },
        { label: t('ps.clips'), value: String(T.clips_period), hint: t('ps.clipsHint').replace('{views}', compact(T.views)).replace('{flag}', String(T.flagged)), tone: T.flagged > 0 ? 'amber' : undefined },
      ]
    : [];

  if (!loading && !a) return <p className="text-sm text-[var(--pi-muted)]">{t('ps.needMigration')}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--pi-muted)]">{t('ps.period').replace('{n}', String(days))}</p>
        <RangePicker value={days} onChange={setDays} label={(d) => t('stats.days').replace('{n}', String(d))} />
      </div>

      <section className="pi-notch pi-edge grid grid-cols-2 bg-[var(--pi-surface)] lg:grid-cols-4!">
        {(cards.length ? cards : Array.from({ length: 8 }, () => null)).map((k, i) => (
          <div key={i} className={`min-w-0 p-5 ${i % 2 ? 'border-l border-[var(--pi-line)]' : ''} ${i >= 2 ? 'border-t border-[var(--pi-line)]' : ''} ${i % 4 === 2 ? 'lg:border-l!' : ''} ${i >= 2 && i < 4 ? 'lg:border-t-0!' : ''}`}>
            {k ? (
              <>
                <span className="block text-[12px] text-[var(--pi-muted)]">{k.label}</span>
                <span className={`mt-1.5 block truncate text-[26px] font-light leading-none tracking-[-0.04em] tabular-nums ${k.tone === 'amber' ? 'text-amber-600 dark:text-amber-400!' : 'text-[var(--pi-ink-strong)]'}`}>
                  {k.value}
                </span>
                <span className="mt-1.5 block truncate text-[11px] text-[var(--pi-muted)]">{k.hint}</span>
              </>
            ) : (
              <span className="block h-14 animate-pulse rounded bg-[var(--pi-line)]" />
            )}
          </div>
        ))}
      </section>

      <Performance scope="platform" moneyLabel={t('ps.earned')} clipsLabel={t('stats.received')} />

      <div className="grid gap-6 lg:grid-cols-2!">
        <ChartCard title={t('ps.signups')}>
          <BarChart data={signups} format={(n) => t('ps.signupsN').replace('{n}', String(n))} lang={lang} height={190} />
        </ChartCard>
        <ChartCard title={t('ps.fundingChart')}>
          <BarChart data={funding} format={(n) => money(n)} lang={lang} height={190} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3!">
        <ChartCard title={t('cs.platforms')}>
          <ShareBar
            format={(n) => compact(n)}
            items={(a?.platforms || []).map((p) => ({
              key: p.platform,
              color: PLATFORM_COLOR[p.platform],
              value: p.views,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <PlatformIcon platform={p.platform} className="size-3.5" /> {PLATFORM_NAME[p.platform]}
                </span>
              ),
            }))}
          />
        </ChartCard>
        <ChartCard title={t('ps.topCampaigns')}>
          <RankList
            empty={<p className="text-xs text-[var(--pi-muted)]">{t('stats.empty')}</p>}
            items={(a?.top_campaigns || []).map((c) => ({
              key: c.id,
              label: c.title,
              sub: (
                <span className="inline-flex items-center gap-1.5">
                  {c.brand_name} · {money(c.spent, 0)} / {money(c.budget, 0)}
                  <Chip tone={CAMPAIGN_TONE[c.status]}>{t(`dash.campaignStatus.${c.status}`)}</Chip>
                </span>
              ),
              value: c.views,
              display: compact(c.views),
              href: `/dashboard/campaigns/${c.id}`,
            }))}
          />
        </ChartCard>
        <ChartCard title={t('ps.topClippers')}>
          <RankList
            empty={<p className="text-xs text-[var(--pi-muted)]">{t('stats.empty')}</p>}
            items={(a?.top_clippers || []).map((r) => ({
              key: r.id,
              lead: <Face name={r.name} src={r.avatar} />,
              label: r.name || '—',
              sub: `${compact(r.views)} ${t('common.views')} · ${r.clips} ${t('common.clips')}`,
              value: r.earned,
              display: money(r.earned, 0),
              href: `/dashboard/creators/${r.id}`,
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}
