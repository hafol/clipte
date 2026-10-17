'use client';

import { NotFound } from '@/components/illustrations';
import { NotchButton } from '@/components/pi';
import { useLanguage } from '@/context/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <main className="pi flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center antialiased">
      <span className="text-xs text-[var(--pi-muted)]">(404)</span>
      <div className="mt-6 w-64 max-w-full sm:w-80!">
        <NotFound />
      </div>
      <h1 className="mt-8 text-[clamp(2.2rem,5vw,3.75rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]">{t('nf.title')}</h1>
      <p className="mt-4 max-w-md text-[15px] font-light text-[var(--pi-ink)]">{t('nf.desc')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <NotchButton href="/" size="md" motion="spring">
          {t('nf.home')}
        </NotchButton>
        <NotchButton href="/dashboard/campaigns" size="md" variant="outline">
          {t('nf.discover')}
        </NotchButton>
      </div>
    </main>
  );
}
