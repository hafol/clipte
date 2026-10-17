'use client';
import { EmptyClips, NotFound, Success } from '@/components/illustrations';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ExternalLink, FolderOpen, Link2, Minus, Pause, Pencil, Play, ShieldAlert, Users } from '@/components/icons';
import { NotchButton } from '@/components/pi';
import { ReviewedMark } from '@/components/dashboard/discover';
import { useMessenger } from '@/lib/supabase/messenger';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import {
  useCampaignDetail, submitClip, previewClip, updateCampaign, approveCampaign, errText, PLATFORM_NAME, topCpm, rateFor,
  type CampaignRow, type ClipRow, type ClipPreview, type Platform, type SocialAccountRow,
} from '@/lib/supabase/data';
import {
  StatStrip, Section, Chip, EmptyState, ErrorNote, PlatformIcon, SkeletonRows, Label, money, compact, CLIP_TONE, CAMPAIGN_TONE,
} from '@/components/dashboard/ui';
import { Btn, CopyButton, Field, Modal, Notice, Tabs, boxInputCls, inputCls, timeAgo, useToast } from '@/components/dashboard/forms';
import { CampaignCover, FundPanel, PlatformList, RateTable } from '@/components/dashboard/campaign';
import CampaignStats from '@/components/dashboard/CampaignStats';

type T = (k: string) => string;
type Tab = 'stats' | 'brief' | 'leaders' | 'mine' | 'subs' | 'deposits';

