'use client';

import React, { useState } from 'react';
import HeroVideoCarousel from './HeroVideoCarousel';
import GreetingTicker from './GreetingTicker';
import { useLanguage } from '@/context/LanguageContext';
import { Eyebrow, NotchButton, RevealWords } from './pi';
import { ROUTES } from '@/content/routes';

export default function OfficialHeroSection() {
  const [activeMode, setActiveMode] = useState<'clippers' | 'brands'>('clippers');
  const { t, lang } = useLanguage();

  const isClippers = activeMode === 'clippers';
  const prefix = isClippers ? 'clipper' : 'brand';
  const suffix = t(`hero.${prefix}HeadlineSuffix`);
  const headline = `${t(`hero.${prefix}Headline`)}${suffix && suffix !== `hero.${prefix}HeadlineSuffix` ? ` ${suffix}` : ''}`;

  const ctas = isClippers
    ? [
        { href: '/register', label: t('hero.startClipping'), variant: 'solid' as const },
        { href: '/dashboard/campaigns', label: t('hero.exploreCampaigns'), variant: 'outline' as const },
      ]
    : [
        { href: ROUTES.contactBrands, label: t('hero.startCampaign'), variant: 'solid' as const },
        { href: ROUTES.enterprise, label: t('hero.bookDemo'), variant: 'outline' as const },
      ];

  return (
    <section className="relative isolate w-full overflow-hidden">
      <div className="grid min-h-[100svh] grid-cols-1 gap-12 px-6 md:px-12! pt-28 md:pt-32! pb-10 lg:grid-cols-12! lg:gap-6!">
        {/* ---------- Left: statement ---------- */}
        <div className="order-1 flex flex-col justify-end lg:order-1! lg:col-span-6! lg:pb-6!">
          {/* Greeting + eyebrow */}
          <div className="flex items-center gap-4">
            <Eyebrow>{t('landing.hero.eyebrow')}</Eyebrow>
            <span className="h-px w-8 bg-[var(--pi-line-strong)]" aria-hidden="true" />
            <GreetingTicker />
          </div>

          {/* Mode switch — notched tabs */}
          <div className="mt-8 flex items-center gap-2" role="tablist" aria-label={t('landing.hero.mode')}>
            {(['clippers', 'brands'] as const).map((mode) => {
              const active = activeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveMode(mode)}
                  className={`pi-notch relative flex h-10 items-center gap-2 px-4 text-xs uppercase tracking-[0.04em] transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]'
                      : 'bg-[var(--pi-line)] text-[var(--pi-ink)] hover:bg-[var(--pi-line-strong)]'
                  }`}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: active ? (mode === 'clippers' ? 'var(--pi-green)' : 'var(--pi-pink)') : 'var(--pi-muted)' }}
                  />
                  {t(mode === 'clippers' ? 'hero.forClippers' : 'hero.forBrands')}
                </button>
              );
            })}
          </div>

          <p className="mt-10 text-xs uppercase tracking-[0.18em] text-[var(--pi-muted)]">
            {t(`hero.${prefix}Subtitle`)}
          </p>

          <RevealWords
            key={`h1-${activeMode}-${lang}`}
            as="h1"
            text={headline}
            className="mt-4 max-w-[14ch] text-[clamp(2.75rem,6.2vw,6.5rem)] font-light leading-[0.92] tracking-[-0.055em] text-[var(--pi-ink-strong)]"
            stagger={0.05}
          />

          <RevealWords
            key={`p-${activeMode}-${lang}`}
            text={t(`hero.${prefix}Desc`)}
            className="mt-8 max-w-xl text-lg md:text-xl! font-light leading-snug tracking-[-0.01em] text-[var(--pi-ink)]"
            stagger={0.012}
            delay={0.25}
          />

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            {ctas.map((cta) => (
              <NotchButton key={cta.label} href={cta.href} variant={cta.variant} size="lg">
                {cta.label}
              </NotchButton>
            ))}
          </div>
        </div>

        {/* ---------- Right: live clip collage ---------- */}
        <div className="order-2 flex items-start justify-center lg:order-2! lg:col-span-6! lg:justify-end!">
          <HeroVideoCarousel />
        </div>
      </div>

      {/* Bottom hairline meta row */}
      <div className="mx-6 md:mx-12! flex items-center justify-between border-t border-[var(--pi-line)] py-4 text-sm text-[var(--pi-muted)]">
        <span>(Scroll)</span>
        <span className="hidden sm:block!">TikTok · YouTube Shorts · Instagram Reels</span>
        <span>©{new Date().getFullYear()}</span>
      </div>
    </section>
  );
}
