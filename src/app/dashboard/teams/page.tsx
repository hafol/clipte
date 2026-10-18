'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useMyReferrals } from '@/lib/supabase/data';
import { PageHeader, Section, Label, StatStrip, EmptyState, SkeletonRows, money } from '@/components/dashboard/ui';
import { CopyButton, Notice, timeAgo } from '@/components/dashboard/forms';

const RATE = 0.05; // 5% …
const CAP = 100; // … of each invited clipper's first $100 (matches settle_clip)

export default function TeamsPage() {
  const { t, lang } = useLanguage();
  const { profile } = useUserProfile();
  const { data: people, loading } = useMyReferrals(!!profile);
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  if (!profile) return null;
  const code = profile.referral_code || '';
  const link = code ? `${origin}/register?ref=${code}` : '';
  const shareText = t('ref.shareText');
  const earned = people.reduce((a, p) => a + p.reward, 0);
  const earning = people.filter((p) => p.progress > 0).length;
  const potential = people.reduce((a, p) => a + (CAP - p.progress) * RATE, 0);

  return (
    <div className="space-y-12">
      <PageHeader eyebrow={t('shell.teams')} title={t('ref.title')} subtitle={t('ref.subtitle')} />

      <section className="pi-notch relative isolate overflow-hidden bg-[#111] p-6 text-white md:p-10!">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(90%_120%_at_100%_0%,#3a3a3a_0%,#111_65%)]" />
        <span aria-hidden className="absolute -bottom-10 right-4 -z-10 select-none text-[11rem] font-light leading-none tracking-[-0.08em] text-white/[0.05] md:text-[16rem]!">5%</span>
        <Label>{t('teams.yourLink')}</Label>
        <p className="mt-3 max-w-xl text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-tight tracking-[-0.04em]">{t('ref.pitch')}</p>
        {code ? (
          <div className="mt-6 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row! sm:items-center!">
              <code className="pi-notch min-w-0 flex-1 truncate bg-white/10 px-4 py-3 text-sm text-white">{link}</code>
              <CopyButton value={link} label={t('teams.copyLink')} copiedLabel={t('common.copied')} />
            </div>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="pi-notch inline-flex h-9 items-center gap-2 bg-[#2AABEE] px-3.5 text-white transition-opacity hover:opacity-90"
              >
                Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`}
                target="_blank"
                rel="noreferrer"
                className="pi-notch inline-flex h-9 items-center gap-2 bg-[#25D366] px-3.5 text-white transition-opacity hover:opacity-90"
              >
                WhatsApp
              </a>
              <span className="inline-flex h-9 items-center px-2 text-white/60">
                {t('teams.code')}: <span className="ml-1 font-mono tracking-wider text-white">{code}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Notice tone="amber">{t('teams.noCode')}</Notice>
          </div>
        )}
      </section>

      <StatStrip
        loading={loading}
        items={[
          { label: t('ref.invited'), value: String(people.length), hint: t('ref.invitedHint') },
          { label: t('ref.earning'), value: String(earning), hint: t('ref.earningHint') },
          { label: t('ref.earned'), value: money(earned), hint: t('ref.earnedHint') },
          { label: t('ref.potential'), value: money(potential), hint: t('ref.potentialHint') },
        ]}
      />

      <Section title={t('ref.people')}>
        {loading ? (
          <SkeletonRows rows={3} />
        ) : people.length === 0 ? (
          <EmptyState title={t('ref.none')} desc={t('ref.noneDesc')} />
        ) : (
          <ul className="divide-y divide-[var(--pi-line)]">
            {people.map((p) => {
              const pct = Math.min(100, (p.progress / CAP) * 100);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-full bg-[var(--pi-btn)] text-sm text-[var(--pi-btn-fg)]">{(p.name || '?').slice(0, 1).toUpperCase()}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[var(--pi-ink-strong)]">{p.name || t('msg.someone')}</span>
                    <span className="block text-xs text-[var(--pi-muted)]">{t('ref.joined').replace('{t}', timeAgo(p.joined_at, lang))}</span>
                  </div>
                  <div className="w-full sm:w-56!">
                    <div className="mb-1 flex justify-between text-[11px] tabular-nums text-[var(--pi-muted)]">
                      <span>{pct >= 100 ? t('ref.capped') : t('ref.toward').replace('{n}', money(p.progress, 0))}</span>
                      <span>{money(CAP, 0)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pi-line)]">
                      <div className="ch-grow-x h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm tabular-nums text-[var(--pi-ink-strong)]">+{money(p.reward)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t('teams.how')}>
        <ol className="grid gap-6 md:grid-cols-3!">
          {[1, 2, 3].map((n) => (
            <li key={n} className="space-y-3">
              <span className="block text-[2.5rem] font-light leading-none tracking-[-0.06em] tabular-nums text-[var(--pi-ink-strong)]">
                {String(n).padStart(2, '0')}
              </span>
              <span className="block text-[15px] tracking-tight text-[var(--pi-ink-strong)]">{t(`ref.s${n}`)}</span>
              <span className="block text-sm font-light leading-relaxed text-[var(--pi-ink)]">{t(`ref.s${n}d`)}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Notice>{t('ref.rules')}</Notice>
    </div>
  );
}
