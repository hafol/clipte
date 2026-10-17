'use client';
import { EmptyClips } from '@/components/illustrations';

import React, { useMemo, useState } from 'react';
import { Trash2 } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useMyClips, useClipDeltas, withdrawClip, errText, type ClipRow } from '@/lib/supabase/data';
import ClipDetail from '@/components/dashboard/ClipDetail';
import { Sparkline } from '@/components/dashboard/charts';
import { NotchButton } from '@/components/pi';
import { PageHeader, StatStrip, Chip, EmptyState, ErrorNote, PlatformIcon, SkeletonRows, money, compact, CLIP_TONE } from '@/components/dashboard/ui';
import { Btn, Modal, Notice, Tabs, timeAgo, useToast } from '@/components/dashboard/forms';

type Filter = 'all' | 'hold' | 'verified' | 'problem';
const MATCH: Record<Filter, (k: ClipRow) => boolean> = {
  all: () => true,
  hold: (k) => k.status === 'tracking_hold',
  verified: (k) => k.status === 'verified',
  problem: (k) => k.status === 'rejected' || k.status === 'flagged',
};

const hoursLeft = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 3_600_000));

export default function MyClipsPage() {
  const { t, lang } = useLanguage();
  const { profile } = useUserProfile();
  const { data: clips, loading, error, refresh } = useMyClips(profile?.id);
  const { toast, toastNode } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [confirm, setConfirm] = useState<ClipRow | null>(null);
  const [open, setOpen] = useState<ClipRow | null>(null);
  const ids = useMemo(() => clips.map((k) => k.id), [clips]);
  const { data: deltas } = useClipDeltas(ids);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(
    () => ({
      views: clips.reduce((a, k) => a + k.view_count, 0),
      earned: clips.reduce((a, k) => a + k.earnings, 0),
      hold: clips.filter(MATCH.hold).length,
      verified: clips.filter(MATCH.verified).length,
    }),
    [clips]
  );
  const list = clips.filter(MATCH[filter]);

  if (!profile) return null;

  const withdraw = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await withdrawClip(confirm.id);
      toast(t('clips.withdrawn'));
      setConfirm(null);
      refresh();
    } catch (e) {
      toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      {toastNode}
      <PageHeader
        eyebrow={t('shell.clips')}
        title={t('clips.title')}
        subtitle={t('clips.subtitle')}
        actions={
          <NotchButton href="/dashboard/campaigns" size="md">
            {t('overview.c.cta')}
          </NotchButton>
        }
      />

      <StatStrip
        loading={loading}
        items={[
          { label: t('overview.c.views'), value: compact(totals.views), hint: t('overview.c.viewsHint').replace('{n}', String(clips.length)) },
          { label: t('clips.earned'), value: money(totals.earned), hint: t('clips.earnedHint') },
          { label: t('dash.clipStatus.tracking_hold'), value: String(totals.hold), hint: t('clips.holdHint') },
          { label: t('dash.clipStatus.verified'), value: String(totals.verified), hint: t('clips.verifiedHint') },
        ]}
      />

      <Tabs
        value={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: t('disc.fAll'), count: clips.length },
          { id: 'hold', label: t('dash.clipStatus.tracking_hold'), count: totals.hold },
          { id: 'verified', label: t('dash.clipStatus.verified'), count: totals.verified },
          { id: 'problem', label: t('clips.problems'), count: clips.filter(MATCH.problem).length },
        ]}
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      {loading ? (
        <SkeletonRows rows={5} />
      ) : list.length === 0 ? (
        <EmptyState
          art={<EmptyClips />}
          title={clips.length ? t('disc.noneHere') : t('overview.c.noClips')}
          desc={clips.length ? undefined : t('clips.emptyDesc')}
          action={
            !clips.length && (
              <NotchButton href="/dashboard/campaigns" size="sm" variant="outline">
                {t('overview.c.cta')}
              </NotchButton>
            )
          }
        />
      ) : (
        <div>
          {/* header row (desktop) */}
          <div className="hidden grid-cols-[minmax(0,1fr)_90px_100px_100px_120px_40px] gap-4 border-b border-[var(--pi-line)] pb-2 text-xs text-[var(--pi-muted)] md:grid!">
            <span>{t('clips.colClip')}</span>
            <span>{t('clips.colTrend')}</span>
            <span className="text-right">{t('clips.colViews')}</span>
            <span className="text-right">{t('clips.colEarned')}</span>
            <span>{t('clips.colStatus')}</span>
            <span />
          </div>
          <ul className="divide-y divide-[var(--pi-line)]">
            {list.map((k) => (
              <li key={k.id} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 md:grid-cols-[minmax(0,1fr)_90px_100px_100px_120px_40px]!">
                <button type="button" onClick={() => setOpen(k)} className="flex min-w-0 items-center gap-3 text-left cursor-pointer">
                  <span className="pi-notch flex size-9 shrink-0 items-center justify-center bg-[var(--pi-line)] text-[var(--pi-ink-strong)]">
                    <PlatformIcon platform={k.platform} />
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-sm text-[var(--pi-ink-strong)] group-hover:underline">{k.campaign?.title || '—'}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--pi-muted)]">
                      {k.account?.handle && <span className="shrink-0">@{k.account.handle} ·</span>}
                      <span className="truncate">{timeAgo(k.created_at, lang)}</span>
                    </span>
                  </div>
                </button>
                <span className="flex items-center max-md:hidden">
                  <Sparkline values={deltas[k.id]?.series || []} />
                </span>
                <span className="text-right text-sm tabular-nums text-[var(--pi-ink-strong)] max-md:hidden">
                  {compact(k.view_count)}
                  {(deltas[k.id]?.day || 0) > 0 && <span className="block text-[11px] text-emerald-600 dark:text-emerald-400!">+{compact(deltas[k.id].day)} {t('clips.today')}</span>}
                </span>
                <span className="text-right text-sm tabular-nums text-[var(--pi-ink-strong)] max-md:hidden">{money(k.earnings)}</span>
                <div className="flex flex-col items-end gap-1 md:items-start!">
                  <Chip tone={CLIP_TONE[k.status]}>{t(`dash.clipStatus.${k.status}`)}</Chip>
                  <span className="text-[11px] text-[var(--pi-muted)]">
                    {k.status === 'tracking_hold'
                      ? t('clips.hoursLeft').replace('{h}', String(hoursLeft(k.hold_until)))
                      : k.status_reason || (k.last_checked_at ? t('clips.checked').replace('{t}', timeAgo(k.last_checked_at, lang)) : '')}
                  </span>
                </div>
                {/* mobile numbers */}
                <div className="col-span-2 flex gap-5 pl-12 text-xs tabular-nums text-[var(--pi-muted)] md:hidden!">
                  <span>
                    <span className="text-[var(--pi-ink-strong)]">{compact(k.view_count)}</span> {t('common.views')}
                    {(deltas[k.id]?.day || 0) > 0 && <span className="text-emerald-600 dark:text-emerald-400!"> +{compact(deltas[k.id].day)}</span>}
                  </span>
                  <span className="text-[var(--pi-ink-strong)]">{money(k.earnings)}</span>
                  {k.status === 'tracking_hold' && (
                    <button type="button" onClick={() => setConfirm(k)} className="ml-auto text-rose-600 cursor-pointer">
                      {t('clips.withdraw')}
                    </button>
                  )}
                </div>
                <div className="hidden justify-end md:flex!">
                  {k.status === 'tracking_hold' && (
                    <button
                      type="button"
                      onClick={() => setConfirm(k)}
                      title={t('clips.withdraw')}
                      className="p-2 text-[var(--pi-muted)] transition-colors hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="size-4" strokeWidth={1.6} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 border-t border-[var(--pi-line)] pt-8 text-sm font-light leading-relaxed text-[var(--pi-ink)] md:grid-cols-3!">
        {[t('clips.rule1'), t('clips.rule2'), t('clips.rule3')].map((r, i) => (
          <p key={i} className="flex gap-3">
            <span className="tabular-nums text-[var(--pi-muted)]">{String(i + 1).padStart(2, '0')}</span>
            {r}
          </p>
        ))}
      </div>

      <ClipDetail
        clip={open}
        onClose={() => setOpen(null)}
        onWithdraw={(c) => {
          setOpen(null);
          setConfirm(c);
        }}
      />

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={t('clips.withdrawTitle')}>
        <div className="space-y-5">
          <Notice tone="amber">{t('clips.withdrawDesc')}</Notice>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setConfirm(null)}>
              {t('common.cancel')}
            </Btn>
            <Btn variant="danger" onClick={withdraw} loading={busy}>
              {t('clips.withdraw')}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
