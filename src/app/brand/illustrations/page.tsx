'use client';
import { ILLUSTRATIONS } from '@/components/illustrations';

import React, { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

const USE: Record<string, string> = {
  EmptyCampaigns: 'Discover · no live campaigns',
  EmptyClips: 'My clips · nothing submitted yet',
  EmptyChat: 'Messenger · no chats',
  EmptyNotifications: 'Bell · all caught up',
  EmptyWallet: 'Payments · no payouts yet',
  Success: 'Clip submitted · payment received',
  VerifyAccount: 'Accounts · verify with a bio code',
  NotFound: '404 · campaign or page not found',
};

// Clipte Illustrations preview
export default function IllustrationsPage() {
  const [key, setKey] = useState(0);
  return (
    <main className="pi min-h-screen px-4 pb-24 pt-10 antialiased sm:px-10!">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-[var(--pi-line)] pb-8 md:flex-row! md:items-end! md:justify-between!">
          <div>
            <span className="text-xs text-[var(--pi-muted)]">(Brand kit)</span>
            <h1 className="mt-3 text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.9] tracking-[-0.05em] text-[var(--pi-ink-strong)]">Clipte Illustrations</h1>
            <p className="mt-4 max-w-xl text-[15px] font-light text-[var(--pi-ink)]">
              Spot illustrations for empty, success and error moments — ink line, duotone tint, notched corners, logo ribbons, neon accents. Each one loops gently.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setKey((k) => k + 1)} className="pi-notch h-10 bg-[var(--pi-btn)] px-4 text-[13px] text-[var(--pi-btn-fg)] cursor-pointer">
              Replay
            </button>
            <ThemeToggle />
          </div>
        </header>
        <ul key={key} className="mt-8 grid gap-3 sm:grid-cols-2! lg:grid-cols-4!">
          {Object.entries(ILLUSTRATIONS).map(([name, Art]) => (
            <li key={name} className="pi-notch flex flex-col items-center gap-4 bg-[var(--pi-surface)] p-6">
              <Art className="w-full max-w-[220px]" />
              <div className="text-center">
                <p className="text-sm text-[var(--pi-ink-strong)]">{name}</p>
                <p className="mt-0.5 text-xs text-[var(--pi-muted)]">{USE[name]}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
