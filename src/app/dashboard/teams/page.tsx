'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useReferralCount } from '@/lib/supabase/data';
import { PageHeader, Section, Label } from '@/components/dashboard/ui';
import { CopyButton, Notice } from '@/components/dashboard/forms';

export default function TeamsPage() {
  const { t } = useLanguage();
  const { profile } = useUserProfile();
  const { data: joined, loading } = useReferralCount(!!profile);
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  if (!profile) return null;
  const code = profile.referral_code || '';
  const link = code ? `${origin}/register?ref=${code}` : '';

  return (
    <div className="space-y-12">
      <PageHeader eyebrow={t('shell.teams')} title={t('teams.title')} subtitle={t('teams.subtitle')} />

      <section className="pi-notch pi-edge space-y-5 bg-[var(--pi-surface)] p-6 md:p-8!">
        <Label>{t('teams.yourLink')}</Label>
        {code ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row! sm:items-center!">
              <code className="pi-notch min-w-0 flex-1 truncate bg-[var(--pi-line)] px-4 py-3 text-sm text-[var(--pi-ink-strong)]">{link}</code>
              <CopyButton value={link} label={t('teams.copyLink')} copiedLabel={t('common.copied')} />
            </div>
            <p className="text-xs text-[var(--pi-muted)]">
              {t('teams.code')}: <span className="font-mono tracking-wider text-[var(--pi-ink-strong)]">{code}</span>
            </p>
          </>
        ) : (
          <Notice tone="amber">{t('teams.noCode')}</Notice>
        )}
      </section>

      <div className="flex items-end justify-between gap-6 border-y border-[var(--pi-line-strong)] py-6">
        <div>
          <span className="text-[13px] text-[var(--pi-muted)]">{t('teams.joined')}</span>
          <span className="mt-1 block text-xs text-[var(--pi-muted)]">{t('teams.joinedHint')}</span>
        </div>
        {loading ? (
          <span className="h-12 w-16 animate-pulse bg-[var(--pi-line)]" />
        ) : (
          <span className="text-[clamp(2.5rem,5vw,4rem)] font-light leading-none tracking-[-0.05em] tabular-nums text-[var(--pi-ink-strong)]">{joined}</span>
        )}
      </div>

      <Section title={t('teams.how')}>
        <ol className="grid gap-6 md:grid-cols-3!">
          {[1, 2, 3].map((n) => (
            <li key={n} className="space-y-3">
              <span className="block text-[2.5rem] font-light leading-none tracking-[-0.06em] tabular-nums text-[var(--pi-ink-strong)]">
                {String(n).padStart(2, '0')}
              </span>
              <span className="block text-[15px] tracking-tight text-[var(--pi-ink-strong)]">{t(`teams.s${n}`)}</span>
              <span className="block text-sm font-light leading-relaxed text-[var(--pi-ink)]">{t(`teams.s${n}d`)}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Notice>{t('teams.rewardsNote')}</Notice>
    </div>
  );
}
