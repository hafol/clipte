'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { NotchButton, RevealWords, useInView } from '@/components/pi';
import type { Block, Guide } from '@/content/guides';
import { ROUTES } from '@/content/routes';
import InfoShell from './InfoShell';

const LOCALE: Record<Language, string> = { en: 'en-GB', ru: 'ru-RU', kk: 'kk-KZ' };

// Browsers often lack Kazakh month names in Intl (renders "2026 M10 11"), so format kk by hand
const KK_MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

export const formatDate = (iso: string, lang: Language) => {
  const d = new Date(iso);
  if (lang === 'kk') return `${d.getDate()} ${KK_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
};

const pad = (n: number) => String(n).padStart(2, '0');

export type ArticleViewProps = {
  article: Guide;
  crumb: { label: string; href: string };
  /** Big script numeral + "(01 / 06)" counter (guides). */
  position?: { index: number; total: number };
  next?: { title: string; href: string; label: string };
  cta?: 'clip' | 'brand' | 'contact';
  /** Text transform for every string (legal placeholder tokens). */
  fmt?: (s: string) => string;
};

/** Long-form page in the landing design: header, sticky contents, blocks, CTA, next link. */
export default function ArticleView({ article, crumb, position, next, cta = 'clip', fmt = (s) => s }: ArticleViewProps) {
  const { t, lang } = useLanguage();
  const blocks = article.body[lang];

  // Section headings → ids for the table of contents
  const headings = blocks.flatMap((b, i) => (b.t === 'h' ? [{ id: `s-${i}`, label: fmt(b.x) }] : []));
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-20% 0px -70% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // headings change with language / page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, article.slug]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    if (window.__lenis) window.__lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const ctas = {
    clip: { title: t('landing.info.ctaTitle'), desc: t('landing.info.ctaDesc'), href: ROUTES.register, label: t('hero.startClipping') },
    brand: { title: t('landing.info.brandCtaTitle'), desc: t('landing.info.brandCtaDesc'), href: ROUTES.contactBrands, label: t('hero.startCampaign') },
    contact: { title: t('landing.info.contactCtaTitle'), desc: t('landing.info.contactCtaDesc'), href: ROUTES.contact, label: t('nav.contact') },
  }[cta];

  let sectionNo = 0;

  return (
    <InfoShell>
      {/* ---------- Header ---------- */}
      <header className="relative px-6 md:px-12! pt-32 md:pt-44! pb-12 md:pb-16!">
        {position && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-6 md:right-12! top-24 md:top-28! hidden md:block! font-script text-[14rem] lg:text-[18rem]! leading-none text-[var(--pi-ink)] select-none"
          >
            {position.index + 1}
          </span>
        )}

        <nav className="flex items-center gap-2 text-sm text-[var(--pi-muted)]" aria-label="Breadcrumb">
          <a href={crumb.href} className="hover:text-[var(--pi-ink-strong)] transition-colors">({crumb.label})</a>
          <span>/</span>
          <span>{article.category[lang]}</span>
        </nav>

        <RevealWords
          key={`t-${lang}-${article.slug}`}
          as="h1"
          text={fmt(article.title[lang])}
          className="relative mt-6 max-w-[16ch] text-[clamp(2.75rem,6vw,6rem)] font-light leading-[0.95] tracking-[-0.055em] text-[var(--pi-ink-strong)]"
          stagger={0.05}
        />
        <p className="relative mt-8 max-w-2xl text-lg md:text-xl! font-light leading-snug text-[var(--pi-ink)]">{fmt(article.excerpt[lang])}</p>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-2 border-y border-[var(--pi-line)] py-4 text-sm text-[var(--pi-muted)]">
          <span>
            {article.minutes} {t('landing.info.minRead')}
          </span>
          <span>
            {t('landing.info.updated')} {formatDate(article.updated, lang)}
          </span>
          {position && (
            <span className="ml-auto tabular-nums">
              ({pad(position.index + 1)} / {pad(position.total)})
            </span>
          )}
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="px-6 md:px-12! grid grid-cols-1 md:grid-cols-12! gap-10 md:gap-6!">
        <aside className="hidden md:block! md:col-span-3!">
          <div className="sticky top-32">
            <p className="text-sm text-[var(--pi-muted)]">({t('landing.info.onThisPage')})</p>
            <div className="mt-3 h-px w-full bg-[var(--pi-line-strong)]" />
            <ol className="mt-3 space-y-1">
              {headings.map((h, i) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => jump(h.id)}
                    className={`group flex w-full items-baseline gap-3 py-1.5 text-left text-[15px] leading-snug tracking-tight transition-colors cursor-pointer ${
                      active === h.id ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-muted)] hover:text-[var(--pi-ink-strong)]'
                    }`}
                  >
                    <span className="tabular-nums text-xs">{pad(i + 1)}</span>
                    <span className="flex-1">{h.label}</span>
                    <span aria-hidden="true" className={`h-px bg-current transition-all duration-300 ${active === h.id ? 'w-4' : 'w-0'}`} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="md:col-span-8! md:col-start-5! xl:col-span-7! max-w-[46rem] pb-8">
          {blocks.map((b, i) => {
            if (b.t === 'h') sectionNo += 1;
            return <BlockView key={`${lang}-${i}`} block={b} id={`s-${i}`} n={sectionNo} fmt={fmt} />;
          })}
        </article>
      </div>

      {/* ---------- CTA ---------- */}
      <section className="mx-6 md:mx-12! mt-16 md:mt-24! border-t border-[var(--pi-line)] pt-16 md:pt-24!">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12!">
          <div className="md:col-span-7!">
            <RevealWords
              key={`cta-${lang}-${cta}`}
              as="h2"
              text={ctas.title}
              className="text-[clamp(2.25rem,4.5vw,4.5rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]"
            />
            <p className="mt-6 max-w-xl text-lg font-light leading-snug text-[var(--pi-ink)]">{ctas.desc}</p>
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 md:col-span-5! md:justify-end!">
            <NotchButton href={ctas.href} size="lg">
              {ctas.label}
            </NotchButton>
            <NotchButton href={ROUTES.blog} variant="outline" size="lg">
              {t('landing.info.allGuides')}
            </NotchButton>
          </div>
        </div>
      </section>

      {/* ---------- Next ---------- */}
      {next ? (
        <a href={next.href} className="group mx-6 md:mx-12! mt-20 md:mt-28! mb-24 block border-y border-[var(--pi-line)] py-8 md:py-10!">
          <p className="text-sm text-[var(--pi-muted)]">({next.label})</p>
          <div className="mt-3 flex items-center justify-between gap-6">
            <span className="text-[clamp(2rem,5vw,4.5rem)] font-light leading-[1] tracking-[-0.055em] text-[var(--pi-ink)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-3">
              {next.title}
            </span>
            <svg className="size-8 md:size-12! shrink-0 text-[var(--pi-ink)] transition-transform duration-300 group-hover:translate-x-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 12h18M14 5l7 7-7 7" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        </a>
      ) : (
        <div className="mb-24" />
      )}
    </InfoShell>
  );
}

function BlockView({ block, id, n, fmt }: { block: Block; id: string; n: number; fmt: (s: string) => string }) {
  const { t } = useLanguage();
  const view = useInView<HTMLDivElement>(0.2);

  switch (block.t) {
    case 'p':
      return <p className="mb-6 text-lg md:text-[1.2rem]! font-light leading-[1.65] text-[var(--pi-ink)]">{fmt(block.x)}</p>;

    case 'h':
      return (
        <h2 id={id} className="mt-16 mb-6 scroll-mt-32 flex items-baseline gap-4 text-[1.9rem] md:text-[2.4rem]! font-normal leading-[1.05] tracking-[-0.045em] text-[var(--pi-ink-strong)]">
          <span className="shrink-0 text-sm font-light tracking-normal text-[var(--pi-muted)] tabular-nums">({pad(n)})</span>
          {fmt(block.x)}
        </h2>
      );

    case 'ul':
      return (
        <ul ref={view.ref as React.Ref<HTMLUListElement>} className={`mb-8 ${view.className}`}>
          {block.items.map((item, i) => (
            <li
              key={i}
              className="pi-fade flex gap-4 border-t border-[var(--pi-line)] py-3.5 text-base md:text-[1.1rem]! font-light leading-snug text-[var(--pi-ink)] last:border-b"
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-[var(--pi-ink)]" />
              {fmt(item)}
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol ref={view.ref as React.Ref<HTMLOListElement>} className={`mb-8 ${view.className}`}>
          {block.items.map(([title, text], i) => (
            <li
              key={i}
              className="pi-fade grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-[var(--pi-line)] py-5 last:border-b"
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <span className="-mt-2 font-script text-[4.5rem] leading-[0.8] text-[var(--pi-ink)]" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="text-lg md:text-xl! font-normal tracking-[-0.02em] text-[var(--pi-ink-strong)]">{fmt(title)}</p>
                <p className="mt-1.5 text-base md:text-[1.05rem]! font-light leading-snug text-[var(--pi-ink)]">{fmt(text)}</p>
              </div>
            </li>
          ))}
        </ol>
      );

    case 'tip':
      return (
        <div className="pi-notch pi-edge relative my-10 bg-[var(--pi-surface)] p-6 md:p-8!">
          <p className="flex items-center gap-2 text-sm text-[var(--pi-muted)]">
            <span className="size-2.5 rounded-full bg-[var(--pi-green)]" />({t('landing.info.tip')})
          </p>
          <p className="mt-3 text-lg md:text-xl! font-light leading-snug tracking-[-0.01em] text-[var(--pi-ink-strong)]">{fmt(block.x)}</p>
        </div>
      );

    case 'note':
      return (
        <div className="pi-notch pi-edge my-8 flex gap-3 bg-[var(--pi-bg)] p-5 text-sm md:text-[0.95rem]! leading-snug text-[var(--pi-ink)]">
          <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-[var(--pi-orange)]" />
          <p>{fmt(block.x)}</p>
        </div>
      );

    case 'table':
      return (
        <div className="pi-hide-scroll my-8 -mx-6 overflow-x-auto px-6 md:mx-0! md:px-0!">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm md:text-[0.95rem]!">
            <thead>
              <tr className="border-b border-[var(--pi-line-strong)]">
                {block.head.map((h, i) => (
                  <th key={i} className="py-3 pr-4 font-normal text-[var(--pi-muted)]">
                    {fmt(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-[var(--pi-line)] align-top">
                  {r.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`py-3.5 pr-4 font-light leading-snug ${
                        ci === 0 ? 'text-[var(--pi-ink-strong)] font-normal' : 'text-[var(--pi-ink)]'
                      }`}
                    >
                      {fmt(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'faq':
      return (
        <div className="my-10">
          <p className="mb-3 text-sm text-[var(--pi-muted)]">({t('landing.info.faq')})</p>
          {block.items.map(([q, a], i) => (
            <details key={i} className="group border-t border-[var(--pi-line)] last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-normal tracking-[-0.02em] text-[var(--pi-ink-strong)] [&::-webkit-details-marker]:hidden">
                {fmt(q)}
                <span aria-hidden="true" className="relative size-3 shrink-0">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="pb-5 text-base md:text-[1.05rem]! font-light leading-snug text-[var(--pi-ink)]">{fmt(a)}</p>
            </details>
          ))}
        </div>
      );

    case 'takeaways':
      return (
        <div className="pi-notch mt-14 bg-[var(--pi-panel)] p-6 md:p-10! text-white">
          <p className="text-sm text-white/50">({t('landing.info.keyTakeaways')})</p>
          <ul className="mt-5">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-4 border-t border-white/10 py-3.5 text-base md:text-lg! font-light leading-snug last:border-b">
                <span className="tabular-nums text-sm text-white/40">{pad(i + 1)}</span>
                {fmt(item)}
              </li>
            ))}
          </ul>
        </div>
      );
  }
}
