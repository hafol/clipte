'use client';

import React, { useState } from 'react';
import { ICONS } from '@/components/icons';
import ThemeToggle from '@/components/ThemeToggle';

// Clipte Icons preview — hover a tile to play its motion, or play them all.
export default function IconKitPage() {
  const [size, setSize] = useState<20 | 24 | 32 | 64>(24);
  const [all, setAll] = useState(false);
  const [tick, setTick] = useState(0);
  const entries = Object.entries(ICONS);

  return (
    <main className="pi min-h-screen px-4 pb-24 pt-10 antialiased sm:px-10!">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-[var(--pi-line)] pb-8 md:flex-row! md:items-end! md:justify-between!">
          <div>
            <span className="text-xs text-[var(--pi-muted)]">(Brand kit)</span>
            <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.9] tracking-[-0.05em] text-[var(--pi-ink-strong)]">Clipte Icons</h1>
            <p className="mt-4 max-w-xl text-[15px] font-light text-[var(--pi-ink)]">
              {entries.length} icons · 24px grid · 1.6 stroke · notched corners from the brand shape · slanted ribbons from the logo · every icon moves on hover.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="pi-notch flex h-10 items-center gap-0.5 bg-[var(--pi-line)] p-1 text-[13px]">
              {([20, 24, 32, 64] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`pi-notch h-full px-3 cursor-pointer ${size === s ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'text-[var(--pi-ink)]'}`}
                >
                  {s}px
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setAll(true);
                setTick((v) => v + 1);
                setTimeout(() => setAll(false), 1000);
              }}
              className="pi-notch h-10 bg-[var(--pi-btn)] px-4 text-[13px] text-[var(--pi-btn-fg)] cursor-pointer"
            >
              Play all
            </button>
            <ThemeToggle />
          </div>
        </header>

        <ul key={tick} className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-5! lg:grid-cols-7!">
          {entries.map(([name, Icon]) => (
            <li key={name}>
              <button
                type="button"
                className="pi-notch group flex aspect-square w-full flex-col items-center justify-center gap-3 bg-[var(--pi-surface)] text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-line)] cursor-pointer"
                title={name}
              >
                <Icon className="" animate={all} />
                <span className="max-w-full truncate px-2 text-[11px] text-[var(--pi-muted)]">{name}</span>
              </button>
            </li>
          ))}
        </ul>

        <section className="mt-12 grid gap-2 sm:grid-cols-2!">
          {['light', 'dark'].map((mode) => (
            <div key={mode} className={`pi-notch flex flex-wrap items-center gap-4 p-6 ${mode === 'dark' ? 'bg-[#141414] text-white' : 'bg-white text-[#1f1f1f]'}`}>
              {entries.slice(0, 14).map(([name, Icon]) => (
                <button key={name} type="button" className="cursor-pointer" title={name}>
                  <Icon className="size-6" />
                </button>
              ))}
            </div>
          ))}
        </section>
      </div>
      <style>{`main.pi ul .ci { width: ${size}px; height: ${size}px; } main.pi section .ci { width: 24px; height: 24px; }`}</style>
    </main>
  );
}
