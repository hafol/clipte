'use client';
import { Success } from '@/components/illustrations';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useAdminData, useTracking, runTrackingNow, processPayout, errText, METHOD_NAME, type PayoutRow, type TrackingRun } from '@/lib/supabase/data';
import { PageHeader, StatStrip, Section, Chip, EmptyState, ErrorNote, SkeletonRows, money, compact, CAMPAIGN_TONE } from '@/components/dashboard/ui';
import { Btn, CopyButton, Field, Modal, Notice, Tabs, inputCls, timeAgo, useToast } from '@/components/dashboard/forms';
import PlatformStats from '@/components/dashboard/PlatformStats';

type T = (k: string) => string;
type Tab = 'analytics' | 'payouts' | 'campaigns' | 'tracking';

export default function AdminPage() {
  const { t, lang } = useLanguage();
  const { profile } = useUserProfile();
  const isAdmin = profile?.role === 'admin';
  const { data, loading, error, refresh } = useAdminData(!!isAdmin);
  const { toast, toastNode } = useToast();
  const [tab, setTab] = useState<Tab>('analytics');
  const [acting, setActing] = useState<{ p: PayoutRow; kind: 'completed' | 'failed' } | null>(null);

  if (!profile) return null;
  if (!isAdmin) return <EmptyState title={t('mod.noAccess')} desc={t('mod.noAccessDesc')} />;

  const queue = data.payouts.filter((p) => p.status === 'processing');
  const live = data.campaigns.filter((c) => c.status === 'active');
  const escrow = data.campaigns.reduce((a, c) => a + c.remaining_budget, 0);

  return (
    <div className="space-y-10">
      {toastNode}
      <PageHeader eyebrow={t('shell.staff')} title={t('adm.title')} subtitle={t('adm.subtitle')} />

      <StatStrip
        loading={loading}
        items={[
          { label: t('adm.users'), value: compact(data.users), hint: t('adm.usersHint') },
          { label: t('overview.b.live'), value: String(live.length), hint: t('overview.b.liveHint').replace('{n}', String(data.campaigns.length)) },
          { label: t('adm.escrow'), value: money(escrow, 0), hint: t('adm.escrowHint') },
          { label: t('adm.queue'), value: money(queue.reduce((a, p) => a + p.amount, 0)), hint: t('adm.queueHint').replace('{n}', String(queue.length)) },
        ]}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'analytics', label: t('ps.tab') },
          { id: 'payouts', label: t('adm.tabPayouts'), count: queue.length },
          { id: 'campaigns', label: t('adm.tabCampaigns'), count: data.campaigns.length },
          { id: 'tracking', label: t('trk.tab') },
        ]}
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}
      {loading && (tab === 'payouts' || tab === 'campaigns') && <SkeletonRows rows={4} />}

      {!loading && tab === 'payouts' && (
        <div className="space-y-10">
          <Section title={t('adm.toSend')}>
            {queue.length === 0 ? (
              <EmptyState art={<Success />} title={t('adm.noQueue')} />
            ) : (
              <ul className="divide-y divide-[var(--pi-line)]">
                {queue.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm text-[var(--pi-ink-strong)]">
                        {money(p.amount)} · {METHOD_NAME[p.method_type] || p.method_type}
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-2 text-xs text-[var(--pi-muted)]">
                        <code className="truncate">{p.recipient}</code>
                        <CopyButton value={p.recipient} label={t('common.copy')} copiedLabel={t('common.copied')} />
                      </span>
                    </div>
                    <span className="text-xs text-[var(--pi-muted)]">{timeAgo(p.created_at, lang)}</span>
                    <div className="flex gap-1.5">
                      <Btn size="sm" onClick={() => setActing({ p, kind: 'completed' })}>
                        {t('adm.markSent')}
                      </Btn>
                      <Btn size="sm" variant="ghost" onClick={() => setActing({ p, kind: 'failed' })}>
                        {t('adm.markFailed')}
                      </Btn>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title={t('pay.history')}>
            {data.payouts.filter((p) => p.status !== 'processing').length === 0 ? (
              <EmptyState title={t('pay.noPayouts')} />
            ) : (
              <ul className="divide-y divide-[var(--pi-line)]">
                {data.payouts
                  .filter((p) => p.status !== 'processing')
                  .map((p) => (
                    <li key={p.id} className="flex items-center gap-4 py-3 text-sm">
                      <span className="min-w-0 flex-1 truncate text-[var(--pi-ink)]">
                        {METHOD_NAME[p.method_type] || p.method_type} · <code className="text-xs">{p.recipient}</code>
                        <span className="text-xs text-[var(--pi-muted)]"> · {p.transaction_reference || p.failure_reason || ''}</span>
                      </span>
                      <span className="tabular-nums text-[var(--pi-ink-strong)]">{money(p.amount)}</span>
                      <Chip tone={p.status === 'completed' ? 'green' : 'red'}>{t(`pay.st.${p.status}`)}</Chip>
                    </li>
                  ))}
              </ul>
            )}
          </Section>
        </div>
      )}

      {!loading && tab === 'campaigns' && (
        <ul className="divide-y divide-[var(--pi-line)]">
          {data.campaigns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 py-3.5">
              <Link href={`/dashboard/campaigns/${c.id}`} className="min-w-0 flex-1 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
                {c.title} <span className="text-[var(--pi-muted)]">· {c.brand_name}</span>
              </Link>
              <span className="text-xs tabular-nums text-[var(--pi-muted)]">
                {compact(c.views_delivered)} {t('common.views')} · {money(c.remaining_budget, 0)} / {money(c.escrow_budget, 0)}
              </span>
              <Chip tone={CAMPAIGN_TONE[c.status]}>{t(`dash.campaignStatus.${c.status}`)}</Chip>
            </li>
          ))}
        </ul>
      )}

      {tab === 'analytics' && <PlatformStats />}
      {tab === 'tracking' && <TrackingPanel t={t} lang={lang} toast={toast} />}

      <Notice>{t('adm.rolesNote')}</Notice>

      <PayoutDialog
        action={acting}
        onClose={() => setActing(null)}
        t={t}
        onConfirm={async (ref) => {
          try {
            await processPayout(acting!.p.id, acting!.kind, ref);
            toast(acting!.kind === 'completed' ? t('adm.sent') : t('adm.failed'));
            setActing(null);
            refresh();
          } catch (e) {
            toast(errText(e), 'red');
          }
        }}
      />
    </div>
  );
}

