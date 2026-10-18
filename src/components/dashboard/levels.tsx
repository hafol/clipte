'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LEVELS, LEVEL_AT, LEVEL_HOLD, type Level, type MyLevel } from '@/lib/supabase/data';
import { compact } from '@/components/dashboard/ui';

// Clipper levels — Bronze → Silver (100K) → Gold (1M) → Platinum (10M) fraud-checked views.
export const LEVEL_COLOR: Record<Level, { from: string; to: string; ink: string }> = {
  bronze: { from: '#e3a372', to: '#a0602f', ink: '#7a4520' },
  silver: { from: '#eef1f4', to: '#9aa4ae', ink: '#5d6670' },
  gold: { from: '#ffe08a', to: '#d39b1b', ink: '#8a6208' },
  platinum: { from: '#d9f3ff', to: '#7a9cff', ink: '#3d55b0' },
};

/** Medal glyph in the level's metal. */
export function LevelMedal({ level, className = 'size-5' }: { level: Level; className?: string }) {
  const c = LEVEL_COLOR[level];
  const id = `lv-${level}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.from} />
          <stop offset="1" stopColor={c.to} />
        </linearGradient>
      </defs>
      <path d="M8 2h3l1.5 5L11 8 8 2Zm8 0h-3l-1.5 5L13 8l3-6Z" fill={c.to} opacity=".7" />
      <circle cx="12" cy="14.5" r="7" fill={`url(#${id})`} />
      <circle cx="12" cy="14.5" r="7" fill="none" stroke={c.ink} strokeOpacity=".35" />
      <path d="m12 10.6 1.15 2.35 2.6.38-1.88 1.83.44 2.58L12 16.52l-2.31 1.22.44-2.58-1.88-1.83 2.6-.38Z" fill={c.ink} fillOpacity=".55" />
    </svg>
  );
}

export function LevelBadge({ level, suffix, className = '' }: { level: Level; suffix?: string; className?: string }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full bg-[var(--pi-line)] pl-1 pr-2.5 text-[12px] font-medium text-[var(--pi-ink-strong)] ${className}`}>
      <LevelMedal level={level} className="size-[18px]" />
      {t(`lvl.${level}`)}
      {suffix}
    </span>
  );
}

/** Overview card: current level, progress to the next one, and what each level unlocks. */
export function LevelCard({ data }: { data: MyLevel }) {
  const { t } = useLanguage();
  const idx = LEVELS.indexOf(data.level);
  const from = LEVEL_AT[data.level];
  const to = data.next_at ?? from;
  const pct = data.next ? Math.min(100, ((data.views - from) / Math.max(to - from, 1)) * 100) : 100;

  return (
    <section className="pi-notch pi-edge overflow-hidden bg-[var(--pi-surface)]">
      <div className="flex flex-col gap-6 p-6 md:flex-row! md:items-center! md:p-8!">
        <div className="flex items-center gap-4">
          <LevelMedal level={data.level} className="size-16 drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)]" />
          <div>
            <span className="block text-[12px] text-[var(--pi-muted)]">{t('lvl.yourLevel')}</span>
            <span className="block text-[2rem] font-light leading-none tracking-[-0.04em] text-[var(--pi-ink-strong)]">{t(`lvl.${data.level}`)}</span>
            <span className="mt-1 block text-xs text-[var(--pi-muted)]">{t('lvl.holdPerk').replace('{h}', String(data.hold_hours))}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-[var(--pi-ink)]">
              {data.next
                ? t('lvl.toNext').replace('{n}', compact(Math.max(0, to - data.views))).replace('{level}', t(`lvl.${data.next}`))
                : t('lvl.max')}
            </span>
            <span className="tabular-nums text-[var(--pi-muted)]">
              {compact(data.views)}
              {data.next ? ` / ${compact(to)}` : ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--pi-line)]">
            <div
              className="ch-grow-x h-full rounded-full"
              style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${LEVEL_COLOR[data.level].to}, ${LEVEL_COLOR[data.next || data.level].to})` }}
            />
          </div>
          <span className="mt-2 block text-[11px] text-[var(--pi-muted)]">{t('lvl.howCounted')}</span>
        </div>
      </div>
      <ol className="grid grid-cols-2 border-t border-[var(--pi-line)] sm:grid-cols-4!">
        {LEVELS.map((l, i) => {
          const reached = i <= idx;
          return (
            <li key={l} className={`flex items-center gap-3 px-5 py-4 ${i ? 'sm:border-l! border-[var(--pi-line)]' : ''} ${i % 2 ? 'border-l border-[var(--pi-line)] sm:border-l!' : ''} ${i >= 2 ? 'border-t border-[var(--pi-line)] sm:border-t-0!' : ''} ${reached ? '' : 'opacity-55'}`}>
              <LevelMedal level={l} className="size-8 shrink-0" />
              <span className="min-w-0">
                <span className={`block text-[13px] ${l === data.level ? 'font-medium text-[var(--pi-ink-strong)]' : 'text-[var(--pi-ink)]'}`}>{t(`lvl.${l}`)}</span>
                <span className="block truncate text-[11px] text-[var(--pi-muted)]">
                  {LEVEL_AT[l] ? `${compact(LEVEL_AT[l])}+` : t('lvl.start')} · {t('lvl.hold').replace('{h}', String(LEVEL_HOLD[l]))}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
