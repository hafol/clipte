'use client';

// Animated Telegram pieces for Settings → Notifications: the floating logo, the
// "Connect Telegram" button with a flying paper plane, and the live preview feed.
import React, { useEffect, useState } from 'react';
import { BadgeCheck, Bell, CircleDollarSign, Star } from '@/components/icons';

const PLANE = 'M3.6 11.3 19.5 5.2c.74-.27 1.39.18 1.15 1.3l-2.7 12.7c-.2.9-.75 1.13-1.5.7l-4.15-3.06-2 1.93c-.22.22-.41.41-.83.41l.3-4.23 7.68-6.93c.33-.3-.07-.46-.52-.17l-9.49 5.97-4.09-1.28c-.89-.28-.9-.89.19-1.32Z';

/** Telegram logo: the plane drifts and leaves a dotted trail. */
export function TelegramLogo({ className = 'size-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`tg-logo ${className}`} aria-hidden>
      <defs>
        <linearGradient id="tg-logo-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#37BBFE" />
          <stop offset="1" stopColor="#007DBB" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#tg-logo-bg)" />
      <path className="tg-trail" d="M9 33c4-1 7-3 9.5-5.5" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 4" />
      <g className="tg-logo-plane">
        <path d={PLANE} transform="translate(9.5 9.8) scale(1.2)" fill="#fff" />
      </g>
    </svg>
  );
}

/** "Connect Telegram": floating plane, light sweep and glow; the plane takes off on hover and loops while waiting. */
export function TelegramButton({ children, onClick, busy, waiting }: { children: React.ReactNode; onClick: () => void; busy?: boolean; waiting?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} data-waiting={waiting || undefined} className="tg-btn pi-notch group relative inline-flex h-11 shrink-0 items-center gap-2.5 overflow-hidden px-5 text-[15px] font-medium text-white disabled:cursor-progress cursor-pointer">
      <span aria-hidden className="tg-shine" />
      <span aria-hidden className="relative flex size-5 items-center justify-center overflow-visible">
        <svg viewBox="0 0 24 24" className="tg-btn-plane size-5 overflow-visible">
          <path d={PLANE} fill="currentColor" />
        </svg>
      </span>
      <span className="relative">{children}</span>
    </button>
  );
}

const FEED = [
  { key: 'ex1', Icon: CircleDollarSign, tone: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400!' },
  { key: 'ex2', Icon: BadgeCheck, tone: 'bg-sky-500/12 text-sky-600 dark:text-sky-400!' },
  { key: 'ex3', Icon: Bell, tone: 'bg-amber-500/14 text-amber-600 dark:text-amber-400!' },
  { key: 'ex4', Icon: Star, tone: 'bg-violet-500/12 text-violet-600 dark:text-violet-400!' },
];

/** What Telegram messages look like — the icons take turns animating, like messages arriving. */
export function TelegramFeed({ t }: { t: (k: string) => string }) {
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = -1;
    const id = setInterval(() => {
      i = (i + 1) % FEED.length;
      setActive(i);
    }, 1700);
    return () => clearInterval(id);
  }, []);

  return (
    <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2!">
      {FEED.map(({ key, Icon, tone }, i) => (
        <li key={key} className={`ci-host flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-500 ${active === i ? 'bg-[var(--pi-line)]/60' : ''}`}>
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-500 ${tone} ${active === i ? 'scale-110' : ''}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} animate={active === i} />
          </span>
          <span className="text-[13px] font-light text-[var(--pi-ink)]">{t(`ns.${key}`)}</span>
        </li>
      ))}
    </ul>
  );
}
