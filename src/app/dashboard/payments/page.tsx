'use client';
import { EmptyWallet } from '@/components/illustrations';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Star, Trash2 } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile, type Profile } from '@/lib/supabase/hooks';
import {
  useWallet, useMyCampaigns, addPayoutMethod, removePayoutMethod, setDefaultMethod, requestPayout, errText,
  type PayoutMethodRow,
} from '@/lib/supabase/data';
import { NotchButton } from '@/components/pi';
import { PageHeader, StatStrip, Section, Chip, EmptyState, ErrorNote, SkeletonRows, usd } from '@/components/dashboard/ui';
import { Btn, Field, Modal, Notice, inputCls, timeAgo, useToast } from '@/components/dashboard/forms';
import {
  PaypalColorIcon, TetherColorIcon, UsdcColorIcon, BitcoinColorIcon, EthereumColorIcon, SolanaColorIcon,
} from '@/components/ui/SocialIcons';

type T = (k: string) => string;
type MType = PayoutMethodRow['type'];

const METHODS: { id: MType; name: string; icon: React.ComponentType<{ className?: string }>; ph: string; check: (v: string) => boolean }[] = [
  { id: 'paypal', name: 'PayPal', icon: PaypalColorIcon, ph: 'you@email.com', check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  { id: 'usdt_trc20', name: 'USDT · TRC-20', icon: TetherColorIcon, ph: 'T…', check: (v) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(v) },
  { id: 'usdc_erc20', name: 'USDC · ERC-20', icon: UsdcColorIcon, ph: '0x…', check: (v) => /^0x[a-fA-F0-9]{40}$/.test(v) },
  { id: 'btc', name: 'Bitcoin', icon: BitcoinColorIcon, ph: 'bc1…', check: (v) => /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(v) },
  { id: 'eth', name: 'Ethereum', icon: EthereumColorIcon, ph: '0x…', check: (v) => /^0x[a-fA-F0-9]{40}$/.test(v) },
  { id: 'sol', name: 'Solana', icon: SolanaColorIcon, ph: '…', check: (v) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v) },
];
const methodOf = (id: string) => METHODS.find((m) => m.id === id) || METHODS[0];
const mask = (a: string) => (a.length > 16 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export default function PaymentsPage() {
  const { profile, refresh: refreshProfile } = useUserProfile();
  if (!profile) return null;
  return profile.active_mode === 'brand' ? <BrandWallet profile={profile} /> : <ClipperWallet profile={profile} onChange={refreshProfile} />;
}

/* ============================== clipper ============================== */

function ClipperWallet({ profile, onChange }: { profile: Profile; onChange: () => void }) {
  const { t, lang } = useLanguage();
  const { data, loading, error, refresh } = useWallet(profile.id);
  const { toast, toastNode } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const processing = data.payouts.filter((p) => p.status === 'processing');
  const paidOut = data.payouts.filter((p) => p.status === 'completed').reduce((a, p) => a + p.amount, 0);
  const canWithdraw = profile.balance_earnings > 0 && processing.length === 0 && data.methods.length > 0 && !profile.is_suspended;

  return (
    <div className="space-y-12">
      {toastNode}
      <PageHeader
        eyebrow={t('shell.payments')}
        title={t('pay.title')}
        subtitle={t('pay.subtitle')}
        actions={
          <Btn size="lg" onClick={() => setWithdrawOpen(true)} disabled={!canWithdraw}>
            {t('pay.withdraw')}
          </Btn>
        }
      />

      {processing.length > 0 && <Notice tone="blue">{t('pay.inProgress').replace('{n}', usd(processing[0].amount))}</Notice>}
      {!loading && data.methods.length === 0 && <Notice tone="amber">{t('pay.addMethodFirst')}</Notice>}

      <StatStrip
        loading={loading}
        items={[
          { label: t('overview.c.available'), value: usd(profile.balance_earnings), hint: t('pay.availableHint') },
          { label: t('pay.processing'), value: usd(processing.reduce((a, p) => a + p.amount, 0)), hint: t('pay.processingHint') },
          { label: t('pay.paidOut'), value: usd(paidOut), hint: t('pay.paidOutHint') },
          { label: t('overview.c.earned'), value: usd(profile.total_earnings), hint: t('overview.c.earnedHint') },
        ]}
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12!">
        <Section
          className="lg:col-span-5!"
          title={t('pay.methods')}
          action={
            <button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1 text-[13px] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)] cursor-pointer">
              <Plus className="size-3.5" /> {t('pay.add')}
            </button>
          }
        >
          {loading ? (
            <SkeletonRows rows={2} />
          ) : data.methods.length === 0 ? (
            <EmptyState
              title={t('pay.noMethods')}
              desc={t('pay.noMethodsDesc')}
              action={
                <Btn size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                  {t('pay.add')}
                </Btn>
              }
            />
          ) : (
            <ul className="space-y-2">
              {data.methods.map((m) => {
                const meta = methodOf(m.type);
                return (
                  <li key={m.id} className="pi-notch pi-edge flex items-center gap-3 bg-[var(--pi-surface)] p-4">
                    <meta.icon className="size-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm text-[var(--pi-ink-strong)]">{meta.name}</span>
                      <span className="block truncate font-mono text-xs text-[var(--pi-muted)]">{mask(m.address)}</span>
                    </div>
                    {m.is_default ? (
                      <Chip>{t('pay.default')}</Chip>
                    ) : (
                      <button
                        type="button"
                        title={t('pay.makeDefault')}
                        onClick={async () => {
                          try {
                            await setDefaultMethod(profile.id, m.id);
                            refresh();
                          } catch (e) {
                            toast(errText(e), 'red');
                          }
                        }}
                        className="p-2 text-[var(--pi-muted)] hover:text-[var(--pi-ink-strong)] cursor-pointer"
                      >
                        <Star className="size-4" strokeWidth={1.6} />
                      </button>
                    )}
                    <button
                      type="button"
                      title={t('common.remove')}
                      onClick={async () => {
                        try {
                          await removePayoutMethod(m.id);
                          refresh();
                        } catch (e) {
                          toast(errText(e), 'red');
                        }
                      }}
                      className="p-2 text-[var(--pi-muted)] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="size-4" strokeWidth={1.6} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section className="lg:col-span-7!" title={t('pay.history')}>
          {loading ? (
            <SkeletonRows />
          ) : data.payouts.length === 0 ? (
            <EmptyState art={<EmptyWallet />} title={t('pay.noPayouts')} desc={t('pay.noPayoutsDesc')} />
          ) : (
            <ul className="divide-y divide-[var(--pi-line)]">
              {data.payouts.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm text-[var(--pi-ink-strong)]">
                      {methodOf(p.method_type).name} · <span className="font-mono text-xs text-[var(--pi-muted)]">{mask(p.recipient)}</span>
                    </span>
                    <span className="block truncate text-xs text-[var(--pi-muted)]">
                      {timeAgo(p.created_at, lang)}
                      {p.transaction_reference ? ` · ${p.transaction_reference}` : ''}
                      {p.failure_reason ? ` · ${p.failure_reason}` : ''}
                    </span>
                  </div>
                  <span className="text-sm tabular-nums text-[var(--pi-ink-strong)]">{usd(p.amount)}</span>
                  <Chip tone={p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'blue'}>{t(`pay.st.${p.status}`)}</Chip>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <AddMethod
        open={addOpen}
        onClose={() => setAddOpen(false)}
        t={t}
        first={data.methods.length === 0}
        onAdd={async (type, address, def) => {
          await addPayoutMethod(profile.id, type, address, def);
          toast(t('common.saved'));
          refresh();
        }}
      />
      <Withdraw
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        t={t}
        amount={profile.balance_earnings}
        methods={data.methods}
        onDone={() => {
          toast(t('pay.requested'));
          refresh();
          onChange();
        }}
      />
    </div>
  );
}

function AddMethod({
  open,
  onClose,
  t,
  first,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  t: T;
  first: boolean;
  onAdd: (type: MType, address: string, makeDefault: boolean) => Promise<void>;
}) {
  const [type, setType] = useState<MType>('usdt_trc20');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = methodOf(type);
  const ok = meta.check(address.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(type, address, first);
      setAddress('');
      onClose();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('pay.addTitle')}>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3!">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setType(m.id)}
              className={`pi-notch flex h-16 flex-col items-center justify-center gap-1.5 px-2 text-xs transition-colors cursor-pointer ${
                type === m.id ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'bg-[var(--pi-line)] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]'
              }`}
            >
              <m.icon className="size-5" />
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
        <Field
          label={type === 'paypal' ? t('pay.paypalEmail') : t('pay.wallet')}
          error={address.trim() && !ok ? t('pay.badAddress') : null}
          hint={type !== 'paypal' ? t('pay.networkHint').replace('{n}', meta.name) : undefined}
        >
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={meta.ph} className={`${inputCls} font-mono`} autoFocus />
        </Field>
        {error && <Notice tone="red">{error}</Notice>}
        <Btn type="submit" size="lg" className="w-full" disabled={!ok} loading={busy}>
          {t('pay.save')}
        </Btn>
      </form>
    </Modal>
  );
}

function Withdraw({
  open,
  onClose,
  t,
  amount,
  methods,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  t: T;
  amount: number;
  methods: PayoutMethodRow[];
  onDone: () => void;
}) {
  const [method, setMethod] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosen = method || methods.find((m) => m.is_default)?.id || methods[0]?.id || '';

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestPayout(chosen);
      onDone();
      onClose();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('pay.withdraw')}>
      <div className="space-y-6">
        <div className="border-b border-[var(--pi-line)] pb-4">
          <span className="text-[13px] text-[var(--pi-muted)]">{t('pay.youGet')}</span>
          <p className="mt-1 text-[2.5rem] font-light leading-none tracking-[-0.05em] tabular-nums text-[var(--pi-ink-strong)]">{usd(amount)}</p>
          <p className="mt-2 text-xs text-[var(--pi-muted)]">{t('pay.wholeBalance')}</p>
        </div>
        <div className="space-y-2">
          {methods.map((m) => {
            const meta = methodOf(m.type);
            return (
              <label key={m.id} className={`pi-notch flex items-center gap-3 p-3.5 transition-colors cursor-pointer ${chosen === m.id ? 'bg-[var(--pi-line)]' : 'hover:bg-[var(--pi-line)]/60'}`}>
                <input type="radio" name="method" checked={chosen === m.id} onChange={() => setMethod(m.id)} className="accent-[var(--pi-ink-strong)]" />
                <meta.icon className="size-6" />
                <span className="min-w-0 flex-1 text-sm text-[var(--pi-ink-strong)]">
                  {meta.name} <span className="ml-1 font-mono text-xs text-[var(--pi-muted)]">{mask(m.address)}</span>
                </span>
              </label>
            );
          })}
        </div>
        <Notice>{t('pay.withdrawNote')}</Notice>
        {error && <Notice tone="red">{error}</Notice>}
        <Btn size="lg" className="w-full" onClick={go} loading={busy} disabled={!chosen || amount <= 0}>
          {t('pay.confirmWithdraw').replace('{n}', usd(amount))}
        </Btn>
      </div>
    </Modal>
  );
}

/* ============================== brand ============================== */

function BrandWallet({ profile }: { profile: Profile }) {
  const { t, lang } = useLanguage();
  const { data, loading, error, refresh } = useWallet(profile.id);
  const mine = useMyCampaigns(profile.id);
  const paid = data.deposits.filter((d) => d.status === 'paid');
  const funded = paid.reduce((a, d) => a + d.amount, 0);
  const inCampaigns = mine.data.campaigns.reduce((a, c) => a + c.remaining_budget, 0);
  const spent = mine.data.campaigns.reduce((a, c) => a + Math.max(0, c.escrow_budget - c.remaining_budget), 0);
  const unfunded = mine.data.campaigns.filter((c) => c.status === 'pending_payment');

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={t('shell.escrow')}
        title={t('pay.brandTitle')}
        subtitle={t('pay.brandSubtitle')}
        actions={
          <NotchButton href="/dashboard/campaigns/create" size="md">
            {t('shell.newCampaign')}
          </NotchButton>
        }
      />

      <StatStrip
        loading={loading || mine.loading}
        items={[
          { label: t('pay.deposited'), value: usd(funded), hint: t('pay.depositedHint').replace('{n}', String(paid.length)) },
          { label: t('pay.inCampaigns'), value: usd(inCampaigns), hint: t('pay.inCampaignsHint') },
          { label: t('overview.b.spent'), value: usd(spent), hint: t('overview.b.spentHint') },
          { label: t('pay.refunds'), value: usd(profile.balance_escrow), hint: t('pay.refundsHint') },
        ]}
      />

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      {unfunded.length > 0 && (
        <Section title={t('pay.needFunding')}>
          <ul className="divide-y divide-[var(--pi-line)]">
            {unfunded.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 py-3.5">
                <span className="min-w-0 truncate text-sm text-[var(--pi-ink-strong)]">{c.title}</span>
                <Btn size="sm" href={`/dashboard/campaigns/${c.id}?fund=1`}>
                  {t('camp.fundNow')}
                </Btn>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t('pay.deposits')}>
        {loading ? (
          <SkeletonRows />
        ) : data.deposits.length === 0 ? (
          <EmptyState art={<EmptyWallet />} title={t('camp.noDeposits')} desc={t('pay.noDepositsDesc')} />
        ) : (
          <ul className="divide-y divide-[var(--pi-line)]">
            {data.deposits.map((d) => (
              <li key={d.id} className="flex items-center gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  {d.campaign_id ? (
                    <Link href={`/dashboard/campaigns/${d.campaign_id}`} className="block truncate text-sm text-[var(--pi-ink-strong)] hover:underline">
                      {d.campaign?.title || '—'}
                    </Link>
                  ) : (
                    <span className="block text-sm text-[var(--pi-ink-strong)]">{t('pay.balanceTopup')}</span>
                  )}
                  <span className="block text-xs text-[var(--pi-muted)]">
                    #{d.invoice_id} · {timeAgo(d.created_at, lang)}
                  </span>
                </div>
                <span className="text-sm tabular-nums text-[var(--pi-ink-strong)]">{usd(d.amount)}</span>
                <Chip tone={d.status === 'paid' ? 'green' : d.status === 'pending' ? 'amber' : 'muted'}>{t(`pay.dep.${d.status}`)}</Chip>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
