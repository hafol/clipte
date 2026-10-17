'use client';
import { EmptyNotifications } from '@/components/illustrations';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BadgeCheck, CircleDollarSign, Flag, Megaphone, Video, XCircle, CheckCheck } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications, type AppNotification } from '@/lib/supabase/notifications';
import { timeAgo } from './forms';

const ICON: Record<string, React.ElementType> = {
  new_clip: Video,
  clip_verified: BadgeCheck,
  clip_rejected: XCircle,
  clip_flagged: Flag,
  campaign_funded: CircleDollarSign,
  campaign_approved: Megaphone,
  campaign_rejected: XCircle,
  campaign_completed: CheckCheck,
  payout_completed: CircleDollarSign,
  payout_failed: XCircle,
  account_verified: BadgeCheck,
};
const TONE: Record<string, string> = {
  clip_verified: 'text-emerald-600',
  campaign_approved: 'text-emerald-600',
  payout_completed: 'text-emerald-600',
  account_verified: 'text-emerald-600',
  clip_rejected: 'text-rose-600',
  campaign_rejected: 'text-rose-600',
  payout_failed: 'text-rose-600',
  clip_flagged: 'text-amber-600',
};

export function notificationText(n: AppNotification, t: (k: string) => string) {
  const d = n.data || {};
  const fill = (s: string) =>
    s
      .replace('{campaign}', d.campaign ?? '')
      .replace('{amount}', d.amount != null ? `$${Number(d.amount).toFixed(2)}` : '')
      .replace('{handle}', d.handle ? `@${d.handle}` : '')
      .replace('{platform}', d.platform ?? '');
  return { title: fill(t(`notif.${n.kind}`)), detail: d.reason ? String(d.reason) : d.reference ? String(d.reference) : null };
}

export default function NotificationsBell({ userId, className = '' }: { userId: string; className?: string }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { items, loading, unread, markAllRead, markRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        aria-label={t('shell.notifications')}
        onClick={() => setOpen((v) => !v)}
        className="pi-notch relative flex size-10 items-center justify-center text-[var(--pi-ink)] transition-colors hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)] cursor-pointer"
      >
        <Bell className="size-[18px]" strokeWidth={1.6} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[var(--pi-bg)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="pi-notch pi-edge absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] bg-[var(--pi-surface)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] max-sm:-right-24">
          <div className="flex items-center justify-between border-b border-[var(--pi-line)] px-4 py-3">
            <span className="text-[15px] font-light tracking-[-0.02em] text-[var(--pi-ink-strong)]">{t('shell.notifications')}</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-[var(--pi-ink)] underline-offset-4 hover:underline cursor-pointer">
                {t('notif.markAll')}
              </button>
            )}
          </div>
          <div className="pi-hide-scroll max-h-[420px] overflow-y-auto p-1.5" data-lenis-prevent>
            {loading ? (
              <div className="space-y-1.5 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-[var(--pi-line)]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center"><div className="w-48"><EmptyNotifications /></div><p className="text-sm font-light text-[var(--pi-muted)]">{t('shell.noNotifications')}</p></div>
            ) : (
              <ul>
                {items.map((n) => {
                  const Icon = ICON[n.kind] || Bell;
                  const { title, detail } = notificationText(n, t);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!n.is_read) markRead(n.id);
                          setOpen(false);
                          if (n.link) router.push(n.link);
                        }}
                        className="pi-notch flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--pi-line)] cursor-pointer"
                      >
                        <span className={`pi-notch mt-0.5 flex size-8 shrink-0 items-center justify-center bg-[var(--pi-line)] ${TONE[n.kind] || 'text-[var(--pi-ink-strong)]'}`}>
                          <Icon className="size-4" strokeWidth={1.7} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] leading-snug ${n.is_read ? 'text-[var(--pi-ink)]' : 'text-[var(--pi-ink-strong)]'}`}>{title}</span>
                          {detail && <span className="mt-0.5 block truncate text-xs text-[var(--pi-muted)]">{detail}</span>}
                          <span className="mt-0.5 block text-[11px] text-[var(--pi-muted)]">{timeAgo(n.created_at, lang)}</span>
                        </span>
                        {!n.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-rose-500" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
