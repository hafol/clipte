'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { BandMarquee, Eyebrow, RevealWords, useInView } from './pi';

const brandLogos = [
  { name: 'CROCS', src: 'https://clipping.net/clients/crocs-logo.webp', height: 'h-6 md:h-7!' },
  { name: 'Pudgy Penguins', src: 'https://clipping.net/clients/pudgy-penguins-logo.webp', height: 'h-8 md:h-9!' },
  { name: 'Weedmaps', src: 'https://clipping.net/clients/weedmaps-logo.webp', height: 'h-6 md:h-7!' },
  { name: 'HyperX', src: 'https://clipping.net/clients/hyperx-logo.webp', height: 'h-7 md:h-8!' },
  { name: 'Kick', src: 'https://clipping.net/clients/kick-logo.webp', height: 'h-7 md:h-8!' },
  { name: 'Stake', src: 'https://clipping.net/clients/stake-logo.webp', height: 'h-8 md:h-9!' },
  { name: 'DoorDash', src: 'https://clipping.net/clients/doordash-logo.webp', height: 'h-5 md:h-6!' },
  { name: 'Cluely', src: 'https://clipping.net/clients/cluely-logo.webp', height: 'h-6 md:h-7!' },
  { name: 'Lucy', src: 'https://clipping.net/clients/lucy-logo.webp', height: 'h-7 md:h-8!' },
  { name: 'Capitol Records', src: 'https://clipping.net/clients/capitolrecords-logo.webp', height: 'h-8 md:h-9!' },
  { name: 'Atlantic Records', src: 'https://clipping.net/clients/atlanticrecords-logo.webp', height: 'h-9 md:h-10!' },
  { name: 'Photon', src: 'https://clipping.net/clients/photon-logo.webp', height: 'h-5 md:h-6!' },
];

export default function OfficialBrandMarquee() {
  const { t } = useLanguage();
  const grid = useInView<HTMLUListElement>(0.15);

  return (
    <section className="relative w-full pb-24 md:pb-40!">
      <BandMarquee script="Brands" index="01" words={['Kick', 'HyperX', 'DoorDash', 'Atlantic']} />

      <div className="px-6 md:px-12!">
        <Eyebrow>{t('landing.trusted.label')}</Eyebrow>
        <RevealWords
          text={t('landing.trusted.statement')}
          className="mt-4 max-w-[30ch] text-2xl md:text-4xl! font-light leading-none tracking-[-0.04em] text-[var(--pi-ink)]"
        />

        <ul ref={grid.ref} className={`mt-14 md:mt-20! grid grid-cols-2 sm:grid-cols-3! lg:grid-cols-6! gap-3 md:gap-6! ${grid.className}`}>
          {brandLogos.map((logo, i) => (
            <li key={logo.name} className="pi-rise" style={{ transitionDelay: `${i * 0.04}s` }}>
              <div className="group flex aspect-[16/9] items-center justify-center border border-[var(--pi-line)] bg-[var(--pi-bg)] transition-colors duration-300 hover:border-[var(--pi-line-strong)] hover:bg-[var(--pi-surface)]">
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  loading="lazy"
                  className={`w-auto max-w-[70%] object-contain brightness-0 opacity-60 dark:invert! transition-opacity duration-500 group-hover:opacity-100 ${logo.height}`}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
