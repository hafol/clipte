'use client';

import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { BandMarquee, Eyebrow, RevealWords, useInView } from '@/components/pi';
import { GUIDES } from '@/content/guides';
import { PRODUCT_PAGES } from '@/content/product';
import { COMPARE_HUB, COMPARE_PAGES } from '@/content/compare';
import { LEGAL_PAGES } from '@/content/legal';
import { LEGAL, SITE } from '@/content/site';
import { ROUTES } from '@/content/routes';
import ArticleView, { formatDate } from './ArticleView';
import InfoShell from './InfoShell';

/* ---------------- Guides ---------------- */
export function GuideArticle({ slug }: { slug: string }) {
  const { t, lang } = useLanguage();
  const index = GUIDES.findIndex((g) => g.slug === slug);
  const next = GUIDES[(index + 1) % GUIDES.length];
  return (
    <ArticleView
      article={GUIDES[index]}
      crumb={{ label: t('landing.info.guides'), href: ROUTES.blog }}
      position={{ index, total: GUIDES.length }}
      next={{ title: next.title[lang], href: ROUTES.guide(next.slug), label: t('landing.info.nextGuide') }}
    />
  );
}

/* ---------------- Product & docs ---------------- */
const PRODUCT_ORDER = ['clip', 'brands', 'enterprise', 'docs'];
const PRODUCT_HREF: Record<string, string> = { clip: ROUTES.clip, brands: ROUTES.brands, enterprise: ROUTES.enterprise, docs: ROUTES.docs };

export function ProductArticle({ pageKey }: { pageKey: string }) {
  const { t, lang } = useLanguage();
  const nextKey = PRODUCT_ORDER[(PRODUCT_ORDER.indexOf(pageKey) + 1) % PRODUCT_ORDER.length];
  const cta = pageKey === 'brands' ? 'brand' : pageKey === 'enterprise' ? 'contact' : 'clip';
  return (
    <ArticleView
      article={PRODUCT_PAGES[pageKey]}
      crumb={{ label: t('nav.product'), href: ROUTES.clip }}
      cta={cta}
      next={{ title: PRODUCT_PAGES[nextKey].title[lang], href: PRODUCT_HREF[nextKey], label: t('landing.info.nextPage') }}
    />
  );
}

/* ---------------- Compare ---------------- */
const COMPARE_ORDER = Object.keys(COMPARE_PAGES);

export function CompareArticle({ slug }: { slug: string }) {
  const { t, lang } = useLanguage();
  const nextSlug = COMPARE_ORDER[(COMPARE_ORDER.indexOf(slug) + 1) % COMPARE_ORDER.length];
  return (
    <ArticleView
      article={COMPARE_PAGES[slug]}
      crumb={{ label: t('landing.info.compareLabel'), href: ROUTES.compare }}
      next={{ title: COMPARE_PAGES[nextSlug].title[lang], href: ROUTES.compareWith(nextSlug), label: t('landing.info.nextComparison') }}
    />
  );
}

/** Index of comparisons, in the blog-list style. */
export function CompareHub() {
  const { t, lang } = useLanguage();
  const list = useInView<HTMLOListElement>(0.1);
  return (
    <InfoShell>
      <section className="px-6 md:px-12! pt-32 md:pt-44!">
        <Eyebrow>{t('landing.info.compareLabel')}</Eyebrow>
        <RevealWords
          key={`cmp-${lang}`}
          as="h1"
          text={COMPARE_HUB.title[lang]}
          className="mt-6 max-w-[16ch] text-[clamp(2.75rem,6vw,6rem)] font-light leading-[0.95] tracking-[-0.055em] text-[var(--pi-ink-strong)]"
          stagger={0.05}
        />
        <p className="mt-8 max-w-2xl text-lg md:text-xl! font-light leading-snug text-[var(--pi-ink)]">{COMPARE_HUB.excerpt[lang]}</p>
      </section>

      <BandMarquee script="Compare" index={String(COMPARE_ORDER.length).padStart(2, '0')} words={['Rates', 'Payouts', 'Trust']} duration={44} />

      <section className="px-6 md:px-12! pb-24 md:pb-32!">
        <ol ref={list.ref} className={list.className}>
          {COMPARE_ORDER.map((slug, i) => {
            const p = COMPARE_PAGES[slug];
            return (
              <li key={slug} className="pi-rise" style={{ transitionDelay: `${i * 0.06}s` }}>
                <a
                  href={ROUTES.compareWith(slug)}
                  className="group grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[4rem_1fr_12rem_2rem]! items-center gap-x-4 border-t border-[var(--pi-line)] py-6 md:py-8! last:border-b"
                >
                  <span className="text-sm tabular-nums text-[var(--pi-muted)]">({String(i + 1).padStart(2, '0')})</span>
                  <span>
                    <span className="block text-[1.75rem] md:text-[3rem]! font-light leading-[1.05] tracking-[-0.055em] text-[var(--pi-ink)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-2">
                      {p.title[lang]}
                    </span>
                    <span className="mt-2 block max-w-xl text-sm md:text-base! font-light leading-snug text-[var(--pi-muted)]">{p.excerpt[lang]}</span>
                  </span>
                  <span className="hidden md:block! text-sm text-[var(--pi-muted)]">
                    {t('landing.info.updated')} {formatDate(p.updated, lang)}
                  </span>
                  <svg className="size-5 justify-self-end text-[var(--pi-ink)] transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </a>
              </li>
            );
          })}
        </ol>
      </section>
    </InfoShell>
  );
}

/* ---------------- Legal ---------------- */
const LEGAL_ORDER = Object.keys(LEGAL_PAGES);

/** Replaces {{ENTITY}} / {{COUNTRY}} / {{CONTACT}} / {{EFFECTIVE}} from site config. */
const legalFmt = (lang: Language, t: (k: string) => string) => {
  const tbc = t('landing.info.tbc');
  const country = LEGAL.country[lang] || tbc;
  const contact = SITE.email || t('landing.info.contactRef');
  const effective = formatDate(LEGAL.effective, lang);
  const pairs: [string, string][] = [
    ['{{ENTITY}}', LEGAL.entity || tbc],
    ['{{COUNTRY}}', country],
    ['{{CONTACT}}', contact],
    ['{{EFFECTIVE}}', effective],
  ];
  return (s: string) => pairs.reduce((out, [token, value]) => out.split(token).join(value), s);
};

export function LegalArticle({ slug }: { slug: string }) {
  const { t, lang } = useLanguage();
  const nextSlug = LEGAL_ORDER[(LEGAL_ORDER.indexOf(slug) + 1) % LEGAL_ORDER.length];
  return (
    <ArticleView
      article={LEGAL_PAGES[slug]}
      crumb={{ label: t('landing.info.legalLabel'), href: ROUTES.legal(LEGAL_ORDER[0]) }}
      cta="contact"
      fmt={legalFmt(lang, t)}
      next={{ title: LEGAL_PAGES[nextSlug].title[lang], href: ROUTES.legal(nextSlug), label: t('landing.info.nextDocument') }}
    />
  );
}
