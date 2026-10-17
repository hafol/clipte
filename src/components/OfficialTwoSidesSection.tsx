'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Eyebrow, NeonStrip, NotchButton, RevealWords, useInView } from './pi';
import { ROUTES } from '@/content/routes';

type Side = { tag: string; title: string; rows: [string, string][]; cta: string };

export default function OfficialTwoSidesSection() {
  const { t, tr, lang } = useLanguage();

  const sides: { key: string; side?: Side; href: string; dot: string; numeral: string; variant: 'solid' | 'outline' }[] = [
    { key: 'clippers', side: tr<Side>('landing.sides.clippers'), href: '/register', dot: 'var(--pi-green)', numeral: '1', variant: 'solid' },
    {
      key: 'brands',
      side: tr<Side>('landing.sides.brands'),
      href: ROUTES.contactBrands,
      dot: 'var(--pi-pink)',
      numeral: '2',
      variant: 'outline',
    },
  ];

  return (
    <section className="relative w-full border-t border-[var(--pi-line)] pt-24 md:pt-40!">
      <div className="px-6 md:px-12!">
        <Eyebrow>{t('landing.sides.label')}</Eyebrow>
        <RevealWords
          key={`sides-${lang}`}
          as="h2"
          text={t('landing.sides.title')}
          className="mt-4 max-w-[16ch] text-[clamp(2.5rem,6vw,6rem)] font-light leading-[0.92] tracking-[-0.055em] text-[var(--pi-ink-strong)]"
        />
        <p className="mt-6 max-w-xl text-lg md:text-xl! font-light leading-snug text-[var(--pi-ink)]">{t('landing.sides.desc')}</p>

        <div className="mt-16 md:mt-24! grid grid-cols-1 gap-16 lg:grid-cols-2! lg:gap-12!">
          {sides.map(({ key, side, href, dot, numeral, variant }) =>
            side ? <SideBlock key={key} side={side} href={href} dot={dot} numeral={numeral} variant={variant} /> : null
          )}
        </div>

        <p className="mt-16 text-sm text-[var(--pi-muted)]">({t('landing.sides.note')})</p>
      </div>

      <div className="mt-20 md:mt-28!">
        <NeonStrip text={t('landing.sides.strip')} href={ROUTES.contactBrands} color="var(--pi-pink)" reverse />
      </div>
    </section>
  );
}

function SideBlock({
  side,
  href,
  dot,
  numeral,
  variant,
}: {
  side: Side;
  href: string;
  dot: string;
  numeral: string;
  variant: 'solid' | 'outline';
}) {
  const view = useInView<HTMLDivElement>(0.25);
  return (
    <div ref={view.ref} className={`flex flex-col ${view.className}`}>
      <div className="flex items-end justify-between">
        <Eyebrow>{side.tag}</Eyebrow>
        <span className="font-script text-[7rem] md:text-[9rem]! leading-[0.7] text-[var(--pi-ink)] select-none" aria-hidden="true">
          {numeral}
        </span>
      </div>

      <h3 className="pi-fade mt-6 flex items-center gap-3 text-3xl md:text-[2.5rem]! font-normal leading-none tracking-[-0.04em] text-[var(--pi-ink-strong)]">
        <span className="size-4 md:size-5! shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        {side.title}
      </h3>

      <div className="mt-8">
        {side.rows.map(([label, value], i) => (
          <div key={label}>
            <div className="pi-rule h-px w-full bg-[var(--pi-line-strong)]" style={{ transitionDelay: `${0.1 + i * 0.08}s` }} />
            <div
              className="pi-fade flex items-center justify-between gap-4 py-2.5 text-sm md:text-base! tracking-tight text-[var(--pi-ink)]"
              style={{ transitionDelay: `${0.15 + i * 0.08}s` }}
            >
              <span>{label}</span>
              <span className="text-right text-[var(--pi-muted)]">{value}</span>
            </div>
          </div>
        ))}
        <div className="pi-rule h-px w-full bg-[var(--pi-line-strong)]" style={{ transitionDelay: '0.45s' }} />
      </div>

      <div className="mt-8">
        <NotchButton href={href} variant={variant} size="lg">
          {side.cta}
        </NotchButton>
      </div>
    </div>
  );
}
