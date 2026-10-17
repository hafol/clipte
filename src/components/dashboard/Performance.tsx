'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useSeries, type StatScope } from '@/lib/supabase/data';
import { money, compact } from '@/components/dashboard/ui';
import { AreaChart, BarChart, MetricTabs, RangePicker, pctChange, type Point } from '@/components/dashboard/charts';

type MetricId = 'views' | 'earned' | 'clips';

/**
 * Views / money / clips over time for one scope (my clips, my campaigns, a campaign, the platform).
 * Loads twice the range so every metric can show its change vs the previous period and the
 * views chart can draw the previous period as a ghost line.
 */
export default function Performance({
  scope,
  id,
  moneyLabel,
  clipsLabel,
  className = '',
}: {
  scope: StatScope;
  id?: string | null;
  moneyLabel: string; // "Earned" for clippers, "Spent" for brands, "Paid to clippers" for admins
  clipsLabel?: string;
  className?: string;
}) {
  const { t, lang } = useLanguage();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<MetricId>('views');
  const { data, loading } = useSeries(scope, id, days * 2);

  const { cur, prev } = useMemo(() => ({ cur: data.slice(-days), prev: data.slice(0, Math.max(data.length - days, 0)) }), [data, days]);
  const sum = (rows: typeof data, k: MetricId) => rows.reduce((a, r) => a + r[k], 0);

  const metrics = [
    { id: 'views', label: t('stats.views'), value: compact(sum(cur, 'views')), delta: pctChange(sum(cur, 'views'), sum(prev, 'views')) },
    { id: 'earned', label: moneyLabel, value: money(sum(cur, 'earned')), delta: pctChange(sum(cur, 'earned'), sum(prev, 'earned')) },
    { id: 'clips', label: clipsLabel || t('stats.clips'), value: String(sum(cur, 'clips')), delta: pctChange(sum(cur, 'clips'), sum(prev, 'clips')) },
  ];

  const points: Point[] = cur.map((r) => ({ x: r.day, y: r[metric] }));
  const ghost = prev.length === cur.length ? prev.map((r) => r[metric]) : undefined;
  const fmt = metric === 'earned' ? (n: number) => money(n) : metric === 'views' ? (n: number) => `${compact(n)} ${t('common.views')}` : (n: number) => String(n);
  const empty = <span className="rounded-full bg-[var(--pi-bg)] px-3 py-1 text-xs text-[var(--pi-muted)]">{t('stats.empty')}</span>;

  return (
    <section className={`pi-notch pi-edge min-w-0 bg-[var(--pi-surface)] ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-[15px] font-light tracking-[-0.02em] text-[var(--pi-ink-strong)]">{t('stats.performance')}</h2>
        <RangePicker value={days} onChange={setDays} label={(d) => t('stats.days').replace('{n}', String(d))} />
      </div>
      <div className="mt-2">
        {loading && !data.length ? (
          <div className="grid grid-cols-3 gap-4 border-b border-[var(--pi-line)] px-5 pb-4 pt-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-12 animate-pulse rounded bg-[var(--pi-line)]" />
            ))}
          </div>
        ) : (
          <MetricTabs metrics={metrics} active={metric} onChange={(m) => setMetric(m as MetricId)} />
        )}
      </div>
      <div className="px-3 pb-3 pt-2">
        {loading && !data.length ? (
          <div className="h-[230px] animate-pulse rounded-lg bg-[var(--pi-line)]/60" />
        ) : metric === 'views' ? (
          <AreaChart data={points} format={fmt} lang={lang} compare={ghost} compareLabel={t('stats.before')} empty={empty} />
        ) : (
          <BarChart data={points} format={fmt} lang={lang} empty={empty} axis={metric === 'earned' ? (n) => money(n, 0) : undefined} />
        )}
      </div>
    </section>
  );
}
