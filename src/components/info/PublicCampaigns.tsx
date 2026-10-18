'use client';

// Public campaign pages (/campaigns, /campaigns/[id]) — what search engines and shared links see.
// Data comes from the server page; this file only renders it in the landing design system.
import React from 'react';
import Link from 'next/link';
import InfoShell from '@/components/info/InfoShell';
import { NotchButton } from '@/components/pi';
import { useLanguage } from '@/context/LanguageContext';
import { categoryLabel, topCpm, PLATFORM_NAME, type CampaignRow } from '@/lib/supabase/data';
import { DiscoverCard, ReviewedMark } from '@/components/dashboard/discover';
import { RateTable } from '@/components/dashboard/campaign';
import { PlatformIcon, money, compact } from '@/components/dashboard/ui';
import { LevelMedal } from '@/components/dashboard/levels';
import { ROUTES } from '@/content/routes';

const joinHref = (id?: string) => `${ROUTES.register}?next=${encodeURIComponent(id ? `/dashboard/campaigns/${id}` : '/dashboard/campaigns')}`;

export function PublicCampaignList({ campaigns }: { campaigns: CampaignRow[] }) {
  const { t } = useLanguage();
  const budget = campaigns.reduce((a, c) => a + c.remaining_budget, 0);
  const best = campaigns.reduce((a, c) => Math.max(a, topCpm(c)), 0);

  return (
    <InfoShell>
      <section className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-32 sm:px-6! lg:px-10!">
        <span className="text-xs text-[var(--pi-muted)]">({t('pub.eyebrow')})</span>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5.5rem)] font-light leading-[0.92] tracking-[-0.06em] text-[var(--pi-ink-strong)]">{t('pub.title')}</h1>
        <p className="mt-5 max-w-2xl text-[17px] font-light leading-relaxed text-[var(--pi-ink)]">{t('pub.subtitle')}</p>

        <div className="mt-10 grid max-w-3xl grid-cols-3 border-y border-[var(--pi-line-strong)]">
          {[
            { label: t('pub.live'), value: String(campaigns.length) },
            { label: t('pub.budget'), value: money(budget, 0) },
            { label: t('pub.bestRate'), value: best ? `${money(best)}` : '—', sub: t('pub.per1k') },
          ].map((s, i) => (
            <div key={s.label} className={`py-5 ${i ? 'border-l border-[var(--pi-line)] pl-5' : ''}`}>
              <span className="block text-[13px] text-[var(--pi-muted)]">{s.label}</span>
              <span className="mt-2 block text-[clamp(1.5rem,3vw,2.5rem)] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">{s.value}</span>
              {s.sub && <span className="mt-1 block text-xs text-[var(--pi-muted)]">{s.sub}</span>}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <NotchButton href={joinHref()} size="lg" motion="spring">
            {t('pub.cta')}
          </NotchButton>
          <NotchButton href={ROUTES.brands} size="lg" variant="outline">
            {t('pub.ctaBrand')}
          </NotchButton>
        </div>

        <div className="@container mt-16">
          {campaigns.length === 0 ? (
            <p className="text-[15px] font-light text-[var(--pi-muted)]">{t('pub.none')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 @min-[420px]:grid-cols-2! @min-[640px]:grid-cols-3! @min-[860px]:grid-cols-4!">
              {campaigns.map((c, i) => (
                <DiscoverCard key={c.id} c={c} index={i} href={ROUTES.campaign(c.id)} />
              ))}
            </div>
          )}
        </div>

        <HowItWorks />
      </section>
    </InfoShell>
  );
}

function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section className="mt-24 border-t border-[var(--pi-line)] pt-12">
      <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-light tracking-[-0.05em] text-[var(--pi-ink-strong)]">{t('pub.howTitle')}</h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-4!">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="space-y-3">
            <span className="block text-[2.5rem] font-light leading-none tracking-[-0.06em] tabular-nums text-[var(--pi-ink-strong)]">{String(n).padStart(2, '0')}</span>
            <span className="block text-[15px] tracking-tight text-[var(--pi-ink-strong)]">{t(`pub.how${n}`)}</span>
            <span className="block text-sm font-light leading-relaxed text-[var(--pi-ink)]">{t(`pub.how${n}d`)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PublicCampaignPage({ c, similar }: { c: CampaignRow; similar: CampaignRow[] }) {
  const { t } = useLanguage();
  const spent = Math.max(0, c.escrow_budget - c.remaining_budget);
  const pct = c.escrow_budget > 0 ? Math.min(100, (spent / c.escrow_budget) * 100) : 0;

  return (
    <InfoShell>
      <article className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-28 sm:px-6! lg:px-10!">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-[var(--pi-muted)]">
          <Link href={ROUTES.campaigns} className="hover:text-[var(--pi-ink-strong)]">
            {t('pub.eyebrow')}
          </Link>{' '}
          / <span className="text-[var(--pi-ink)]">{c.brand_name}</span>
        </nav>

        <header className="pi-notch relative isolate overflow-hidden bg-[#111]">
          <div className="relative flex min-h-[380px] flex-col justify-end sm:aspect-[16/6]! sm:min-h-0!">
            {c.cover_url ? (
              <img src={c.cover_url} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_80%_0%,#3a3a3a_0%,#111_60%)]" />
            )}
            <div className="cr-hero-fade absolute inset-0" />
            <div className="relative flex flex-col gap-4 p-6 pt-24 text-white sm:absolute! sm:inset-x-0! sm:bottom-0! sm:p-10!">
              <div className="flex items-center gap-2 text-[14px] text-white/90">
                <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-white text-[9px] font-bold text-black">
                  {c.icon_url ? <img src={c.icon_url} alt="" className="size-full object-cover" /> : (c.brand_name || 'B').slice(0, 2).toUpperCase()}
                </span>
                {c.brand_name}
                <ReviewedMark />
                {c.category && <span className="text-white/55">· {categoryLabel(c.category, t)}</span>}
              </div>
              <h1 className="max-w-4xl text-[clamp(2rem,5vw,4.25rem)] font-light leading-[0.95] tracking-[-0.05em]">{c.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {c.platforms.map((p) => (
                  <span key={p} className="flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[12px] backdrop-blur-md">
                    <PlatformIcon platform={p} className="size-3.5" /> {PLATFORM_NAME[p]}
                  </span>
                ))}
                {c.min_level && (
                  <span className="flex h-7 items-center gap-1 rounded-full bg-white/15 pl-1 pr-2.5 text-[12px] backdrop-blur-md">
                    <LevelMedal level={c.min_level} className="size-5" /> {t(`lvl.${c.min_level}`)}+
                  </span>
                )}
              </div>
              <div className="pt-2">
                <NotchButton href={joinHref(c.id)} size="lg" variant="light" motion="spring">
                  {t('pub.join')}
                </NotchButton>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]!">
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 text-xl font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{t('camp.rates')}</h2>
              <RateTable c={c} />
            </section>
            {c.description && (
              <section>
                <h2 className="mb-3 text-xl font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{t('camp.about')}</h2>
                <p className="whitespace-pre-line text-[15px] font-light leading-relaxed text-[var(--pi-ink)]">{c.description}</p>
              </section>
            )}
            {(c.dos.length > 0 || c.donts.length > 0) && (
              <section className="grid gap-6 sm:grid-cols-2!">
                {[
                  { title: t('pub.dos'), items: c.dos, mark: '✓' },
                  { title: t('pub.donts'), items: c.donts, mark: '✕' },
                ]
                  .filter((b) => b.items.length)
                  .map((b) => (
                    <div key={b.title}>
                      <h3 className="mb-2 text-[15px] text-[var(--pi-ink-strong)]">{b.title}</h3>
                      <ul className="space-y-1.5 text-sm font-light text-[var(--pi-ink)]">
                        {b.items.map((x) => (
                          <li key={x} className="flex gap-2">
                            <span className="text-[var(--pi-muted)]">{b.mark}</span>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </section>
            )}
            {c.hashtags.length > 0 && <p className="text-sm text-[var(--pi-muted)]">{c.hashtags.join(' ')}</p>}
          </div>

          <aside className="space-y-5 lg:sticky! lg:top-28! lg:self-start!">
            <div className="pi-notch pi-edge space-y-4 bg-[var(--pi-surface)] p-6">
              <span className="block text-[13px] text-[var(--pi-muted)]">{t('camp.budgetLeft')}</span>
              <p className="text-[clamp(2rem,4vw,2.75rem)] font-light leading-none tracking-[-0.05em] tabular-nums text-[var(--pi-ink-strong)]">
                {money(c.remaining_budget, 0)}
                <span className="text-[0.45em] tracking-normal text-[var(--pi-muted)]"> / {money(c.escrow_budget, 0)}</span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pi-line)]">
                <div className="h-full rounded-full bg-[var(--pi-ink-strong)]" style={{ width: `${pct}%` }} />
              </div>
              <dl className="grid grid-cols-2 gap-3 pt-1 text-sm">
                <div>
                  <dt className="text-xs text-[var(--pi-muted)]">{t('pub.upTo')}</dt>
                  <dd className="tabular-nums text-[var(--pi-ink-strong)]">{money(topCpm(c))} / 1K</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--pi-muted)]">{t('pub.delivered')}</dt>
                  <dd className="tabular-nums text-[var(--pi-ink-strong)]">{compact(c.views_delivered)}</dd>
                </div>
              </dl>
              <NotchButton href={joinHref(c.id)} size="md" className="w-full">
                {t('pub.join')}
              </NotchButton>
              <p className="text-xs font-light text-[var(--pi-muted)]">{t('pub.joinNote')}</p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="@container mt-20">
            <h2 className="mb-4 text-xl font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{t('pub.similar')}</h2>
            <div className="grid grid-cols-1 gap-3 @min-[420px]:grid-cols-2! @min-[640px]:grid-cols-3! @min-[860px]:grid-cols-4!">
              {similar.map((s, i) => (
                <DiscoverCard key={s.id} c={s} index={i} href={ROUTES.campaign(s.id)} />
              ))}
            </div>
          </section>
        )}

        <HowItWorks />
      </article>
    </InfoShell>
  );
}
