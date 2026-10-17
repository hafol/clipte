'use client';

import React from 'react';
import { TikTokIcon, InstagramIcon, YouTubeIcon } from '@/components/ui/SocialIcons';
import type { Platform } from '@/lib/supabase/data';

// Small building blocks shared by dashboard pages (landing design system, app-tuned).

// money() shows the viewer's display currency ($ or ₸); usd() is always dollars (charges, payouts)
export { usd, money, moneyAlt, kzt } from '@/lib/money';

export const compact = (n: number) =>
  (Number(n) || 0) >= 10000
    ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
    : (Number(n) || 0).toLocaleString('en-US');

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-xs text-[var(--pi-muted)] ${className}`}>({children})</span>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 pb-8 md:flex-row! md:items-end! md:justify-between!">
      <div className="min-w-0">
        <Label>{eyebrow}</Label>
        <h1 className="mt-3 text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-xl text-[15px] font-light text-[var(--pi-ink)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Row of big numbers separated by hairlines. */
export function StatStrip({ items, loading }: { items: { label: string; value: string; hint?: string }[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 border-y border-[var(--pi-line-strong)] lg:grid-cols-4!">
      {items.map((s, i) => (
        <div
          key={s.label}
          className={`flex min-w-0 flex-col justify-between gap-6 px-1 py-5 sm:px-5! ${i % 2 === 1 ? 'border-l border-[var(--pi-line)] pl-4' : ''} ${
            i >= 2 ? 'border-t border-[var(--pi-line)] lg:border-t-0!' : ''
          } ${i === 2 ? 'lg:border-l! lg:border-[var(--pi-line)]!' : ''} ${i === 0 ? 'sm:pl-0!' : ''}`}
        >
          <span className="text-[13px] text-[var(--pi-muted)]">{s.label}</span>
          <div className="min-w-0">
            {loading ? (
              <span className="block h-9 w-24 animate-pulse bg-[var(--pi-line)]" />
            ) : (
              <span className="block truncate text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">
                {s.value}
              </span>
            )}
            {s.hint && <span className="mt-2 block truncate text-xs text-[var(--pi-muted)]">{s.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-[var(--pi-line)] pb-3">
        <h2 className="text-lg font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PlatformIcon({ platform, className = 'size-4' }: { platform: Platform; className?: string }) {
  if (platform === 'tiktok') return <TikTokIcon className={className} />;
  if (platform === 'instagram') return <InstagramIcon className={className} />;
  return <YouTubeIcon className={className} />;
}

const TONES = {
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400!',
  amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-400!',
  red: 'bg-rose-500/10 text-rose-700 dark:text-rose-400!',
  blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-400!',
  muted: 'bg-[var(--pi-line)] text-[var(--pi-ink)]',
} as const;

export const CLIP_TONE = { tracking_hold: 'amber', verified: 'green', rejected: 'red', flagged: 'red' } as const;
export const CAMPAIGN_TONE = {
  pending_payment: 'amber', pending_review: 'blue', active: 'green', paused: 'muted', completed: 'muted', rejected: 'red',
} as const;

export function Chip({ tone = 'muted', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`pi-notch inline-flex h-6 shrink-0 items-center whitespace-nowrap px-2 text-[11px] font-medium tracking-tight ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, desc, action, art }: { title: string; desc?: string; action?: React.ReactNode; art?: React.ReactNode }) {
  if (art) {
    return (
      <div className="pi-notch flex flex-col items-center gap-3 bg-[var(--pi-line)]/50 px-6 py-10 text-center">
        <div className="mb-2 w-44 max-w-full sm:w-52!">{art}</div>
        <p className="text-lg font-light tracking-[-0.02em] text-[var(--pi-ink-strong)]">{title}</p>
        {desc && <p className="max-w-md text-sm font-light text-[var(--pi-ink)]">{desc}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
  return (
    <div className="pi-notch flex flex-col items-start gap-3 bg-[var(--pi-line)]/60 px-6 py-8">
      <p className="text-base text-[var(--pi-ink-strong)]">{title}</p>
      {desc && <p className="max-w-md text-sm font-light text-[var(--pi-ink)]">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse bg-[var(--pi-line)]" />
      ))}
    </div>
  );
}

export function ErrorNote({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div className="pi-notch flex flex-wrap items-center justify-between gap-3 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300!">
      <span className="min-w-0 break-words">{message}</span>
      <button type="button" onClick={onRetry} className="underline underline-offset-4 cursor-pointer">
        {retryLabel}
      </button>
    </div>
  );
}

/** Thin budget bar: spent share of a campaign. */
export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-1 w-full bg-[var(--pi-line)]">
      <div className="h-full bg-[var(--pi-ink-strong)] transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}
