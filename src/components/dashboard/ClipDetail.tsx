'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, AlertTriangle } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useClipReadings, useMyAppeals, appealClip, errText, type ClipRow } from '@/lib/supabase/data';
import { Btn, Modal, Notice, boxInputCls, timeAgo } from '@/components/dashboard/forms';
import { Chip, PlatformIcon, money, moneyAlt, compact, CLIP_TONE } from '@/components/dashboard/ui';
import { AreaChart, useNow, type Point } from '@/components/dashboard/charts';

const RECHECK_HOURS = 6; // matches TRACKING_RECHECK_HOURS on the server

const dur = (ms: number, t: (k: string) => string) => {
  const h = Math.max(0, Math.round(ms / 3_600_000));
  return h >= 24 ? t('cd.dh').replace('{d}', String(Math.floor(h / 24))).replace('{h}', String(h % 24)) : t('cd.h').replace('{h}', String(Math.max(h, 1)));
};

/** One clip up close: views over time, today's gain, earnings and the road to payout. */
export default function ClipDetail({ clip, onClose, onWithdraw }: { clip: ClipRow | null; onClose: () => void; onWithdraw?: (c: ClipRow) => void }) {
  const { t, lang } = useLanguage();
  const { data: readings, loading } = useClipReadings(clip?.id);
  const now = useNow();

  // highest reading per local day → cumulative views curve
  const points: Point[] = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const r of readings) {
      const d = new Date(r.at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDay.set(key, Math.max(byDay.get(key) || 0, r.views));
    }
    return [...byDay.entries()].map(([x, y]) => ({ x, y }));
  }, [readings]);

  if (!clip) return null;

  const dayAgo = now - 86400_000;
  const before = readings.filter((r) => Date.parse(r.at) <= dayAgo);
  const today = readings.length ? Math.max(0, readings[readings.length - 1].views - (before.length ? before[before.length - 1].views : 0)) : 0;
  const holdLeft = Date.parse(clip.hold_until) - now;
  const nextCheck = clip.last_checked_at ? Date.parse(clip.last_checked_at) + RECHECK_HOURS * 3_600_000 - now : null;
  const problem = clip.status === 'flagged' || clip.status === 'rejected';
  const perK = clip.paid_views > 0 ? (clip.earnings / clip.paid_views) * 1000 : 0;

  const steps: { title: string; desc: string; state: 'done' | 'now' | 'todo' | 'bad' }[] = [
    { title: t('cd.submitted'), desc: timeAgo(clip.created_at, lang), state: 'done' },
    {
      title: t('cd.tracking'),
      desc: clip.last_checked_at
        ? `${t('cd.lastCheck').replace('{t}', timeAgo(clip.last_checked_at, lang))}${nextCheck && nextCheck > 0 && clip.status !== 'rejected' ? ` · ${t('cd.nextCheck').replace('{t}', dur(nextCheck, t))}` : ''}`
        : t('cd.firstCheck'),
      state: clip.last_checked_at ? 'done' : 'now',
    },
    problem
      ? { title: t(`dash.clipStatus.${clip.status}`), desc: clip.status_reason || t('cd.problemDesc'), state: 'bad' }
      : {
          title: t('cd.hold'),
          desc: holdLeft > 0 ? t('cd.holdLeft').replace('{t}', dur(holdLeft, t)) : t('cd.holdDone'),
          state: holdLeft > 0 ? 'now' : 'done',
        },
    {
      title: t('cd.paid'),
      desc: clip.earnings > 0 ? t('cd.paidDesc').replace('{n}', money(clip.earnings)) : clip.status === 'verified' ? t('cd.belowMin') : t('cd.paidLater'),
      state: problem ? 'todo' : clip.earnings > 0 ? 'done' : clip.status === 'verified' ? 'now' : 'todo',
    },
  ];

  return (
    <Modal open onClose={onClose} title={clip.campaign?.title || t('cd.title')} wide>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="pi-notch flex size-9 items-center justify-center bg-[var(--pi-line)] text-[var(--pi-ink-strong)]">
            <PlatformIcon platform={clip.platform} />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <span className="block truncate text-[var(--pi-ink-strong)]">{clip.account?.handle ? `@${clip.account.handle}` : clip.campaign?.brand_name}</span>
            <a href={clip.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--pi-muted)] hover:text-[var(--pi-ink-strong)]">
              {t('cd.openVideo')} <ExternalLink className="size-3" />
            </a>
          </div>
          <Chip tone={CLIP_TONE[clip.status]}>{t(`dash.clipStatus.${clip.status}`)}</Chip>
        </div>

        <div className="grid grid-cols-3 border-y border-[var(--pi-line)]">
          {[
            { label: t('stats.views'), value: compact(clip.view_count), sub: today > 0 ? t('cd.today').replace('{n}', compact(today)) : t('cd.noneToday'), good: today > 0 },
            { label: t('clips.colEarned'), value: money(clip.earnings), sub: moneyAlt(clip.earnings) },
            { label: t('cd.perK'), value: perK ? money(perK) : '—', sub: t('cd.perKHint') },
          ].map((s, i) => (
            <div key={s.label} className={`min-w-0 py-4 ${i ? 'border-l border-[var(--pi-line)] pl-4' : ''}`}>
              <span className="block text-xs text-[var(--pi-muted)]">{s.label}</span>
              <span className="mt-1.5 block truncate text-[26px] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">{s.value}</span>
              <span className={`mt-1.5 block truncate text-[11px] ${s.good ? 'text-emerald-600 dark:text-emerald-400!' : 'text-[var(--pi-muted)]'}`}>{s.sub}</span>
            </div>
          ))}
        </div>

        <div>
          <span className="text-xs text-[var(--pi-muted)]">{t('cd.growth')}</span>
          {loading ? (
            <div className="mt-2 h-[200px] animate-pulse rounded-lg bg-[var(--pi-line)]/60" />
          ) : points.length < 2 ? (
            <p className="mt-2 rounded-lg bg-[var(--pi-bg)] px-4 py-8 text-center text-sm font-light text-[var(--pi-muted)]">{t('cd.notEnough')}</p>
          ) : (
            <AreaChart data={points} format={(n) => `${compact(n)} ${t('common.views')}`} lang={lang} height={200} />
          )}
        </div>

        <ol className="relative space-y-0">
          {steps.map((s, i) => (
            <li key={s.title} className="relative flex gap-3.5 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span className={`absolute left-[11px] top-6 h-[calc(100%-20px)] w-px ${s.state === 'done' ? 'bg-emerald-500/50' : 'bg-[var(--pi-line-strong)]'}`} />
              )}
              <span
                className={`relative flex size-6 shrink-0 items-center justify-center rounded-full ${
                  s.state === 'done'
                    ? 'bg-emerald-500 text-white'
                    : s.state === 'bad'
                      ? 'bg-rose-500 text-white'
                      : s.state === 'now'
                        ? 'bg-[var(--pi-ink-strong)] text-[var(--pi-surface)]'
                        : 'border border-[var(--pi-line-strong)] bg-[var(--pi-surface)]'
                }`}
              >
                {s.state === 'done' ? <Check className="size-3.5" strokeWidth={2.5} duotone={false} /> : s.state === 'bad' ? <AlertTriangle className="size-3" duotone={false} /> : s.state === 'now' ? <span className="size-1.5 animate-pulse rounded-full bg-current" /> : null}
              </span>
              <div className="min-w-0 pt-0.5">
                <span className={`block text-sm ${s.state === 'todo' ? 'text-[var(--pi-muted)]' : 'text-[var(--pi-ink-strong)]'}`}>{s.title}</span>
                <span className="block text-xs font-light text-[var(--pi-muted)]">{s.desc}</span>
              </div>
            </li>
          ))}
        </ol>

        {problem && <AppealBox clip={clip} />}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pi-line)] pt-4">
          <Link href={`/dashboard/campaigns/${clip.campaign_id}`} className="text-[13px] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)] hover:underline">
            {t('cd.openCampaign')}
          </Link>
          {clip.status === 'tracking_hold' && onWithdraw && (
            <button type="button" onClick={() => onWithdraw(clip)} className="text-[13px] text-rose-600 hover:underline cursor-pointer">
              {t('clips.withdraw')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Contest a rejected / flagged clip: one open appeal at a time, two in total. */
function AppealBox({ clip }: { clip: ClipRow }) {
  const { t, lang } = useLanguage();
  const { data: byClip, loading, refresh } = useMyAppeals(clip.user_id);
  const appeals = byClip[clip.id] || [];
  const last = appeals[0];
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading && !appeals.length) return <div className="h-16 animate-pulse rounded-lg bg-[var(--pi-line)]/60" />;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await appealClip(clip.id, message.trim(), proof.trim() || null);
      setOpen(false);
      setMessage('');
      setProof('');
      refresh();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const canAppeal = !last || (last.status === 'declined' && appeals.length < 2);
  const proofOk = !proof.trim() || /^https?:\/\//i.test(proof.trim());

  return (
    <div className="cr-preview space-y-3 rounded-xl bg-[var(--pi-bg)] p-4">
      {last?.status === 'open' && (
        <>
          <p className="text-sm text-[var(--pi-ink-strong)]">{t('ap.sent').replace('{t}', timeAgo(last.created_at, lang))}</p>
          <p className="text-[13px] font-light text-[var(--pi-ink)]">“{last.message}”</p>
          <p className="text-xs text-[var(--pi-muted)]">{t('ap.sentHint')}</p>
        </>
      )}
      {last?.status === 'declined' && (
        <Notice tone="red">
          {t('ap.declined')}
          {last.reply ? `: ${last.reply}` : ''}
        </Notice>
      )}
      {last?.status === 'accepted' && <Notice tone="green">{t('ap.accepted')}</Notice>}

      {canAppeal && !open && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-light text-[var(--pi-ink)]">{last ? t('ap.again') : t('ap.prompt')}</p>
          <Btn size="sm" variant="outline" onClick={() => setOpen(true)}>
            {t('ap.cta')}
          </Btn>
        </div>
      )}
      {!canAppeal && last?.status === 'declined' && <p className="text-xs text-[var(--pi-muted)]">{t('ap.limit')}</p>}

      {open && (
        <div className="space-y-3">
          <textarea
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            rows={4}
            placeholder={t('ap.messagePh')}
            className={`${boxInputCls} min-h-[96px] resize-y py-2.5`}
          />
          <div className="flex justify-between text-[11px] text-[var(--pi-muted)]">
            <span>{t('ap.messageHint')}</span>
            <span className="tabular-nums">{message.trim().length}/1000</span>
          </div>
          <input value={proof} onChange={(e) => setProof(e.target.value)} placeholder={t('ap.proofPh')} className={boxInputCls} inputMode="url" />
          {!proofOk && <p className="text-xs text-rose-600">{t('ap.proofBad')}</p>}
          {error && <Notice tone="red">{error}</Notice>}
          <div className="flex justify-end gap-2">
            <Btn size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Btn>
            <Btn size="sm" onClick={send} loading={busy} disabled={message.trim().length < 10 || !proofOk}>
              {t('ap.send')}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
