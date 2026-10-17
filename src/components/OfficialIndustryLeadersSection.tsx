'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { BandMarquee, Eyebrow, RevealWords, useInView } from './pi';

type Category =
  | 'creator' | 'gaming' | 'speaker' | 'sports' | 'rapper'
  | 'singer' | 'artist' | 'producer' | 'fighter' | 'company';

type Creator = { name: string; slug: string; cat: Category };

const img = (slug: string) => `https://clipping.net/clients/${slug}.webp`;

const CREATORS: Creator[] = [
  { name: 'Bobbi Althoff', slug: 'bobbi-althoff', cat: 'creator' },
  { name: 'Jay Shetty', slug: 'jay-shetty', cat: 'speaker' },
  { name: 'Lacy', slug: 'lacy', cat: 'creator' },
  { name: 'Plaqueboymax', slug: 'plaqueboymax', cat: 'creator' },
  { name: 'Emma Chamberlain', slug: 'emma-chamberlain', cat: 'creator' },
  { name: 'Super Bowl', slug: 'super-bowl', cat: 'sports' },
  { name: 'Kreekcraft', slug: 'kreekcraft', cat: 'gaming' },
  { name: 'Young Thug', slug: 'young-thug', cat: 'rapper' },
  { name: 'Playboi Carti', slug: 'playboi-carti', cat: 'rapper' },
  { name: 'Bruno Mars', slug: 'bruno-mars', cat: 'singer' },
  { name: 'Lil Baby', slug: 'lil-baby', cat: 'rapper' },
  { name: 'Ed Sheeran', slug: 'ed-sheeran', cat: 'singer' },
  { name: 'JT', slug: 'jt', cat: 'rapper' },
  { name: 'untiljapan', slug: 'untiljapan', cat: 'artist' },
  { name: 'Offset', slug: 'offset', cat: 'rapper' },
  { name: 'Rob49', slug: 'rob49', cat: 'rapper' },
  { name: 'Toosii', slug: 'toosii', cat: 'rapper' },
  { name: 'Jermaine Dupri', slug: 'jermaine-dupri', cat: 'producer' },
  { name: 'Kocky Ka', slug: 'kocky-ka', cat: 'artist' },
  { name: 'Elijah Blake', slug: 'elijah-blake', cat: 'singer' },
  { name: 'Jackson Wang', slug: 'jackson-wang', cat: 'singer' },
  { name: 'Doechii', slug: 'doechii', cat: 'rapper' },
  { name: 'Kali Uchis', slug: 'kali-uchis', cat: 'singer' },
  { name: 'Ken Carson', slug: 'ken-carson', cat: 'rapper' },
  { name: 'Destroy Lonely', slug: 'destroy-lonely', cat: 'rapper' },
  { name: 'Wisp', slug: 'wisp', cat: 'artist' },
  { name: 'Niki', slug: 'niki', cat: 'singer' },
  { name: 'Yakiyn', slug: 'yakiyn', cat: 'artist' },
  { name: 'Lil Yachty', slug: 'lil-yachty', cat: 'rapper' },
  { name: 'Charli XCX', slug: 'charli-xcx', cat: 'singer' },
  { name: 'Nemzz', slug: 'nemzz', cat: 'rapper' },
  { name: 'Gunna', slug: 'gunna', cat: 'rapper' },
  { name: 'Skrilla', slug: 'skrilla', cat: 'rapper' },
  { name: 'bbno$', slug: 'bbno', cat: 'rapper' },
  { name: 'Lucki', slug: 'lucki', cat: 'rapper' },
  { name: 'Adin Ross', slug: 'adin-ross', cat: 'creator' },
  { name: 'Cheesur', slug: 'cheesur', cat: 'creator' },
  { name: 'Rampage Jackson', slug: 'rampage-jackson', cat: 'fighter' },
  { name: 'Hstikkytokky', slug: 'hstikkytokky', cat: 'creator' },
  { name: 'Ed Mathews', slug: 'ed-mathews', cat: 'creator' },
  { name: 'Trainwreckstv', slug: 'trainwreckstv', cat: 'creator' },
  { name: 'Ohnepixel', slug: 'ohnepixel', cat: 'creator' },
  { name: 'Stevewilldoit', slug: 'stevewilldoit', cat: 'creator' },
  { name: 'xQc', slug: 'xqc', cat: 'creator' },
  { name: 'Pudgy Penguins', slug: 'pudgy-penguins', cat: 'company' },
  { name: 'DoorDash', slug: 'doordash', cat: 'company' },
  { name: 'Cluely', slug: 'cluely', cat: 'company' },
  { name: 'Kick', slug: 'kick', cat: 'company' },
];

const FEATURED = ['xqc', 'adin-ross', 'ed-sheeran', 'charli-xcx', 'playboi-carti', 'emma-chamberlain', 'jay-shetty', 'kick'];

const ROWS: { items: Creator[]; duration: number; reverse?: boolean }[] = [
  { items: CREATORS.slice(0, 16), duration: 46 },
  { items: CREATORS.slice(16, 32), duration: 40, reverse: true },
  { items: CREATORS.slice(32), duration: 54 },
];

