'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, Check } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { type CampaignRow, type Face, type Platform, rateFor, PLATFORM_NAME } from '@/lib/supabase/data';
import { PlatformIcon, usd } from './ui';
import { NotchButton } from '@/components/pi';

// Discover building blocks — structure of Whop "Content Rewards", rebuilt on Clipte data and tokens.
// Styles live in globals.css under `.cr-*`.

type Stats = { clippers: number; faces: Face[] };

const money0 = (n: number) => `$${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')}`;
const moneyK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K` : `$${Math.round(n)}`);
const rateTxt = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const shortAgo = (iso: string) => {
  const h = Math.max(0, (Date.now() - Date.parse(iso)) / 3_600_000);
  if (h < 1) return 'new';
  if (h < 24) return `${Math.floor(h)}h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d` : `${Math.floor(d / 30)}mo`;
};
const compactN = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K` : String(n));

export function cardNumbers(c: CampaignRow) {
  const rates = c.platforms.map((p) => rateFor(c, p));
  const cpms = rates.map((r) => r.cpm);
  const maxR = Math.max(c.cpm_rate, ...cpms);
  const minR = cpms.length ? Math.min(...cpms) : maxR;
  const mins = rates.map((r) => r.minPayout).filter((v): v is number => !!v);
  const caps = rates.map((r) => r.maxCap).filter((v): v is number => !!v);
  const spentPct = c.escrow_budget > 0 ? Math.min(100, Math.max(0, ((c.escrow_budget - c.remaining_budget) / c.escrow_budget) * 100)) : 0;
  return { maxR, minR, minPay: mins.length ? Math.min(...mins) : null, cap: caps.length ? Math.max(...caps) : null, spentPct };
}

/* ------------------------------ small parts ------------------------------ */

/** Dark tooltip shown while hovering the trigger. */
export function Tip({ text, children, align = 'center', below }: { text: string; children: React.ReactNode; align?: 'center' | 'left' | 'right'; below?: boolean }) {
  const pos = align === 'right' ? 'right-0 items-end' : align === 'left' ? 'left-0 items-start' : 'left-1/2 -translate-x-1/2 items-center';
  return (
    <span className="group/tip relative inline-flex min-w-0">
      {children}
      <span className={`pointer-events-none absolute z-50 hidden w-52 group-hover/tip:flex! ${below ? 'top-full mt-2 flex-col-reverse' : 'bottom-full mb-2 flex-col'} ${pos}`}>
        <span className="rounded-xl border border-white/10 bg-neutral-900/95 px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-white shadow-xl backdrop-blur-md dark:border-white/20! dark:bg-neutral-700!">
          {text}
        </span>
        <span className={`size-2 rotate-45 bg-neutral-900 dark:bg-neutral-700! ${below ? '-mb-1' : '-mt-1'} ${align === 'right' ? 'mr-3' : align === 'left' ? 'ml-3' : ''}`} />
      </span>
    </span>
  );
}

const InfoDot = () => (
  <svg className="size-2.5 shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const ReviewedMark =({ className = 'size-3.5' }: { className?: string }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 1.5l2.6 2 3.3-.3 1.2 3.1 3 1.5-.7 3.2 1.6 2.9-2.3 2.3.2 3.3-3.2.8-1.7 2.8-3.1-1.2-3.1 1.2-1.7-2.8-3.2-.8.2-3.3L.4 13.9 2 11l-.7-3.2 3-1.5 1.2-3.1 3.3.3z" fill="#f59e0b" />
    <path d="M8.2 12.4l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function BrandDot({ c, size = 'size-5' }: { c: CampaignRow; size?: string }) {
  return (
    <span className={`relative ${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--pi-btn)] text-[8px] font-bold text-[var(--pi-btn-fg)] shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.4)]!`}>
      {c.icon_url ? <img src={c.icon_url} alt="" className="size-full object-cover" /> : (c.brand_name || 'B').slice(0, 2).toUpperCase()}
    </span>
  );
}