function PayoutDialog({
  action,
  onClose,
  t,
  onConfirm,
}: {
  action: { p: PayoutRow; kind: 'completed' | 'failed' } | null;
  onClose: () => void;
  t: T;
  onConfirm: (ref: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  if (!action) return null;
  const sent = action.kind === 'completed';
  return (
    <Modal open onClose={onClose} title={sent ? t('adm.markSent') : t('adm.markFailed')}>
      <div className="space-y-5">
        <p className="text-sm text-[var(--pi-ink)]">
          {money(action.p.amount)} → <code className="text-xs">{action.p.recipient}</code>
        </p>
        <Field label={sent ? t('adm.txRef') : t('adm.failReason')} hint={sent ? t('adm.txHint') : t('adm.failHint')}>
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} maxLength={200} className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Btn>
          <Btn
            variant={sent ? 'solid' : 'danger'}
            disabled={value.trim().length < 3}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(value.trim());
              setBusy(false);
              setValue('');
            }}
          >
            {t('common.confirm')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

const TRIGGER_TONE: Record<string, 'green' | 'blue' | 'muted'> = { scheduler: 'green', vercel: 'blue', admin: 'muted' };

function TrackingPanel({ t, lang, toast }: { t: T; lang: string; toast: (msg: string, tone?: 'green' | 'red') => void }) {
  const { data, loading, error, refresh } = useTracking(true);
  const [busy, setBusy] = useState(false);
  const last = data.runs.find((r) => r.trigger !== 'admin') || null;
  const hoursSince = last ? (Date.now() - Date.parse(last.started_at)) / 3_600_000 : Infinity;
  const healthy = hoursSince < 4;

  const runNow = async () => {
    setBusy(true);
    try {
      const s = await runTrackingNow();
      toast(t('trk.ranNow').replace('{checked}', String(s.checked)).replace('{recorded}', String(s.recorded)).replace('{settled}', String(s.settled)));
      refresh();
    } catch (e) {
      toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <SkeletonRows rows={4} />;
  if (error) return <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />;

  const source = (on: boolean | undefined, label: string, offHint: string) => (
    <li className="flex items-start gap-2.5 py-2.5">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${on ? 'bg-emerald-500' : 'bg-[var(--pi-line-strong)]'}`} />
      <span className="min-w-0 flex-1 text-sm text-[var(--pi-ink-strong)]">
        {label}
        {!on && <span className="block text-xs font-light text-[var(--pi-muted)]">{offHint}</span>}
      </span>
      <span className="text-xs text-[var(--pi-muted)]">{on ? t('trk.on') : t('trk.off')}</span>
    </li>
  );

  return (
    <div className="space-y-10">
      {data.missingTable && <Notice tone="amber">{t('trk.needMigration')}</Notice>}

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          {last ? (
            <Notice tone={healthy ? 'green' : 'amber'}>
              {(healthy ? t('trk.healthy') : t('trk.stale')).replace('{t}', timeAgo(last.started_at, lang))}
            </Notice>
          ) : (
            <Notice tone="amber">{t('trk.never')}</Notice>
          )}
        </div>
        <Btn onClick={runNow} loading={busy}>
          {t('trk.runNow')}
        </Btn>
      </div>

      <Section title={t('trk.sources')}>
        <ul className="divide-y divide-[var(--pi-line)]">
          {source(true, t('trk.srcPublic'), '')}
          {source(data.config?.youtubeKey, t('trk.srcYoutube'), t('trk.srcYoutubeOff'))}
          {source(data.config?.provider, t('trk.srcProvider'), t('trk.srcProviderOff'))}
          {source(data.config?.cronSecret, t('trk.srcCron'), t('trk.srcCronOff'))}
        </ul>
      </Section>

      <Section title={t('trk.history')}>
        {data.runs.length === 0 ? (
          <EmptyState title={t('trk.noRuns')} desc={t('trk.noRunsDesc')} />
        ) : (
          <ul className="divide-y divide-[var(--pi-line)]">
            {data.runs.map((r: TrackingRun) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="w-28 shrink-0 text-xs text-[var(--pi-muted)]">{timeAgo(r.started_at, lang)}</span>
                <Chip tone={TRIGGER_TONE[r.trigger] || 'muted'}>{t(`trk.by_${r.trigger}`)}</Chip>
                <span className="min-w-0 flex-1 text-xs tabular-nums text-[var(--pi-ink)]">
                  {t('trk.line')
                    .replace('{checked}', String(r.checked))
                    .replace('{recorded}', String(r.recorded))
                    .replace('{unavailable}', String(r.unavailable))
                    .replace('{flagged}', String(r.flagged))
                    .replace('{settled}', String(r.settled))}
                  {r.errors.length > 0 && <span className="text-rose-600"> · {t('trk.errors').replace('{n}', String(r.errors.length))}</span>}
                </span>
                <span className="tabular-nums text-[var(--pi-ink-strong)]">{money(r.paid)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