const detectPlatform = (url: string): Platform | null => {
  const u = url.toLowerCase();
  if (/tiktok\.com/.test(u)) return 'tiktok';
  if (/youtube\.com|youtu\.be/.test(u)) return 'youtube';
  if (/instagram\.com/.test(u)) return 'instagram';
  return null;
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { profile } = useUserProfile();
  const { data, loading, error, refresh } = useCampaignDetail(id, profile?.id);
  const { toast, toastNode } = useToast();

  const [tab, setTab] = useState<Tab>('brief');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(search?.get('fund') === '1');
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const messenger = useMessenger();
  const copyLink = () =>
    navigator.clipboard?.writeText(window.location.href.split('?')[0]).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1600);
    });

  const c = data.campaign;
  const isOwner = !!c && c.brand_id === profile?.id;
  const isStaff = profile?.role === 'moderator' || profile?.role === 'admin';
  // owners land on their stats once the campaign is funded
  const tabPicked = useRef(false);
  useEffect(() => {
    if (tabPicked.current || !c) return;
    tabPicked.current = true;
    if (isOwner && c.status !== 'pending_payment') setTab('stats');
  }, [c, isOwner]);
  const clipperTotals = useMemo(
    () => ({ clippers: data.leaderboard.length, clips: data.leaderboard.reduce((a, r) => a + r.clips, 0) }),
    [data.leaderboard]
  );

  if (!profile) return null;
  if (loading && !c) return <SkeletonRows rows={5} />;
  if (error) return <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />;
  if (!c) {
    return (
      <EmptyState
        art={<NotFound />}
        title={t('camp.notFound')}
        desc={t('camp.notFoundDesc')}
        action={
          <Btn href="/dashboard/campaigns" variant="outline" size="sm">
            {t('camp.back')}
          </Btn>
        }
      />
    );
  }

  const spent = Math.max(0, c.escrow_budget - c.remaining_budget);
  const canSubmit = c.status === 'active' && c.remaining_budget > 0 && !isOwner;
  const canFund = isOwner && ['pending_payment', 'pending_review', 'active', 'paused'].includes(c.status);
  const canReview = isStaff && !isOwner && c.status === 'pending_review';

  const approve = async () => {
    setBusy(true);
    try {
      await approveCampaign(c.id);
      toast(t('mod.approved'));
      refresh();
    } catch (e) {
      toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async () => {
    setBusy(true);
    try {
      await updateCampaign(c.id, { status: c.status === 'active' ? 'paused' : 'active' });
      toast(c.status === 'active' ? t('camp.paused') : t('camp.resumed'));
      refresh();
    } catch (e) {
      toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  const canSeeStats = (isOwner || isStaff) && c.status !== 'pending_payment';
  const tabs: { id: Tab; label: string; count?: number }[] = [
    ...(canSeeStats ? [{ id: 'stats' as Tab, label: t('camp.tabStats') }] : []),
    { id: 'brief', label: t('camp.tabBrief') },
    { id: 'leaders', label: t('camp.tabLeaders'), count: data.leaderboard.length },
    ...(!isOwner ? [{ id: 'mine' as Tab, label: t('camp.tabMine'), count: data.myClips.length }] : []),
    ...(isOwner
      ? [
          { id: 'subs' as Tab, label: t('camp.tabSubs'), count: data.clips.length },
          { id: 'deposits' as Tab, label: t('camp.tabDeposits'), count: data.deposits.length },
        ]
      : []),
  ];

  return (
    <div className="space-y-10">
      {toastNode}
      {/* ---------- hero (same banner language as Discover) ---------- */}
      <header className="pi-notch relative isolate overflow-hidden bg-[#111]">
        <div className="relative flex min-h-[360px] w-full flex-col justify-end sm:block! sm:aspect-[16/6]! sm:min-h-0!">
          {c.cover_url ? (
            <img src={c.cover_url} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_80%_0%,#3a3a3a_0%,#111_60%)]">
              <span aria-hidden className="absolute -bottom-[0.15em] right-[4%] select-none text-[min(26rem,44vw)] font-light leading-none tracking-[-0.08em] text-white/[0.06]">
                {(c.brand_name || 'C').slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          <div className="cr-hero-fade absolute inset-0" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-5 text-[13px] text-white/80 sm:px-8! sm:pt-7! lg:px-10!">
            <Link href="/dashboard/campaigns" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <ArrowLeft className="size-4" /> {t('camp.back')}
            </Link>
            {c.status !== 'active' && (
              <span className="cr-chip flex h-7 items-center rounded-full px-3 text-[12px] font-semibold text-[var(--pi-ink-strong)]">
                {t(`dash.campaignStatus.${c.status}`)}
              </span>
            )}
          </div>

          <div className="relative flex flex-col gap-6 p-5 pt-20 text-white sm:absolute! sm:inset-x-0! sm:bottom-0! sm:p-8! lg:p-10!">
            <div className="flex max-w-3xl flex-col gap-3">
              <div className="flex items-center gap-2 text-[14px] text-white/90">
                <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-white text-[9px] font-bold text-black">
                  {c.icon_url ? <img src={c.icon_url} alt="" className="size-full object-cover" /> : (c.brand_name || 'B').slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate">{c.brand_name}</span>
                {c.status === 'active' && <ReviewedMark />}
                {c.category && <span className="text-white/55">· {c.category}</span>}
              </div>
              <h1 className="line-clamp-3 text-[clamp(2rem,4.6vw,4rem)] font-light leading-[0.95] tracking-[-0.05em]">{c.title}</h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {c.platforms.map((p) => (
                  <span key={p} className="flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[12px] backdrop-blur-md">
                    <PlatformIcon platform={p} className="size-3.5" /> {PLATFORM_NAME[p]}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canSubmit && (
                <NotchButton size="lg" variant="light" motion="spring" onClick={() => setSubmitOpen(true)}>
                  {t('camp.submit')}
                </NotchButton>
              )}
              {canFund && (
                <NotchButton size="lg" variant="light" motion="spring" onClick={() => setFundOpen(true)}>
                  {c.status === 'pending_payment' ? t('camp.fundNow') : t('camp.addFunds')}
                </NotchButton>
              )}
              {(c.status === 'active' || c.status === 'paused' || c.status === 'completed' || isOwner) && (
                <HeroGhost onClick={() => messenger.openCampaignRoom(c.id)}>
                  <Users className="size-4" strokeWidth={1.6} /> {t('camp.chat')}
                </HeroGhost>
              )}
              {isOwner && (c.status === 'active' || c.status === 'paused') && (
                <HeroGhost onClick={togglePause} disabled={busy}>
                  {c.status === 'active' ? <Pause className="size-4" strokeWidth={1.6} /> : <Play className="size-4" strokeWidth={1.6} />}
                  {c.status === 'active' ? t('camp.pause') : t('camp.resume')}
                </HeroGhost>
              )}
              {isOwner && (
                <HeroGhost onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" strokeWidth={1.6} /> {t('camp.editBrief')}
                </HeroGhost>
              )}
              {canReview && (
                <NotchButton size="lg" variant="light" motion="spring" onClick={approve}>
                  {t('mod.approve')}
                </NotchButton>
              )}
              {canReview && (
                <HeroGhost onClick={() => router.push('/dashboard/moderation')}>
                  <ShieldAlert className="size-4" strokeWidth={1.6} /> {t('camp.reviewInMod')}
                </HeroGhost>
              )}
              <HeroGhost onClick={copyLink}>
                {linkCopied ? <Check className="size-4" /> : <Link2 className="size-4" strokeWidth={1.6} />} {linkCopied ? t('common.copied') : t('camp.copyLink')}
              </HeroGhost>
            </div>
          </div>
        </div>
      </header>

      {isOwner && c.status === 'pending_payment' && <Notice tone="amber">{t('camp.needsFunding')}</Notice>}
      {isOwner && c.status === 'pending_review' && <Notice tone="blue">{t('camp.inReview')}</Notice>}
      {c.status === 'rejected' && c.rejection_reason && (
        <Notice tone="red">
          {t('camp.rejected')}: {c.rejection_reason}
        </Notice>
      )}
      {canReview && <Notice tone="blue">{t('camp.staffReview').replace('{n}', money(c.escrow_budget))}</Notice>}
      {!isOwner && !canReview && c.status !== 'active' && <Notice>{c.status === 'pending_review' ? t('camp.notYetLive') : t('camp.notOpen')}</Notice>}

      {/* ---------- budget band (card language from Discover) ---------- */}
      <section className="cr-card overflow-hidden rounded-2xl bg-[var(--pi-surface)]">
        <div className="grid gap-6 p-5 sm:p-6! lg:grid-cols-[1.3fr_1fr]! lg:items-center!">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-[var(--pi-muted)]">{t('camp.budgetLeft')}</span>
              <span className="text-xs tabular-nums text-[var(--pi-muted)]">{t('camp.paidOut')}: {money(spent, 0)}</span>
            </div>
            <p className="text-[clamp(2rem,4vw,3rem)] font-light leading-none tracking-[-0.05em] tabular-nums text-[var(--pi-ink-strong)]">
              {money(c.remaining_budget, 0)}
              <span className="text-[0.45em] tracking-normal text-[var(--pi-muted)]"> / {money(c.escrow_budget, 0)}</span>
            </p>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full">
              <div className="cr-track absolute inset-0" />
              <div className="cr-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: `${c.escrow_budget > 0 ? Math.min(100, (spent / c.escrow_budget) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end!">
            <span className="cr-pill-glass relative flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-semibold text-[var(--pi-ink-strong)]">
              {data.leaderboard.length > 0 && (
                <span className="flex -space-x-1.5">
                  {data.leaderboard.slice(0, 3).map((r) =>
                    r.avatar_url ? (
                      <img key={r.user_id} src={r.avatar_url} alt="" className="size-5 rounded-full object-cover ring-2 ring-[var(--pi-surface)]" />
                    ) : (
                      <span key={r.user_id} className="flex size-5 items-center justify-center rounded-full bg-[var(--pi-btn)] text-[9px] font-bold text-[var(--pi-btn-fg)] ring-2 ring-[var(--pi-surface)]">
                        {r.name.slice(0, 1).toUpperCase()}
                      </span>
                    )
                  )}
                </span>
              )}
              {clipperTotals.clippers} {t('common.clippers').toLowerCase()}
            </span>
            <span className="cr-pill-glass relative flex h-9 items-center rounded-full px-3 text-[13px] font-semibold text-[var(--pi-ink-strong)]">
              {clipperTotals.clips} {t('common.clips')}
            </span>
            <span className="cr-pill-glass relative flex h-9 items-center rounded-full px-3 text-[13px] font-semibold tabular-nums text-[var(--pi-ink-strong)]">
              {compact(c.views_delivered)} {t('common.views')}
            </span>
            <span className="cr-pill-blue relative flex h-9 items-center rounded-full px-3 text-[13px] font-semibold">
              <span className="text-blue-500 dark:text-[#89B6FF]!">{money(topCpm(c))}</span>
              <span className="text-blue-500/70 dark:text-[rgba(137,182,255,0.7)]!">/1K</span>
            </span>
          </div>
        </div>
      </section>

      <Tabs value={tab} onChange={setTab} items={tabs} />

      {tab === 'stats' && canSeeStats && <CampaignStats c={c} clips={data.clips} />}
      {tab === 'brief' && <Brief c={c} t={t} />}
      {tab === 'leaders' && <Leaders rows={data.leaderboard} me={profile.id} t={t} />}
      {tab === 'mine' && <ClipList clips={data.myClips} t={t} lang={lang} empty={t('camp.noMine')} />}
      {tab === 'subs' && <ClipList clips={data.clips} t={t} lang={lang} empty={t('overview.b.noClips')} showHandle />}
      {tab === 'deposits' && (
        <Section title={t('camp.tabDeposits')}>
          {data.deposits.length === 0 ? (
            <EmptyState title={t('camp.noDeposits')} />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {data.deposits.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-[var(--pi-muted)]">
                    #{d.invoice_id} · {timeAgo(d.created_at, lang)}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums text-[var(--pi-ink-strong)]">{money(d.amount)}</span>
                    <Chip tone={d.status === 'paid' ? 'green' : d.status === 'pending' ? 'amber' : 'muted'}>{t(`pay.dep.${d.status}`)}</Chip>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <SubmitModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        c={c}
        accounts={data.accounts}
        t={t}
        onDone={() => {
          refresh();
          setTab('mine');
        }}
      />
      <Modal open={fundOpen && canFund} onClose={() => setFundOpen(false)} title={t('fund.title')}>
        <FundPanel
          campaignId={c.id}
          defaultAmount={c.escrow_budget > 0 ? 250 : 500}
          onPaid={() => {
            toast(t('fund.paid'));
            refresh();
          }}
        />
      </Modal>
      {isOwner && (
        <EditBrief
          open={editOpen}
          onClose={() => setEditOpen(false)}
          c={c}
          t={t}
          onSaved={() => {
            toast(t('common.saved'));
            refresh();
          }}
        />
      )}
    </div>
  );
}

/* ============================== tabs ============================== */

function Brief({ c, t }: { c: CampaignRow; t: T }) {
  const tags = c.hashtags.join(' ');
  const hasStructured = !!(c.description || c.dos.length || c.donts.length);
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12!">
      <div className="space-y-10 lg:col-span-7!">
        <Section title={t('camp.about')}>
          <p className="whitespace-pre-line text-[15px] font-light leading-relaxed text-[var(--pi-ink)]">
            {(hasStructured ? c.description : c.guidelines) || t('camp.noBrief')}
          </p>
        </Section>

        {(c.dos.length > 0 || c.donts.length > 0) && (
          <div className="grid gap-8 sm:grid-cols-2!">
            <RuleList title={t('camp.dos')} items={c.dos} icon={<Check className="size-3.5 text-emerald-600" />} />
            <RuleList title={t('camp.donts')} items={c.donts} icon={<Minus className="size-3.5 text-rose-600" />} />
          </div>
        )}

        <Section title={t('camp.rates')}>
          <RateTable c={c} />
          <p className="mt-3 text-xs text-[var(--pi-muted)]">{t('camp.ratesNote')}</p>
        </Section>
      </div>

      <aside className="space-y-6 lg:col-span-5!">
        <div className="cr-card space-y-5 rounded-2xl bg-[var(--pi-surface)] p-5">
          <Label>{t('camp.toPost')}</Label>
          {c.brand_handle && (
            <CopyRow label={t('camp.tagAccount')} value={c.brand_handle.startsWith('@') ? c.brand_handle : `@${c.brand_handle}`} t={t} />
          )}
          {tags && <CopyRow label={t('camp.hashtags')} value={tags} t={t} />}
          <div>
            <span className="text-[13px] text-[var(--pi-muted)]">{t('camp.platforms')}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.platforms.map((p) => (
                <span key={p} className="cr-chip inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--pi-ink-strong)]">
                  <PlatformIcon platform={p} className="size-3.5" /> {PLATFORM_NAME[p]}
                </span>
              ))}
            </div>
          </div>
          <a
            href={c.drive_url}
            target="_blank"
            rel="noreferrer"
            className="cr-join group flex items-center justify-between gap-3 rounded-full px-5 py-3.5 text-sm font-semibold transition-[filter] hover:brightness-110"
          >
            <span className="flex items-center gap-2.5">
              <FolderOpen className="size-4" /> {t('camp.footage')}
            </span>
            <ExternalLink className="size-4 opacity-70" />
          </a>
        </div>

        <div className="space-y-3 text-sm font-light leading-relaxed text-[var(--pi-ink)]">
          <Label>{t('camp.howPaid')}</Label>
          <ol className="space-y-2.5">
            {[t('camp.how1'), t('camp.how2'), t('camp.how3')].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="tabular-nums text-[var(--pi-muted)]">{String(i + 1).padStart(2, '0')}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function RuleList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-3 border-b border-[var(--pi-line)] pb-3 text-[15px] tracking-tight text-[var(--pi-ink-strong)]">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-sm font-light leading-snug text-[var(--pi-ink)]">
            <span className="mt-0.5 shrink-0">{icon}</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyRow({ label, value, t }: { label: string; value: string; t: T }) {
  return (
    <div>
      <span className="text-[13px] text-[var(--pi-muted)]">{label}</span>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <code className="min-w-0 truncate text-sm text-[var(--pi-ink-strong)]">{value}</code>
        <CopyButton value={value} label={t('common.copy')} copiedLabel={t('common.copied')} />
      </div>
    </div>
  );
}

function Leaders({ rows, me, t }: { rows: { user_id: string; name: string; avatar_url: string | null; clips: number; views: number; earnings: number }[]; me: string; t: T }) {
  if (!rows.length) return <EmptyState art={<EmptyClips />} title={t('camp.noLeaders')} desc={t('camp.noLeadersDesc')} />;
  return (
    <ol className="divide-y divide-[var(--pi-line)]">
      {rows.map((r, i) => (
        <li key={r.user_id} className={`flex items-center gap-4 py-3.5 ${r.user_id === me ? 'bg-[var(--pi-line)]/60 -mx-3 px-3' : ''}`}>
          <span className="w-8 text-[1.25rem] font-light tabular-nums tracking-[-0.04em] text-[var(--pi-muted)]">{String(i + 1).padStart(2, '0')}</span>
          {r.avatar_url ? (
            <img src={r.avatar_url} alt="" className="pi-notch size-8 object-cover" />
          ) : (
            <span className="pi-notch flex size-8 items-center justify-center bg-[var(--pi-line)] text-xs text-[var(--pi-ink-strong)]">
              {r.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <Link href={`/dashboard/creators/${r.user_id}`} className="min-w-0 flex-1 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
            {r.name}
            {r.user_id === me && <span className="ml-2 text-xs text-[var(--pi-muted)]">({t('camp.you')})</span>}
          </Link>
          <span className="hidden text-xs tabular-nums text-[var(--pi-muted)] sm:inline!">
            {r.clips} {t('common.clips')}
          </span>
          <span className="w-20 text-right text-sm tabular-nums text-[var(--pi-ink-strong)]">{compact(r.views)}</span>
          <span className="w-20 text-right text-sm tabular-nums text-[var(--pi-ink)]">{money(r.earnings)}</span>
        </li>
      ))}
    </ol>
  );
}

function ClipList({ clips, t, lang, empty, showHandle }: { clips: ClipRow[]; t: T; lang: string; empty: string; showHandle?: boolean }) {
  if (!clips.length) return <EmptyState title={empty} />;
  return (
    <ul className="divide-y divide-[var(--pi-line)]">
      {clips.map((k) => (
        <li key={k.id} className="flex items-center gap-4 py-3.5">
          <span className="pi-notch flex size-9 shrink-0 items-center justify-center bg-[var(--pi-line)] text-[var(--pi-ink-strong)]">
            <PlatformIcon platform={k.platform} />
          </span>
          <div className="min-w-0 flex-1">
            <a href={k.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
              {showHandle && k.account?.handle ? `@${k.account.handle}` : k.video_url.replace(/^https?:\/\/(www\.)?/, '')}
              <ExternalLink className="size-3 shrink-0 opacity-50" />
            </a>
            <span className="block truncate text-xs text-[var(--pi-muted)]">
              {timeAgo(k.created_at, lang)}
              {k.status_reason ? ` · ${k.status_reason}` : ''}
            </span>
          </div>
          <span className="hidden w-20 text-right text-sm tabular-nums text-[var(--pi-ink-strong)] sm:block!">{compact(k.view_count)}</span>
          <span className="w-20 text-right text-sm tabular-nums text-[var(--pi-ink)]">{money(k.earnings)}</span>
          <Chip tone={CLIP_TONE[k.status]}>{t(`dash.clipStatus.${k.status}`)}</Chip>
        </li>
      ))}
    </ul>
  );
}

/* ============================== dialogs ============================== */

function SubmitModal({
  open,
  onClose,
  c,
  accounts,
  t,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  c: CampaignRow;
  accounts: SocialAccountRow[];
  t: T;
  onDone: () => void;
}) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pendingOwner, setPendingOwner] = useState(false);
  const [preview, setPreview] = useState<ClipPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const platform = detectPlatform(url);
  const allowed = platform ? c.platforms.includes(platform) : false;
  const verified = platform ? accounts.some((a) => a.platform === platform && a.verified_at) : false;
  const blocked = !!preview && (preview.ownership === 'mismatch' || !!preview.duplicate);
  const ready = !!platform && allowed && verified && !blocked;

  // look the video up half a second after the link stops changing
  useEffect(() => {
    setPreview(null);
    if (!platform || !allowed || !verified) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setPreviewing(true);
      previewClip(url.trim(), c.id, ctrl.signal)
        .then((p) => !ctrl.signal.aborted && setPreview(p.ok ? p : null))
        .catch(() => {})
        .finally(() => !ctrl.signal.aborted && setPreviewing(false));
    }, 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
      setPreviewing(false);
    };
  }, [url, platform, allowed, verified, c.id]);

  const close = () => {
    onClose();
    setTimeout(() => {
      setUrl('');
      setError(null);
      setDone(false);
      setPendingOwner(false);
      setPreview(null);
    }, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitClip(c.id, url.trim());
      setPendingOwner(res.ownership === 'unconfirmed');
      setDone(true);
      onDone();
    } catch (err) {
      const e = err as { code?: string; owner?: string };
      setError(e.code === 'not_owner' ? t('camp.notOwner').replace('{owner}', e.owner || '') : errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={t('camp.submit')}>
      {done ? (
        <div className="space-y-5">
          <div className="mx-auto w-44"><Success /></div>
          <Notice tone="green">{t('camp.submitted')}</Notice>
          {pendingOwner && <Notice>{t('camp.ownerPending')}</Notice>}
          <Btn onClick={close} className="w-full">
            {t('common.close')}
          </Btn>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm font-light text-[var(--pi-ink)]">{t('camp.submitDesc')} {t('camp.ownOnly')}</p>
          <Field label={t('camp.videoLink')}>
            <div className="flex items-center gap-2">
              <Link2 className="size-4 shrink-0 text-[var(--pi-muted)]" />
              <input
                type="url"
                required
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@you/video/…"
                className={inputCls}
              />
            </div>
          </Field>

          {url.trim() && !platform && <Notice tone="amber">{t('camp.badLink')}</Notice>}
          {platform && !allowed && <Notice tone="amber">{t('camp.wrongPlatform').replace('{p}', PLATFORM_NAME[platform])}</Notice>}
          {platform && allowed && !verified && (
            <Notice tone="amber">
              {t('camp.needAccount').replace('{p}', PLATFORM_NAME[platform])}{' '}
              <Link href="/dashboard/accounts" className="underline underline-offset-4">
                {t('camp.goAccounts')}
              </Link>
            </Notice>
          )}
          {platform && allowed && verified && (previewing || preview) && <PreviewCard p={preview} loading={previewing && !preview} c={c} platform={platform} t={t} />}
          {platform && allowed && verified && !previewing && !preview && (
            <p className="flex items-center gap-2 text-sm text-[var(--pi-ink-strong)]">
              <PlatformIcon platform={platform} /> {t('camp.detected').replace('{p}', PLATFORM_NAME[platform])}
            </p>
          )}
          {error && <Notice tone="red">{error}</Notice>}

          <div className="flex items-center justify-between gap-3 text-xs text-[var(--pi-muted)]">
            <span>{t('camp.holdNote')}</span>
            <PlatformList platforms={c.platforms} className="size-3.5" />
          </div>
          <Btn type="submit" size="lg" className="w-full" disabled={!ready || previewing} loading={busy}>
            {previewing ? t('camp.pvChecking') : t('camp.submitCta')}
          </Btn>
        </form>
      )}
    </Modal>
  );
}

/** What the clipper is about to submit: thumbnail, title, who posted it, and what it could earn. */
function PreviewCard({ p, loading, c, platform, t }: { p: ClipPreview | null; loading: boolean; c: CampaignRow; platform: Platform; t: T }) {
  const rate = rateFor(c, platform);
  const est = (views: number) => {
    let v = (views / 1000) * rate.cpm;
    if (rate.maxCap) v = Math.min(v, rate.maxCap);
    return money(v, 0);
  };
  if (loading || !p) {
    return (
      <div className="cr-preview flex gap-3 overflow-hidden rounded-xl bg-[var(--pi-bg)] p-2.5">
        <span className="aspect-video w-36 shrink-0 animate-pulse rounded-lg bg-[var(--pi-line)]" />
        <span className="flex-1 space-y-2 py-1">
          <span className="block h-3 w-4/5 animate-pulse rounded bg-[var(--pi-line)]" />
          <span className="block h-3 w-1/2 animate-pulse rounded bg-[var(--pi-line)]" />
          <span className="block h-3 w-2/3 animate-pulse rounded bg-[var(--pi-line)]" />
        </span>
      </div>
    );
  }
  const owner =
    p.duplicate ? { tone: 'text-rose-600 dark:text-rose-400!', icon: '✕', text: t('camp.pvDuplicate') }
    : p.ownership === 'matched' ? { tone: 'text-emerald-700 dark:text-emerald-400!', icon: '✓', text: t('camp.pvMine').replace('{owner}', p.author || '') }
    : p.ownership === 'mismatch' ? { tone: 'text-rose-600 dark:text-rose-400!', icon: '✕', text: t('camp.pvNotMine').replace('{owner}', p.author || '').replace('{mine}', (p.accounts || []).join(', ')) }
    : { tone: 'text-amber-700 dark:text-amber-300!', icon: '?', text: t('camp.pvUnknown') };
  return (
    <div className="cr-preview overflow-hidden rounded-xl bg-[var(--pi-bg)]">
      <div className="flex gap-3 p-2.5">
        <span className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-[var(--pi-line)]">
          {p.thumbnail && <img src={p.thumbnail} alt="" referrerPolicy="no-referrer" className="size-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <span className="absolute bottom-1 left-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
            <PlatformIcon platform={platform} className="size-3" />
          </span>
        </span>
        <div className="min-w-0 flex-1 py-0.5">
          <p className="line-clamp-2 text-[13px] leading-snug text-[var(--pi-ink-strong)]">{p.title || PLATFORM_NAME[platform]}</p>
          <p className={`mt-1.5 flex items-start gap-1 text-[12px] font-medium ${owner.tone}`}>
            <span aria-hidden>{owner.icon}</span>
            <span className="min-w-0">{owner.text}</span>
          </p>
        </div>
      </div>
      {!p.duplicate && p.ownership !== 'mismatch' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--pi-line)] px-3 py-2 text-[12px] text-[var(--pi-muted)]">
          <span>{t('camp.pvEstimate')}</span>
          {[10_000, 100_000, 1_000_000].map((v) => (
            <span key={v} className="tabular-nums">
              <span className="text-[var(--pi-ink)]">{compact(v)}</span> → <span className="text-[var(--pi-ink-strong)]">{est(v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const lines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

function EditBrief({ open, onClose, c, t, onSaved }: { open: boolean; onClose: () => void; c: CampaignRow; t: T; onSaved: () => void }) {
  const [description, setDescription] = useState(c.description || c.guidelines || '');
  const [dos, setDos] = useState(c.dos.join('\n'));
  const [donts, setDonts] = useState(c.donts.join('\n'));
  const [handle, setHandle] = useState(c.brand_handle || '');
  const [tags, setTags] = useState(c.hashtags.join(' '));
  const [drive, setDrive] = useState(c.drive_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateCampaign(c.id, {
        description: description.trim() || null,
        dos: lines(dos),
        donts: lines(donts),
        brand_handle: handle.trim().replace(/^@/, '') || null,
        hashtags: tags
          .split(/\s+/)
          .filter(Boolean)
          .map((x) => (x.startsWith('#') ? x : `#${x}`)),
        drive_url: drive.trim(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('camp.editBrief')} wide>
      <form onSubmit={save} className="space-y-5">
        <Field label={t('create.description')}>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={boxInputCls} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2!">
          <Field label={t('camp.dos')} hint={t('create.onePerLine')}>
            <textarea rows={5} value={dos} onChange={(e) => setDos(e.target.value)} className={boxInputCls} />
          </Field>
          <Field label={t('camp.donts')} hint={t('create.onePerLine')}>
            <textarea rows={5} value={donts} onChange={(e) => setDonts(e.target.value)} className={boxInputCls} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2!">
          <Field label={t('camp.tagAccount')}>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourbrand" className={inputCls} />
          </Field>
          <Field label={t('camp.hashtags')}>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#brand #clips" className={inputCls} />
          </Field>
        </div>
        <Field label={t('create.drive')}>
          <input type="url" required value={drive} onChange={(e) => setDrive(e.target.value)} className={inputCls} />
        </Field>
        {(c.status === 'active' || c.status === 'paused') && <p className="text-xs text-[var(--pi-muted)]">{t('camp.ratesLocked')}</p>}
        {error && <Notice tone="red">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Btn>
          <Btn type="submit" loading={busy}>
            {t('common.save')}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/** Translucent action on the dark hero (secondary to the spring button). */
function HeroGhost({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pi-notch flex h-12 items-center gap-2 bg-white/12 px-4 text-[14px] text-white backdrop-blur-md transition-colors hover:bg-white/22 disabled:opacity-50 cursor-pointer"
    >
      {children}
    </button>
  );
}
