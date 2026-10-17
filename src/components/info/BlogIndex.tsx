'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { BandMarquee, Eyebrow, RevealWords, useInView } from '@/components/pi';
import { GUIDES, UPCOMING_GUIDES } from '@/content/guides';
import { ROUTES } from '@/content/routes';
import InfoShell from './InfoShell';
import { formatDate } from './ArticleView';

const pad = (n: number) => String(n).padStart(2, '0');

const ROW =
  'group grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_1fr_14rem_10rem_2rem]! items-center gap-x-4 border-t border-[var(--pi-line)] py-6 md:py-8!';

export default function BlogIndex() {
  const { t, lang } = useLanguage();
  const list = useInView<HTMLOListElement>(0.1);

  return (
    <InfoShell>
      <section className="px-6 md:px-12! pt-32 md:pt-44!">
        <Eyebrow>{t('landing.info.blogLabel')}</Eyebrow>
        <RevealWords
          key={`blog-${lang}`}
          as="h1"
          text={t('landing.info.blogTitle')}
          className="mt-6 max-w-[16ch] text-[clamp(2.75rem,6vw,6rem)] font-light leading-[0.95] tracking-[-0.055em] text-[var(--pi-ink-strong)]"
          stagger={0.05}
        />
        <p className="mt-8 max-w-2xl text-lg md:text-xl! font-light leading-snug text-[var(--pi-ink)]">{t('landing.info.blogIntro')}</p>
      </section>

      <BandMarquee script="Guides" index={pad(GUIDES.length)} words={['Shorts', 'Reels', 'TikTok']} duration={44} />

      <section className="px-6 md:px-12! pb-24 md:pb-32!">
        <ol ref={list.ref} className={list.className}>
          {GUIDES.map((g, i) => (
            <li key={g.slug} className="pi-rise" style={{ transitionDelay: `${i * 0.06}s` }}>
              <a href={ROUTES.guide(g.slug)} className={`${ROW} transition-colors hover:border-[var(--pi-line-strong)]`}>
                <span className="text-sm tabular-nums text-[var(--pi-muted)]">({pad(i + 1)})</span>
                <span>
                  <span className="block text-[1.75rem] md:text-[3rem]! font-light leading-[1.05] tracking-[-0.055em] text-[var(--pi-ink)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-2">
                    {g.title[lang]}
                  </span>
                  <span className="mt-2 block max-w-xl text-sm md:text-base! font-light leading-snug text-[var(--pi-muted)]">
                    {g.excerpt[lang]}
                  </span>
                </span>
                <span className="hidden md:block! text-sm text-[var(--pi-muted)]">{g.category[lang]}</span>
                <span className="hidden md:block! text-sm text-[var(--pi-muted)]">
                  {g.minutes} {t('landing.info.minRead')}
                  <span className="block text-xs opacity-70">{formatDate(g.updated, lang)}</span>
                </span>
                <svg
                  className="size-5 justify-self-end text-[var(--pi-ink)] transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </a>
            </li>
          ))}

          {UPCOMING_GUIDES.map((g, i) => (
            <li key={g.slug} className="pi-rise" style={{ transitionDelay: `${(GUIDES.length + i) * 0.06}s` }}>
              <a href={ROUTES.guide(g.slug)} className={`${ROW} border-b`}>
                <span className="text-sm tabular-nums text-[var(--pi-muted)]">({pad(GUIDES.length + i + 1)})</span>
                <span className="text-[1.75rem] md:text-[3rem]! font-light leading-[1.05] tracking-[-0.055em] text-[var(--pi-muted)]">
                  {g.title[lang]}
                </span>
                <span className="hidden md:block! text-sm text-[var(--pi-muted)]">{g.category[lang]}</span>
                <span className="pi-notch hidden md:inline-flex! w-fit items-center bg-[var(--pi-line)] px-3 py-1 text-xs uppercase tracking-[0.08em] text-[var(--pi-ink)]">
                  {t('landing.info.soon')}
                </span>
                <span />
              </a>
            </li>
          ))}
        </ol>
      </section>
    </InfoShell>
  );
}
