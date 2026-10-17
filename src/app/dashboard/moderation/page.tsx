'use client';
import { Success } from '@/components/illustrations';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, ExternalLink } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import {
  useStaffQueue, approveCampaign, rejectCampaign, moderateClip, recordViews, staffVerifyAccount, errText, topCpm, PLATFORM_NAME,
  type CampaignRow, type ClipRow,
} from '@/lib/supabase/data';
import { PageHeader, StatStrip, Chip, EmptyState, ErrorNote, PlatformIcon, SkeletonRows, usd, compact, CLIP_TONE, CAMPAIGN_TONE } from '@/components/dashboard/ui';
import { Btn, Field, Modal, Notice, Segmented, Tabs, boxInputCls, inputCls, timeAgo, useToast } from '@/components/dashboard/forms';
import { CampaignCover, PlatformList } from '@/components/dashboard/campaign';

type T = (k: string) => string;
type Tab = 'campaigns' | 'clips' | 'accounts';

const PROFILE_URL = {
  tiktok: (h: string) => `https://www.tiktok.com/@${h}`,
  youtube: (h: string) => `https://www.youtube.com/@${h}`,
  instagram: (h: string) => `https://www.instagram.com/${h}/`,
};

function StaffOnly({ t }: { t: T }) {
  return <EmptyState title={t('mod.noAccess')} desc={t('mod.noAccessDesc')} />;
}

