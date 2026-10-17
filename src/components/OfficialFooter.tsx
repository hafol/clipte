'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '@/context/LanguageContext';
import { ClipteLogo, useInView } from './pi';
import { ROUTES } from '@/content/routes';

type ColumnKey = 'product' | 'guides' | 'compare' | 'resources' | 'legal';

const HREFS: Record<ColumnKey, string[]> = {
  product: [ROUTES.clip, ROUTES.brands, ROUTES.campaigns, ROUTES.enterprise, ROUTES.register, ROUTES.login],
  guides: [
    ROUTES.guide('how-to-become-a-clipper'),
    ROUTES.guide('how-much-do-clippers-make'),
    ROUTES.guide('clipping-side-hustle'),
    ROUTES.guide('youtube-shorts-guide'),
    ROUTES.guide('instagram-reels-guide'),
    ROUTES.guide('best-practices'),
  ],
  compare: [
    ROUTES.compare,
    ROUTES.compareWith('vyro'),
    ROUTES.compareWith('whop-clips'),
    ROUTES.compareWith('makeclout'),
    ROUTES.compareWith('best-clipping-platforms'),
  ],
  resources: [ROUTES.blog, ROUTES.docs, ROUTES.contact],
  legal: [
    ROUTES.legal('terms-of-service'),
    ROUTES.legal('privacy-policy'),
    ROUTES.legal('cookie-policy'),
    ROUTES.legal('clipper-terms'),
    ROUTES.legal('acceptable-use'),
    ROUTES.legal('data-processing'),
  ],
};

const COLUMNS: ColumnKey[] = ['product', 'guides', 'compare', 'resources', 'legal'];

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
  },
  {
    label: 'Discord',
    href: 'https://discord.com',
    path: 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
];

export default function OfficialFooter() {
  const { t, tr } = useLanguage();
  const cols = useInView<HTMLDivElement>(0.15);
  const wordmark = useInView<HTMLDivElement>(0.3);

  return (
    <footer className="relative w-full overflow-hidden border-t border-[var(--pi-line)] pt-20 md:pt-28!">
      <div className="px-6 md:px-12!">
        {/* Top: brand + socials */}
        <div className="flex flex-col gap-10 md:flex-row! md:items-start! md:justify-between!">
          <div className="max-w-md">
            <a href="/" aria-label="CLIPTE Home" className="inline-block text-[var(--pi-ink-strong)]">
              <ClipteLogo size="lg" />
            </a>
            <p className="mt-6 text-lg font-light leading-snug text-[var(--pi-ink)]">{t('landing.footer.desc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="pi-notch flex h-12 items-center gap-2 bg-[var(--pi-line)] px-4 text-sm text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-btn)] hover:text-[var(--pi-btn-fg)]"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={s.path} />
                </svg>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div ref={cols.ref} className={`mt-16 md:mt-24! grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3! lg:grid-cols-5! ${cols.className}`}>
          {COLUMNS.map((col, ci) => {
            const labels = tr<string[]>(`landing.footer.links.${col}`) ?? [];
            return (
              <div key={col}>
                <h3 className="pi-fade pb-3 text-sm text-[var(--pi-muted)]" style={{ transitionDelay: `${ci * 0.06}s` }}>
                  ({t(`landing.footer.columns.${col}`)})
                </h3>
                <div className="pi-rule h-px w-full bg-[var(--pi-line-strong)]" style={{ transitionDelay: `${ci * 0.06}s` }} />
                <ul className="mt-4 space-y-2.5">
                  {labels.map((label, i) => (
                    <li key={label}>
                      <a
                        href={HREFS[col][i] ?? '#'}
                        className="group inline-flex items-center text-[15px] tracking-tight text-[var(--pi-ink)] transition-colors hover:text-[var(--pi-ink-strong)]"
                      >
                        <span className="h-px w-0 bg-current transition-all duration-300 group-hover:mr-1.5 group-hover:w-3" aria-hidden="true" />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-[var(--pi-line)] py-6 sm:flex-row! sm:items-center!">
          <p className="text-sm text-[var(--pi-muted)]">
            © {new Date().getFullYear()} CLIPTE. {t('landing.footer.rights')}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--pi-muted)]">({t('landing.footer.theme')})</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Giant wordmark filling the width */}
      <div ref={wordmark.ref} className={`select-none pointer-events-none ${wordmark.className}`} aria-hidden="true">
        <div
          className="pi-rise pb-[2vw] text-center font-medium uppercase leading-[0.8] tracking-[-0.055em] text-[var(--pi-ink)] whitespace-nowrap"
          style={{ fontSize: '31vw' }}
        >
          Clipte
        </div>
      </div>
    </footer>
  );
}
