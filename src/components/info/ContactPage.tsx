'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Eyebrow, NotchButton, RevealWords, useInView } from '@/components/pi';
import { ROUTES } from '@/content/routes';
import { DISCORD_URL, SITE } from '@/content/site';
import InfoShell from './InfoShell';

export default function ContactPage() {
  const { t, lang } = useLanguage();
  const grid = useInView<HTMLDivElement>(0.15);

  // ?topic=brands highlights the brand card (used by "Start a campaign" CTAs)
  const [topic, setTopic] = useState<string | null>(null);
  useEffect(() => setTopic(new URLSearchParams(window.location.search).get('topic')), []);

  const cards = [
    {
      key: 'clippers',
      dot: 'var(--pi-green)',
      action: (
        <NotchButton href={DISCORD_URL} size="md">
          {t('landing.info.contact.clippers.cta')}
        </NotchButton>
      ),
    },
    {
      key: 'brands',
      dot: 'var(--pi-pink)',
      action: (
        <NotchButton href={ROUTES.register} size="md">
          {t('landing.info.contact.brands.cta')}
        </NotchButton>
      ),
    },
    {
      key: 'press',
      dot: 'var(--pi-blue)',
      action: (
        <div className="flex flex-wrap gap-2">
          {SITE.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pi-notch flex h-10 items-center bg-[var(--pi-line)] px-4 text-sm text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-btn)] hover:text-[var(--pi-btn-fg)]"
            >
              {s.label}
            </a>
          ))}
        </div>
      ),
    },
  ];

  return (
    <InfoShell>
      <section className="px-6 md:px-12! pt-32 md:pt-44! pb-16">
        <Eyebrow>{t('landing.info.contact.label')}</Eyebrow>
        <RevealWords
          key={`contact-${lang}`}
          as="h1"
          text={t('landing.info.contact.title')}
          className="mt-6 text-[clamp(3rem,8vw,8rem)] font-light leading-[0.9] tracking-[-0.06em] text-[var(--pi-ink-strong)]"
          stagger={0.06}
        />
        <p className="mt-8 max-w-2xl text-lg md:text-xl! font-light leading-snug text-[var(--pi-ink)]">
          {t('landing.info.contact.intro')}
        </p>
        {SITE.email && (
          <p className="mt-6 text-sm text-[var(--pi-muted)]">
            ({t('landing.info.contact.emailLabel')}){' '}
            <a href={`mailto:${SITE.email}`} className="text-[var(--pi-ink-strong)] underline-offset-4 hover:underline">
              {SITE.email}
            </a>
          </p>
        )}
      </section>

      <div ref={grid.ref} className={`mx-6 md:mx-12! mb-24 md:mb-32! grid grid-cols-1 gap-4 lg:grid-cols-3! ${grid.className}`}>
        {cards.map((c, i) => {
          const highlighted = topic === c.key;
          return (
            <div key={c.key} className="pi-rise" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div
                className={`pi-notch pi-edge flex h-full flex-col bg-[var(--pi-surface)] p-6 md:p-8! ${
                  highlighted ? 'pi-edge--strong' : ''
                }`}
              >
                <p className="flex items-center gap-2 text-sm text-[var(--pi-muted)]">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: c.dot }} />({t(`landing.info.contact.${c.key}.tag`)})
                </p>
                <h2 className="mt-6 text-3xl md:text-[2.25rem]! font-normal leading-[1.05] tracking-[-0.045em] text-[var(--pi-ink-strong)]">
                  {t(`landing.info.contact.${c.key}.title`)}
                </h2>
                <p className="mt-4 flex-1 text-base md:text-lg! font-light leading-snug text-[var(--pi-ink)]">
                  {t(`landing.info.contact.${c.key}.desc`)}
                </p>
                <div className="mt-8">{c.action}</div>
              </div>
            </div>
          );
        })}
      </div>
    </InfoShell>
  );
}
