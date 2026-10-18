'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, ExternalLink } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import {
  useTelegramLink, telegramConnectLink, telegramSetEnabled, telegramUnlink, useCategoryFollows, CATEGORY_KEYS, errText,
} from '@/lib/supabase/data';
import { Btn, Notice } from '@/components/dashboard/forms';
import { Label } from '@/components/dashboard/ui';
import { TelegramButton, TelegramFeed, TelegramLogo } from '@/components/dashboard/TelegramArt';

/** Settings → Notifications: Telegram delivery + category alerts. */
export default function NotificationSettings({ userId, toast }: { userId: string; toast: (msg: string, tone?: 'green' | 'red') => void }) {
  const { t, lang } = useLanguage();
  const { data: link, loading, refresh } = useTelegramLink(userId);
  const { follows, toggle } = useCategoryFollows(userId);
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  // after opening the bot, check every 3 s (for 3 minutes) until the chat is linked
  useEffect(() => {
    if (!waiting) return;
    let n = 0;
    poll.current = setInterval(() => {
      n++;
      refresh();
      if (n > 60) setWaiting(false);
    }, 3000);
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [waiting, refresh]);
  useEffect(() => {
    if (waiting && link) {
      setWaiting(false);
      toast(t('ns.connected'));
    }
  }, [link, waiting, toast, t]);

  const connect = async () => {
    setBusy(true);
    // open the tab first (pop-up blockers), then point it at the bot
    const w = window.open('about:blank', '_blank');
    try {
      const url = await telegramConnectLink(lang);
      if (w) w.location.href = url;
      else window.location.href = url;
      setWaiting(true);
    } catch (e) {
      w?.close();
      if (/not set up/i.test(errText(e))) setNotReady(true);
      else toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast(msg);
      refresh();
    } catch (e) {
      toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="pi-notch pi-edge overflow-hidden bg-[var(--pi-surface)]">
        <div className="flex flex-col gap-5 p-6 sm:flex-row! sm:items-center! md:p-8!">
          <TelegramLogo className="size-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-light tracking-[-0.02em] text-[var(--pi-ink-strong)]">{t('ns.tgTitle')}</h3>
            <p className="mt-1 text-sm font-light text-[var(--pi-ink)]">{t('ns.tgDesc')}</p>
          </div>
          {loading && !link ? (
            <span className="h-11 w-44 animate-pulse bg-[var(--pi-line)]" />
          ) : link ? (
            <div className="flex flex-col items-start gap-2 sm:items-end!">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[13px] text-emerald-700 dark:text-emerald-400!">
                <Check className="size-3.5" strokeWidth={2.4} duotone={false} />
                {link.username ? `@${link.username}` : t('ns.linked')}
                {!link.enabled && <span className="text-[var(--pi-muted)]"> · {t('ns.paused')}</span>}
              </span>
              <div className="flex gap-1.5">
                <Btn size="sm" variant="outline" disabled={busy} onClick={() => run(() => telegramSetEnabled(!link.enabled), link.enabled ? t('ns.pausedToast') : t('ns.resumedToast'))}>
                  {link.enabled ? t('ns.pause') : t('ns.resume')}
                </Btn>
                <Btn size="sm" variant="ghost" disabled={busy} onClick={() => run(telegramUnlink, t('ns.unlinked'))}>
                  {t('ns.disconnect')}
                </Btn>
              </div>
            </div>
          ) : (
            <TelegramButton onClick={connect} busy={busy} waiting={waiting}>
              {waiting ? t('ns.waiting') : t('ns.connect')}
            </TelegramButton>
          )}
        </div>
        {waiting && !link && (
          <div className="border-t border-[var(--pi-line)] bg-[var(--pi-bg)] px-6 py-3 text-[13px] text-[var(--pi-ink)] md:px-8!">
            {t('ns.waitingHint')}
          </div>
        )}
        {notReady && (
          <div className="border-t border-[var(--pi-line)] px-6 py-3 md:px-8!">
            <Notice tone="amber">{t('ns.notReady')}</Notice>
          </div>
        )}
        <div className="border-t border-[var(--pi-line)] px-4 py-4 md:px-6!">
          <TelegramFeed t={t} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[var(--pi-ink-strong)]" />
          <h3 className="text-lg font-light tracking-[-0.02em] text-[var(--pi-ink-strong)]">{t('ns.alertsTitle')}</h3>
        </div>
        <p className="max-w-xl text-sm font-light text-[var(--pi-ink)]">{t('ns.alertsDesc')}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((c) => {
            const on = follows.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c).catch((e) => toast(errText(e), 'red'))}
                className={`cr-outline-pill flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors cursor-pointer ${on ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-ink)]'}`}
                data-active={on}
              >
                {on && <Check className="size-3.5" strokeWidth={2.4} duotone={false} />}
                {t(`create.cat.${c}`)}
              </button>
            );
          })}
        </div>
        <Label>{follows.length ? t('ns.following').replace('{n}', String(follows.length)) : t('ns.followNone')}</Label>
        {!link && follows.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--pi-muted)]">
            <ExternalLink className="size-3" /> {t('ns.alertsTgHint')}
          </p>
        )}
      </section>
    </div>
  );
}