function Cover({ c, className = '' }: { c: CampaignRow; className?: string }) {
  return c.cover_url ? (
    <img src={c.cover_url} alt="" className={`absolute inset-0 size-full object-cover ${className}`} />
  ) : (
    <div className={`absolute inset-0 flex items-end bg-[linear-gradient(135deg,var(--pi-line),var(--pi-line-strong))] p-4 [container-type:inline-size] ${className}`}>
      <span className="text-[11px] text-[var(--pi-muted)]">({c.brand_name})</span>
      <span aria-hidden className="absolute bottom-[-0.14em] right-[5%] select-none text-[44cqw] font-light leading-none tracking-[-0.08em] text-[var(--pi-ink-strong)] opacity-[0.09]">
        {(c.brand_name || 'C').slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

/* ------------------------------ card ------------------------------ */

/**
 * Discover card. The outer box reserves a fixed footprint; the inner card is centered on it
 * and grows on hover (description, rules, Join button) over its neighbours, like Content Rewards.
 */
export function DiscoverCard({ c, stats, index = 0, fixedWidth, interactive = true }: { c: CampaignRow; stats?: Stats; index?: number; fixedWidth?: boolean; interactive?: boolean }) {
  const { t } = useLanguage();
  const n = cardNumbers(c);
  const clippers = Math.max(0, stats?.clippers ?? 0);
  const faces = stats?.faces ?? [];
  const desc = c.description || c.guidelines || '';
  const rate = rateTxt(n.maxR);
  const rateTip = n.minR !== n.maxR ? t('card.rateRangeTip').replace('{min}', rateTxt(n.minR)).replace('{max}', rateTxt(n.maxR)) : t('card.rateTip');

  const body = (
    <div className={`@container ${interactive ? 'absolute inset-x-0 top-0 lg:group-hover/card:z-30!' : 'relative'}`}>
      {/* top half: cover — squared bottom, fully rounded once the card splits */}
      <div className="cr-card relative aspect-video w-full overflow-hidden rounded-t-2xl bg-[var(--pi-line)] lg:group-hover/card:rounded-2xl!">
        <Cover c={c} className={interactive ? 'transition-transform duration-[1200ms] ease-out lg:group-hover/card:scale-[1.03]!' : ''} />
      </div>

      {/* the split: a badge row opens between the halves on hover */}
      <div className="cr-split max-h-0 overflow-hidden lg:group-hover/card:max-h-[43px]!">
        <div className="cr-split-in">
          <div className="flex items-center justify-between gap-1.5 px-1 py-2">
            <span className="min-w-0">
              {c.category && (
                <Tip below text={t('card.categoryTip')} align="left">
                  <span className="cr-chip relative flex h-6 min-w-0 cursor-help items-center truncate rounded-full px-2.5 text-[11px] font-semibold text-[var(--pi-ink-strong)]">
                    {c.category.split('&')[0].trim()}
                  </span>
                </Tip>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {n.minPay && (
                <Tip below text={t('card.minTip').replace('{n}', usd(n.minPay))}>
                  <span className="cr-chip relative flex h-6 cursor-help items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold tabular-nums text-[var(--pi-ink-strong)]">
                    {t('card.min')} {money0(n.minPay)} <InfoDot />
                  </span>
                </Tip>
              )}
              <Tip below text={n.cap ? t('card.maxTip').replace('{n}', money0(n.cap)) : t('card.noCapTip')} align="right">
                <span className="cr-chip relative flex h-6 cursor-help items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold tabular-nums text-[var(--pi-ink-strong)]">
                  {n.cap ? `${t('card.max')} ${money0(n.cap)}` : t('camp.noCap')} <InfoDot />
                </span>
              </Tip>
            </span>
          </div>
        </div>
      </div>

      {/* bottom half: info — squared top, fully rounded once the card splits */}
      <div className="cr-card relative rounded-b-2xl bg-[var(--pi-surface)] lg:group-hover/card:rounded-2xl!">
      <div className="relative flex flex-col gap-2 px-4 pb-4 pt-3">
        {/* brand · time   |   platforms */}
        <div className="flex h-6 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BrandDot c={c} />
            <span className="flex min-w-0 items-center gap-1 text-[12px] font-medium leading-none">
              <span className="truncate text-[var(--pi-ink-strong)]">{c.brand_name}</span>
              <Tip text={t('card.reviewedTip')}>
                <ReviewedMark className="size-3" />
              </Tip>
              <span className="text-[var(--pi-muted)]">·</span>
              <span className="shrink-0 text-[var(--pi-muted)]">{shortAgo(c.created_at)}</span>
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center pl-2">
            <div className="flex items-center">
              {c.platforms.map((p, i) => (
                <span
                  key={p}
                  className="cr-pill-glass relative flex size-6 items-center justify-center rounded-full text-[var(--pi-ink-strong)]"
                  style={{ marginLeft: i ? -4 : 0, zIndex: c.platforms.length - i }}
                  title={PLATFORM_NAME[p]}
                >
                  <PlatformIcon platform={p} className="size-3" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col">
            <h3 className="line-clamp-1 text-[14px] font-semibold leading-5 tracking-[-0.18px] text-[var(--pi-ink-strong)]">{c.title}</h3>
          </div>

          {/* budget   |   clippers · rate */}
          <div className="flex h-6 items-center justify-between gap-2">
            <span className="min-w-0 flex-1 overflow-hidden">
            <Tip text={t('card.budgetTip')} align="left">
              <span className="block cursor-help truncate whitespace-nowrap text-[12px] font-semibold leading-[14px] tabular-nums">
                <span className="@max-[250px]:hidden!">
                  <span className="text-[var(--pi-ink-strong)]">{money0(c.remaining_budget)}</span>
                  <span className="text-[var(--pi-muted)]">/{money0(c.escrow_budget)}</span>
                </span>
                <span className="hidden @max-[250px]:inline!">
                  <span className="text-[var(--pi-ink-strong)]">{moneyK(c.remaining_budget)}</span>
                  <span className="text-[var(--pi-muted)]">/{moneyK(c.escrow_budget)}</span>
                </span>
              </span>
            </Tip>
            </span>
            <div className="flex shrink-0 items-center -space-x-1">
              <Tip text={t('card.clippersTip').replace('{n}', String(clippers))}>
                <span className="cr-pill-glass relative z-[1] flex h-6 cursor-help items-center gap-1 rounded-full px-2 text-[12px] font-semibold text-[var(--pi-ink-strong)]">
                  {faces.length ? (
                    <span className="flex -space-x-1 @max-[250px]:hidden!">
                      {faces.slice(0, 3).map((f, i) =>
                        f.avatar ? (
                          <img key={i} src={f.avatar} alt="" className="size-4 rounded-full object-cover ring-1 ring-[var(--pi-surface)]" />
                        ) : (
                          <span key={i} className="flex size-4 items-center justify-center rounded-full bg-[var(--pi-btn)] text-[8px] font-bold text-[var(--pi-btn-fg)] ring-1 ring-[var(--pi-surface)]">
                            {(f.name || '?').slice(0, 1).toUpperCase()}
                          </span>
                        )
                      )}
                    </span>
                  ) : null}
                  {(
                    <svg className={`size-3 fill-current opacity-70 ${faces.length ? 'hidden @max-[250px]:block!' : ''}`} viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                  {compactN(clippers)}
                </span>
              </Tip>
              <Tip text={rateTip} align="right">
                <span className="cr-pill-blue relative flex h-6 cursor-help items-center whitespace-nowrap rounded-full px-2 text-[12px] font-semibold">
                  <span className="text-blue-500 dark:text-[#89B6FF]!">{rate}</span>
                  <span className="text-blue-500/70 dark:text-[rgba(137,182,255,0.7)]!">/1K</span>
                </span>
              </Tip>
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-1 w-full overflow-hidden rounded-b-2xl">
        <div className="cr-track absolute inset-0" />
        <div className="cr-fill absolute inset-y-0 left-0" style={{ width: `${n.spentPct}%` }} />
      </div>
      </div>
    </div>
  );

  if (!interactive) return body;

  return (
    <Link
      href={`/dashboard/campaigns/${c.id}`}
      aria-label={c.title}
      className={`group/card cr-enter relative block shrink-0 text-left focus-visible:outline-none lg:hover:z-30! ${fixedWidth ? 'w-[264px] sm:w-[280px]!' : 'w-full'}`}
      style={{ ['--enter-d' as string]: Math.min(index, 12) * 25 }}
    >
      {/* footprint: cover + collapsed info */}
      <div className="invisible" aria-hidden>
        <div className="aspect-video" />
        <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
          <div className="h-6" />
          <div className="flex flex-col gap-1.5">
            <div className="h-5" />
            <div className="h-6" />
          </div>
        </div>
        <div className="h-1" />
      </div>
      {body}
    </Link>
  );
}

/* ------------------------------ horizontal row ------------------------------ */

export function CardRow({ title, campaigns, stats, onSeeAll }: { title: string; campaigns: CampaignRow[]; stats: Record<string, Stats>; onSeeAll?: () => void }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };
  useEffect(update, [campaigns.length]);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(300, (ref.current.clientWidth * 0.8) | 0), behavior: 'smooth' });
  if (!campaigns.length) return null;

  return (
    <section className="relative [&:has(.group\/card:hover)]:z-10" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--pi-ink-strong)] md:text-xl!">{title}</h2>
        <div className="flex items-center gap-1">
          {onSeeAll && (
            <button type="button" onClick={onSeeAll} className="mr-2 text-[13px] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)] cursor-pointer">
              {t('disc.seeAll')}
            </button>
          )}
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d as 1 | -1)}
              disabled={d === -1 ? edge.start : edge.end}
              aria-label={d === -1 ? t('disc.prev') : t('disc.next')}
              className="cr-outline-pill flex size-8 items-center justify-center rounded-full text-[var(--pi-ink-strong)] transition-opacity disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              {d === -1 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} onScroll={update} className="cr-row -mx-4 -my-24 flex items-start gap-3 overflow-x-auto overscroll-x-contain px-4 py-24 scroll-px-4 sm:-mx-6! sm:px-6! sm:scroll-px-6! lg:-mx-10! lg:px-10! lg:scroll-px-10!">
        {campaigns.map((c, i) => (
          <DiscoverCard key={c.id} c={c} stats={stats[c.id]} index={i} fixedWidth />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ hero carousel ------------------------------ */

export function HeroCarousel({ campaigns }: { campaigns: CampaignRow[] }) {
  const { t } = useLanguage();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = campaigns.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % count), 6500);
    return () => clearInterval(id);
  }, [paused, count]);
  useEffect(() => setI(0), [count]);
  if (!count) return null;
  const go = (d: number) => setI((v) => (v + d + count) % count);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      className="group/banner pi-notch relative isolate overflow-hidden bg-[#111]"
      aria-label={t('disc.featured')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/7]!">
        {campaigns.map((c, k) => {
          const n = cardNumbers(c);
          const active = k === i;
          return (
            <div key={c.id} className={`absolute inset-0 transition-opacity duration-1000 ease-out ${active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!active}>
              {c.cover_url ? (
                <img src={c.cover_url} alt="" className={`absolute inset-0 size-full object-cover transition-transform duration-[7000ms] ease-out ${active ? 'scale-[1.05]' : 'scale-100'}`} />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_80%_0%,#3a3a3a_0%,#111_60%)]">
                  <span aria-hidden className="absolute -bottom-[0.15em] right-[4%] select-none text-[min(28rem,48vw)] font-light leading-none tracking-[-0.08em] text-white/[0.06]">
                    {(c.brand_name || 'C').slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="cr-hero-fade absolute inset-0" />

              {/* top bar: eyebrow + counter, like the landing sections */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 text-[13px] text-white/80 sm:p-8! lg:px-10!">
                <span className="flex items-center gap-2">
                  <svg className="size-2.5" viewBox="0 0 10 10" aria-hidden>
                    <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" />
                    <line y1="5" x2="10" y2="5" stroke="currentColor" />
                  </svg>
                  ({t('disc.featured')})
                </span>
                {count > 1 && (
                  <span className="tabular-nums">
                    {pad(i + 1)} <span className="text-white/45">/ {pad(count)}</span>
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 p-5 text-white sm:p-8! lg:p-10!">
                <div className="flex max-w-3xl flex-col gap-3">
                  <div className="flex items-center gap-2 text-[14px] text-white/90">
                    <BrandDot c={c} />
                    <span className="truncate">{c.brand_name}</span>
                    <ReviewedMark />
                  </div>
                  <h2 className="line-clamp-2 text-[clamp(2rem,4.6vw,4rem)] font-light leading-[0.95] tracking-[-0.05em]">{c.title}</h2>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 text-[14px] font-light text-white/70">
                    {c.category && (
                      <>
                        <span>{c.category}</span>
                        <span className="text-white/40">·</span>
                      </>
                    )}
                    <span>
                      <span className="text-white">{rateTxt(n.maxR)}</span> / 1K {t('common.views')}
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="tabular-nums">{money0(c.remaining_budget)}</span>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-6">
                  <NotchButton href={`/dashboard/campaigns/${c.id}`} size="lg" variant="light" motion="spring">
                    {t('disc.join')}
                  </NotchButton>
                  {count > 1 && (
                    <div className="flex items-center gap-1.5 pb-2">
                      {campaigns.map((_, d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setI(d)}
                          aria-label={`${d + 1}`}
                          aria-current={d === i}
                          className="group/dot relative h-6 cursor-pointer"
                          style={{ width: d === i ? 40 : 18 }}
                        >
                          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/35" />
                          {d === i && <span key={`${i}-${paused}`} className={`absolute left-0 top-1/2 h-px -translate-y-1/2 bg-white ${paused ? 'w-full' : 'cr-hero-progress'}`} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {count > 1 &&
        [-1, 1].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => go(d)}
            aria-label={d === -1 ? t('disc.prev') : t('disc.next')}
            className={`pi-notch absolute top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center bg-white/15 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 hover:bg-white/25 group-hover/banner:opacity-100! sm:flex! cursor-pointer ${d === -1 ? 'left-4' : 'right-4'}`}
          >
            {d === -1 ? <ChevronLeft className="size-5" strokeWidth={1.5} /> : <ChevronRight className="size-5" strokeWidth={1.5} />}
          </button>
        ))}
    </section>
  );
}

/* ------------------------------ filter pill ------------------------------ */

export function FilterPill<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { id: T; label: React.ReactNode }[];
  onChange: (v: T | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const current = options.find((o) => o.id === value);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-active={!!current}
        className="cr-outline-pill flex h-9 items-center gap-2 rounded-full pl-3 pr-2.5 text-[14px] text-[var(--pi-ink)] transition-[transform,border-color] duration-150 active:scale-[0.95] cursor-pointer"
      >
        <span className="whitespace-nowrap">{current ? current.label : label}</span>
        <ChevronDown className={`size-4 opacity-70 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-50 min-w-[190px] rounded-2xl border border-[var(--pi-line)] bg-[var(--pi-surface)] p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id === value ? null : o.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-line)] cursor-pointer"
            >
              <span className="flex items-center gap-2">{o.label}</span>
              {o.id === value && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const platformOptions = (all: Platform[] = ['tiktok', 'youtube', 'instagram']) =>
  all.map((p) => ({
    id: p,
    label: (
      <>
        <PlatformIcon platform={p} className="size-3.5" /> {PLATFORM_NAME[p]}
      </>
    ),
  }));