export default function ModerationPage() {
  const { t, lang } = useLanguage();
  const { profile } = useUserProfile();
  const isStaff = profile?.role === 'moderator' || profile?.role === 'admin';
  const { data, loading, error, refresh } = useStaffQueue(!!isStaff);
  const { toast, toastNode } = useToast();
  const [tab, setTab] = useState<Tab>('campaigns');
  const [clipFilter, setClipFilter] = useState<'manual' | 'hold' | 'flagged' | 'verified'>('manual');
  const [rejecting, setRejecting] = useState<CampaignRow | null>(null);
  const [clipAction, setClipAction] = useState<{ clip: ClipRow; kind: 'views' | 'rejected' | 'flagged' } | null>(null);

  const review = data.campaigns.filter((c) => c.status === 'pending_review');
  const live = data.campaigns.filter((c) => c.status !== 'pending_review');
  const clips = useMemo(() => {
    const byStatus = {
      // TikTok / Instagram views aren't read automatically — a moderator enters them from analytics proof
      manual: (k: ClipRow) => k.status === 'tracking_hold' && k.platform !== 'youtube',
      hold: (k: ClipRow) => k.status === 'tracking_hold',
      flagged: (k: ClipRow) => k.status === 'flagged',
      verified: (k: ClipRow) => k.status === 'verified',
    }[clipFilter];
    return data.clips.filter(byStatus);
  }, [data.clips, clipFilter]);

  if (!profile) return null;
  if (!isStaff) return <StaffOnly t={t} />;

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast(ok);
      refresh();
    } catch (e) {
      toast(errText(e), 'red');
    }
  };

  return (
    <div className="space-y-10">
      {toastNode}
      <PageHeader eyebrow={t('shell.staff')} title={t('mod.title')} subtitle={t('mod.subtitle')} />

      <StatStrip
        loading={loading}
        items={[
          { label: t('mod.toReview'), value: String(review.length), hint: t('mod.toReviewHint') },
          { label: t('mod.manual'), value: String(data.clips.filter((k) => k.status === 'tracking_hold' && k.platform !== 'youtube').length), hint: t('mod.manualHint') },
          { label: t('dash.clipStatus.flagged'), value: String(data.clips.filter((k) => k.status === 'flagged').length), hint: t('mod.flaggedHint') },
          { label: t('mod.accounts'), value: String(data.accounts.length), hint: t('mod.accountsHint') },
        ]}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'campaigns', label: t('mod.tabCampaigns'), count: review.length },
          { id: 'clips', label: t('mod.tabClips'), count: data.clips.length },
          { id: 'accounts', label: t('mod.tabAccounts'), count: data.accounts.length },
        ]}
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}
      {loading && <SkeletonRows rows={4} />}

      {/* ---------- campaigns ---------- */}
      {!loading && tab === 'campaigns' && (
        <div className="space-y-10">
          {review.length === 0 ? (
            <EmptyState art={<Success />} title={t('mod.noReview')} />
          ) : (
            <ul className="space-y-4">
              {review.map((c) => (
                <li key={c.id} className="pi-notch pi-edge grid gap-5 bg-[var(--pi-surface)] p-5 md:grid-cols-[220px_1fr]!">
                  <CampaignCover c={c} className="pi-notch" />
                  <div className="min-w-0 space-y-4">
                    <div>
                      <span className="text-xs text-[var(--pi-muted)]">
                        {c.brand_name} · {timeAgo(c.created_at, lang)}
                      </span>
                      <Link href={`/dashboard/campaigns/${c.id}`} className="mt-1 block text-lg tracking-tight text-[var(--pi-ink-strong)] hover:underline">
                        {c.title}
                      </Link>
                    </div>
                    <p className="line-clamp-3 text-sm font-light text-[var(--pi-ink)]">{c.description || c.guidelines || '—'}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--pi-muted)]">
                      <span>
                        {t('mod.funded')}: <span className="tabular-nums text-[var(--pi-ink-strong)]">{usd(c.escrow_budget)}</span>
                      </span>
                      <span>
                        {t('create.cpm')}: <span className="tabular-nums text-[var(--pi-ink-strong)]">{usd(topCpm(c))}</span>
                      </span>
                      <PlatformList platforms={c.platforms} className="size-3.5" />
                      <a href={c.drive_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                        {t('camp.footage')} <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Btn
                        onClick={() => run(() => approveCampaign(c.id), t('mod.approved'))}
                        disabled={c.brand_id === profile.id}
                      >
                        {t('mod.approve')}
                      </Btn>
                      <Btn variant="outline" onClick={() => setRejecting(c)}>
                        {t('mod.reject')}
                      </Btn>
                      {c.brand_id === profile.id && <span className="self-center text-xs text-[var(--pi-muted)]">{t('mod.ownCampaign')}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {live.length > 0 && (
            <div>
              <h2 className="mb-3 border-b border-[var(--pi-line)] pb-3 text-lg font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{t('mod.liveCampaigns')}</h2>
              <ul className="divide-y divide-[var(--pi-line)]">
                {live.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-4 py-3.5">
                    <Link href={`/dashboard/campaigns/${c.id}`} className="min-w-0 flex-1 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
                      {c.title} <span className="text-[var(--pi-muted)]">· {c.brand_name}</span>
                    </Link>
                    <span className="text-xs tabular-nums text-[var(--pi-muted)]">
                      {usd(c.remaining_budget, 0)} / {usd(c.escrow_budget, 0)}
                    </span>
                    <Chip tone={CAMPAIGN_TONE[c.status]}>{t(`dash.campaignStatus.${c.status}`)}</Chip>
                    <Btn size="sm" variant="ghost" onClick={() => setRejecting(c)}>
                      {t('mod.stop')}
                    </Btn>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ---------- clips ---------- */}
      {!loading && tab === 'clips' && (
        <div className="space-y-6">
          <Segmented
            value={clipFilter}
            onChange={setClipFilter}
            items={[
              { id: 'manual', label: t('mod.manual') },
              { id: 'hold', label: t('dash.clipStatus.tracking_hold') },
              { id: 'flagged', label: t('dash.clipStatus.flagged') },
              { id: 'verified', label: t('dash.clipStatus.verified') },
            ]}
          />
          {clipFilter === 'manual' && <Notice tone="blue">{t('mod.manualNote')}</Notice>}
          {clips.length === 0 ? (
            <EmptyState title={t('disc.noneHere')} />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {clips.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="pi-notch flex size-9 shrink-0 items-center justify-center bg-[var(--pi-line)] text-[var(--pi-ink-strong)]">
                    <PlatformIcon platform={k.platform} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <a href={k.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
                      {k.account?.handle ? `@${k.account.handle}` : PLATFORM_NAME[k.platform]} <ExternalLink className="size-3 shrink-0 opacity-50" />
                    </a>
                    {k.owner_check === 'matched' ? (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400!">
                        <Check className="size-3" /> {t('mod.ownerOk').replace('{owner}', k.owner_handle || `@${k.account?.handle || ''}`)}
                      </span>
                    ) : (
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300!">
                        <AlertTriangle className="size-3" /> {t('mod.ownerUnknown')}
                      </span>
                    )}
                    <span className="block truncate text-xs text-[var(--pi-muted)]">
                      {k.campaign?.title} · {timeAgo(k.created_at, lang)}
                      {k.last_checked_at ? ` · ${t('clips.checked').replace('{t}', timeAgo(k.last_checked_at, lang))}` : ''}
                      {k.status_reason ? ` · ${k.status_reason}` : ''}
                    </span>
                  </div>
                  <span className="w-20 text-right text-sm tabular-nums text-[var(--pi-ink-strong)]">{compact(k.view_count)}</span>
                  <Chip tone={CLIP_TONE[k.status]}>{t(`dash.clipStatus.${k.status}`)}</Chip>
                  <div className="flex gap-1">
                    {k.status !== 'rejected' && (
                      <Btn size="sm" variant="outline" onClick={() => setClipAction({ clip: k, kind: 'views' })}>
                        {t('mod.enterViews')}
                      </Btn>
                    )}
                    {k.status === 'flagged' ? (
                      <Btn size="sm" variant="ghost" onClick={() => run(() => moderateClip(k.id, 'tracking_hold', null), t('mod.restored'))}>
                        {t('mod.restore')}
                      </Btn>
                    ) : (
                      <Btn size="sm" variant="ghost" onClick={() => setClipAction({ clip: k, kind: 'flagged' })}>
                        {t('mod.flag')}
                      </Btn>
                    )}
                    <Btn size="sm" variant="ghost" onClick={() => setClipAction({ clip: k, kind: 'rejected' })}>
                      {t('mod.reject')}
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---------- accounts ---------- */}
      {!loading && tab === 'accounts' && (
        <div className="space-y-6">
          <Notice>{t('mod.accountsNote')}</Notice>
          {data.accounts.length === 0 ? (
            <EmptyState title={t('disc.noneHere')} />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {data.accounts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-4 py-4">
                  <PlatformIcon platform={a.platform} className="size-[18px] text-[var(--pi-ink-strong)]" />
                  <a href={PROFILE_URL[a.platform](a.handle)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
                    @{a.handle} <ExternalLink className="ml-1 inline size-3 opacity-50" />
                  </a>
                  <span className="text-xs text-[var(--pi-muted)]">
                    {t('mod.code')}: <code className="tracking-widest text-[var(--pi-ink-strong)]">{a.verify_code}</code>
                  </span>
                  <span className="text-xs text-[var(--pi-muted)]">{timeAgo(a.created_at, lang)}</span>
                  <Btn size="sm" onClick={() => run(() => staffVerifyAccount(a.id), t('acc.verifiedToast'))}>
                    {t('mod.verify')}
                  </Btn>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <RejectCampaign
        c={rejecting}
        onClose={() => setRejecting(null)}
        t={t}
        onConfirm={async (reason) => {
          await run(() => rejectCampaign(rejecting!.id, reason), t('mod.rejected'));
          setRejecting(null);
        }}
      />
      <ClipDialog
        action={clipAction}
        onClose={() => setClipAction(null)}
        t={t}
        onConfirm={async (value) => {
          const a = clipAction!;
          if (a.kind === 'views') await run(() => recordViews(a.clip.id, Number(value)), t('mod.viewsSaved'));
          else await run(() => moderateClip(a.clip.id, a.kind as 'rejected' | 'flagged', value), t('common.saved'));
          setClipAction(null);
        }}
      />
    </div>
  );
}

const REASONS = ['reasonContent', 'reasonBrief', 'reasonFootage', 'reasonRates'] as const;

function RejectCampaign({ c, onClose, t, onConfirm }: { c: CampaignRow | null; onClose: () => void; t: T; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!c) return null;
  return (
    <Modal open onClose={onClose} title={c.status === 'pending_review' ? t('mod.rejectTitle') : t('mod.stopTitle')}>
      <div className="space-y-5">
        <p className="text-sm text-[var(--pi-ink)]">{c.title}</p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-3 text-sm text-[var(--pi-ink-strong)]">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--pi-ink-strong)]" />
              {t(`mod.${r}`)}
            </label>
          ))}
        </div>
        <Field label={t('mod.note')}>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={boxInputCls} maxLength={400} />
        </Field>
        <Notice tone="amber">{t('mod.refundNote').replace('{n}', usd(c.remaining_budget))}</Notice>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Btn>
          <Btn
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm([t(`mod.${reason}`), note.trim()].filter(Boolean).join(' — '));
              setBusy(false);
              setNote('');
            }}
          >
            {c.status === 'pending_review' ? t('mod.reject') : t('mod.stop')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ClipDialog({
  action,
  onClose,
  t,
  onConfirm,
}: {
  action: { clip: ClipRow; kind: 'views' | 'rejected' | 'flagged' } | null;
  onClose: () => void;
  t: T;
  onConfirm: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  if (!action) return null;
  const isViews = action.kind === 'views';
  const n = Number(value);
  const ok = isViews ? Number.isFinite(n) && n >= action.clip.view_count && n < 5e9 : value.trim().length >= 3;
  return (
    <Modal open onClose={onClose} title={isViews ? t('mod.enterViews') : action.kind === 'flagged' ? t('mod.flag') : t('mod.rejectClip')}>
      <div className="space-y-5">
        <a href={action.clip.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--pi-ink-strong)] underline underline-offset-4">
          {t('mod.openVideo')} <ExternalLink className="size-3.5" />
        </a>
        {isViews ? (
          <Field label={t('mod.viewsNow')} hint={t('mod.viewsHint').replace('{n}', action.clip.view_count.toLocaleString('en-US'))}>
            <input inputMode="numeric" autoFocus value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} className={`${inputCls} tabular-nums`} />
          </Field>
        ) : (
          <Field label={t('mod.reasonForClipper')}>
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} className={inputCls} placeholder={t('mod.reasonPh')} />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Btn>
          <Btn
            variant={isViews ? 'solid' : 'danger'}
            disabled={!ok}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(value.trim());
              setBusy(false);
              setValue('');
            }}
          >
            {t('common.save')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
