'use client';
import { Success } from '@/components/illustrations';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import {
  type CampaignRow, type Platform, PLATFORM_NAME, rateFor, topCpm, createInvoice, checkInvoice, errText,
} from '@/lib/supabase/data';
import { PlatformIcon, Chip, Meter, money, usd, kzt, compact, CAMPAIGN_TONE } from './ui';
import { moneyState } from '@/lib/money';
import { Btn, Field, Notice, boxInputCls } from './forms';

/** 16:9 cover; falls back to a typographic tile in the landing style. */
export function CampaignCover({ c, className = '' }: { c: Pick<CampaignRow, 'cover_url' | 'brand_name' | 'title'>; className?: string }) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-[var(--pi-line)] [container-type:inline-size] ${className}`}>
      {c.cover_url ? (
        <img src={c.cover_url} alt="" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
      ) : (
        <div className="relative flex size-full items-end justify-between p-4">
          <span className="text-xs text-[var(--pi-muted)]">({c.brand_name || 'Clipte'})</span>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[-0.14em] right-[5%] select-none text-[44cqw] font-light leading-none tracking-[-0.08em] text-[var(--pi-ink-strong)] opacity-[0.08]"
          >
            {(c.brand_name || c.title || 'C').trim().slice(0, 1).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export function PlatformList({ platforms, className = 'size-3.5' }: { platforms: Platform[]; className?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--pi-ink-strong)]">
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} className={className} />
      ))}
    </span>
  );
}

/** Brand list row. */
export function CampaignRowLine({ c, clips }: { c: CampaignRow; clips?: number }) {
  const { t } = useLanguage();
  const spent = Math.max(0, c.escrow_budget - c.remaining_budget);
  return (
    <Link href={`/dashboard/campaigns/${c.id}`} className="group flex flex-col gap-4 py-5 sm:flex-row! sm:items-center!">
      <div className="w-full shrink-0 sm:w-40!">
        <CampaignCover c={c} className="pi-notch" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-[15px] tracking-tight text-[var(--pi-ink-strong)] group-hover:underline">{c.title}</span>
            <span className="mt-1 flex items-center gap-2 text-xs text-[var(--pi-muted)]">
              <PlatformList platforms={c.platforms} className="size-3" />
              <span>·</span>
              {money(topCpm(c))} / 1K
            </span>
          </div>
          <Chip tone={CAMPAIGN_TONE[c.status]}>{t(`dash.campaignStatus.${c.status}`)}</Chip>
        </div>
        <div className="flex items-center gap-4">
          <Meter value={spent} max={c.escrow_budget} />
          <span className="shrink-0 text-xs tabular-nums text-[var(--pi-muted)]">
            {money(spent, 0)} / {money(c.escrow_budget, 0)}
          </span>
        </div>
        <div className="flex gap-5 text-xs tabular-nums text-[var(--pi-muted)]">
          <span>
            <span className="text-[var(--pi-ink-strong)]">{compact(c.views_delivered)}</span> {t('common.views')}
          </span>
          {clips !== undefined && (
            <span>
              <span className="text-[var(--pi-ink-strong)]">{clips}</span> {t('common.clips')}
            </span>
          )}
        </div>
      </div>
      <ArrowUpRight className="hidden size-4 shrink-0 text-[var(--pi-muted)] sm:block!" />
    </Link>
  );
}

const PLATFORM_TINT: Record<Platform, string> = {
  tiktok: 'bg-[linear-gradient(135deg,#111_0%,#2a2a2a_60%,#25F4EE33_100%)]',
  youtube: 'bg-[linear-gradient(135deg,#2b0a0a_0%,#5a0d0d_55%,#FF000055_100%)]',
  instagram: 'bg-[linear-gradient(135deg,#3a0f4d_0%,#7a1d6b_50%,#F5853F66_100%)]',
};

/** Per-platform rates as split cards: tinted top half, rate + chips below. */
export function RateTable({ c }: { c: CampaignRow }) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-3 sm:grid-cols-3!">
      {c.platforms.map((p) => {
        const r = rateFor(c, p);
        return (
          <div key={p} className="group flex flex-col">
            <div className={`cr-card relative flex h-16 items-center justify-between overflow-hidden rounded-t-2xl px-4 text-white ${PLATFORM_TINT[p]}`}>
              <span className="text-[14px] font-semibold">{PLATFORM_NAME[p]}</span>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                <PlatformIcon platform={p} className="size-4" />
              </span>
            </div>
            <div className="cr-card flex flex-1 flex-col gap-3 rounded-b-2xl bg-[var(--pi-surface)] px-4 pb-4 pt-3">
              <p className="text-[1.75rem] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">
                {money(r.cpm)}
                <span className="ml-1 text-xs tracking-normal text-[var(--pi-muted)]">/ 1K {t('common.views')}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="cr-chip flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold tabular-nums text-[var(--pi-ink-strong)]">
                  <span className="font-normal text-[var(--pi-muted)]">{t('camp.minPayout')}</span> {r.minPayout ? money(r.minPayout) : '—'}
                </span>
                <span className="cr-chip flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold tabular-nums text-[var(--pi-ink-strong)]">
                  <span className="font-normal text-[var(--pi-muted)]">{t('camp.maxPerClip')}</span> {r.maxCap ? money(r.maxCap, 0) : t('camp.noCap')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Fund a campaign through CryptoPay. Polls the invoice until it is paid. */
export function FundPanel({
  campaignId,
  defaultAmount = 500,
  onPaid,
}: {
  campaignId: string;
  defaultAmount?: number;
  onPaid: () => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Awaited<ReturnType<typeof createInvoice>> | null>(null);
  const [status, setStatus] = useState<'waiting' | 'paid' | 'expired'>('waiting');
  const paidRef = useRef(false);

  useEffect(() => {
    if (!invoice || status !== 'waiting') return;
    const id = setInterval(async () => {
      const r = await checkInvoice(invoice.invoiceId);
      if (r.paid && !paidRef.current) {
        paidRef.current = true;
        setStatus('paid');
        onPaid();
      } else if (r.status === 'expired') setStatus('expired');
    }, 4000);
    return () => clearInterval(id);
  }, [invoice, status, onPaid]);

  const value = Number(amount);
  const valid = value >= 10;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      setInvoice(await createInvoice(campaignId, Math.round(value * 100) / 100));
      setStatus('waiting');
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  if (status === 'paid')
    return (
      <div className="space-y-4">
        <div className="mx-auto w-44"><Success /></div>
        <Notice tone="green">{t('fund.paid')}</Notice>
      </div>
    );

  if (invoice) {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--pi-line)] pb-3">
          <span className="text-sm text-[var(--pi-muted)]">{t('fund.invoice')}</span>
          <span className="text-2xl font-light tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">
            ${invoice.amount}
          </span>
        </div>
        {status === 'expired' ? (
          <Notice tone="amber">{t('fund.expired')}</Notice>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[var(--pi-ink)]">
            <span className="size-2 animate-pulse rounded-full bg-amber-500" />
            {t('fund.waiting')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Btn href={invoice.payUrl} external>
            {t('fund.openBot')} <ExternalLink className="size-3.5" />
          </Btn>
          {invoice.miniAppUrl && (
            <Btn href={invoice.miniAppUrl} external variant="outline">
              {t('fund.openWeb')}
            </Btn>
          )}
          <Btn variant="ghost" onClick={() => setInvoice(null)}>
            {t('fund.newInvoice')}
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Field label={t('fund.amount')} hint={t('fund.amountHint')} error={amount && !valid ? t('fund.min') : null}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pi-muted)]">$</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            className={`${boxInputCls} pl-7 tabular-nums`}
          />
        </div>
      </Field>
      {valid && moneyState().rate && <p className="-mt-3 text-xs tabular-nums text-[var(--pi-muted)]">≈ {kzt(value)} · {t('fund.inUsd')}</p>}
      <Notice>{t('fund.note')}</Notice>
      {error && <Notice tone="red">{error}</Notice>}
      <Btn onClick={start} disabled={!valid} loading={busy} size="lg" className="w-full">
        {t('fund.cta').replace('{amount}', usd(valid ? value : 0))}
      </Btn>
    </div>
  );
}