export default function OfficialIndustryLeadersSection() {
  const { t, lang } = useLanguage();
  const listView = useInView<HTMLDivElement>(0.15);
  const listRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{ slug: string; x: number; y: number } | null>(null);

  const featured = FEATURED.map((slug) => CREATORS.find((c) => c.slug === slug)!).filter(Boolean);
  const cat = (c: Category) => t(`landing.categories.${c}`);

  const onMove = (e: React.MouseEvent, slug: string) => {
    const box = listRef.current?.getBoundingClientRect();
    if (!box) return;
    setPreview({ slug, x: e.clientX - box.left, y: e.clientY - box.top });
  };

  return (
    <section className="relative w-full pb-24 md:pb-40!">
      <BandMarquee script="Creators" index="04" words={['Streamers', 'Labels', 'Brands']} duration={48} />

      <div className="px-6 md:px-12!">
        <Eyebrow>{t('landing.creators.label')}</Eyebrow>
        <RevealWords
          key={`creators-${lang}`}
          text={t('landing.creators.statement')}
          className="mt-4 max-w-[30ch] text-2xl md:text-4xl! font-light leading-none tracking-[-0.04em] text-[var(--pi-ink)]"
        />

        {/* ---------- Featured list (works-style rows) ---------- */}
        <div
          ref={(el) => {
            listRef.current = el;
            listView.ref.current = el;
          }}
          className={`relative mt-14 md:mt-24! grid grid-cols-1 gap-x-12 gap-y-4 md:gap-y-8! xl:grid-cols-2! ${listView.className}`}
          onMouseLeave={() => setPreview(null)}
        >
          {featured.map((c, i) => (
            <a
              key={c.slug}
              href="/dashboard/campaigns"
              onMouseMove={(e) => onMove(e, c.slug)}
              className="pi-rise group relative block"
              style={{ transitionDelay: `${(i % 2) * 0.06 + Math.floor(i / 2) * 0.08}s` }}
            >
              <div className="relative flex h-14 md:h-[4.25rem]! items-center justify-between border-y border-[var(--pi-line)] transition-colors duration-300 group-hover:border-[var(--pi-line-strong)]">
                <span className="min-w-0 truncate pr-2 text-[2rem] md:text-[3.4rem]! xl:text-[clamp(2.25rem,3.4vw,3.8rem)]! leading-[1.1] tracking-[-0.06em] text-[var(--pi-ink)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-2">
                  {c.name}
                </span>
                <span className="flex shrink-0 items-center gap-4 md:gap-8! pl-4">
                  <span className="hidden sm:block! whitespace-nowrap text-sm md:text-base! text-[var(--pi-muted)]">{cat(c.cat)}</span>
                  <Image
                    src={img(c.slug)}
                    alt={`${c.name} - ${cat(c.cat)}`}
                    width={48}
                    height={48}
                    className="size-9 md:size-12! object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                  />
                  <svg className="size-4 text-[var(--pi-ink)] transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </span>
              </div>
            </a>
          ))}

          {/* Cursor-following preview (desktop) */}
          {preview && (
            <div
              className="pointer-events-none absolute z-20 hidden md:block! w-56 aspect-[4/5] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)]"
              style={{ left: preview.x + 24, top: preview.y - 140, transition: 'left 0.25s ease-out, top 0.25s ease-out' }}
              aria-hidden="true"
            >
              <Image src={img(preview.slug)} alt="" fill sizes="224px" className="object-cover" />
            </div>
          )}
        </div>
        <p className="mt-6 hidden md:block! text-sm text-[var(--pi-muted)]">({t('landing.creators.hint')})</p>
      </div>

      {/* ---------- Full roster marquee ---------- */}
      <div data-pi-pause className="mt-16 md:mt-24! space-y-3 md:space-y-4! [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        {ROWS.map((row, r) => (
          <div key={r} className="pi-marquee-pause flex overflow-hidden">
            <div
              className={`pi-marquee-track ${row.reverse ? 'reverse' : ''}`}
              style={{ ['--pi-marquee-duration' as string]: `${row.duration}s` }}
            >
              {[0, 1].map((half) => (
                <div key={half} className="flex shrink-0 gap-3 md:gap-4! pr-3 md:pr-4!" aria-hidden={half === 1}>
                  {row.items.map((c) => (
                    <figure key={`${half}-${c.slug}`} className="group relative aspect-square w-24 sm:w-28! md:w-36! shrink-0 overflow-hidden border border-[var(--pi-line)] bg-[var(--pi-surface)]">
                      <Image
                        src={img(c.slug)}
                        alt={half === 0 ? `${c.name} - ${cat(c.cat)}` : ''}
                        fill
                        sizes="144px"
                        className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-[#1f1f1f]/85 px-2 py-1.5 text-[11px] leading-tight text-white transition-transform duration-300 group-hover:translate-y-0">
                        {c.name}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
