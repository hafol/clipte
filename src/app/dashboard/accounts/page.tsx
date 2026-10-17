'use client';
import { VerifyAccount } from '@/components/illustrations';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, ImagePlus, Plus, RefreshCw, Trash2 } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile, type Profile } from '@/lib/supabase/hooks';
import {
  useAccounts, addAccount, removeAccount, verifyAccount, updateProfile, cleanHandle, errText,
  PLATFORMS, PLATFORM_NAME, type Platform, type SocialAccountRow,
} from '@/lib/supabase/data';
import { PageHeader, Chip, EmptyState, ErrorNote, PlatformIcon, SkeletonRows, Label } from '@/components/dashboard/ui';
import { Btn, CopyButton, Field, Modal, Notice, Select, Tabs, boxInputCls, inputCls, useToast } from '@/components/dashboard/forms';

type T = (k: string) => string;
type Tab = 'social' | 'profile' | 'brand';

const PROFILE_URL: Record<Platform, (h: string) => string> = {
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
  instagram: (h) => `https://www.instagram.com/${h}/`,
};

export default function AccountsPage() {
  const { t } = useLanguage();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const [tab, setTab] = useState<Tab>('social');
  const { toast, toastNode } = useToast();

  useEffect(() => {
    const h = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (h === 'profile' || h === 'brand') setTab(h);
  }, []);

  if (!profile) return null;

  return (
    <div className="space-y-10">
      {toastNode}
      <PageHeader eyebrow={t('shell.accounts')} title={t('acc.title')} subtitle={t('acc.subtitle')} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'social', label: t('acc.tabSocial') },
          { id: 'profile', label: t('acc.tabProfile') },
          { id: 'brand', label: t('acc.tabBrand') },
        ]}
      />
      {tab === 'social' && <SocialTab profile={profile} t={t} toast={toast} />}
      {tab === 'profile' && <ProfileTab profile={profile} t={t} toast={toast} onSaved={refreshProfile} />}
      {tab === 'brand' && <BrandTab profile={profile} t={t} toast={toast} onSaved={refreshProfile} />}
    </div>
  );
}

/* ============================== social ============================== */

function SocialTab({ profile, t, toast }: { profile: Profile; t: T; toast: (m: string, tone?: 'green' | 'red') => void }) {
  const { data: accounts, loading, error, refresh } = useAccounts(profile.id);
  const [addOpen, setAddOpen] = useState(false);
  const [active, setActive] = useState<SocialAccountRow | null>(null);
  const [removing, setRemoving] = useState<SocialAccountRow | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-sm font-light leading-relaxed text-[var(--pi-ink)]">{t('acc.socialIntro')}</p>
        <Btn onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> {t('acc.connect')}
        </Btn>
      </div>

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      {loading ? (
        <SkeletonRows />
      ) : accounts.length === 0 ? (
        <EmptyState art={<VerifyAccount />} title={t('acc.none')} desc={t('acc.noneDesc')} />
      ) : (
        <ul className="divide-y divide-[var(--pi-line)] border-y border-[var(--pi-line)]">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 py-4">
              <span className="pi-notch flex size-10 shrink-0 items-center justify-center bg-[var(--pi-line)] text-[var(--pi-ink-strong)]">
                <PlatformIcon platform={a.platform} className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={PROFILE_URL[a.platform](a.handle)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[15px] text-[var(--pi-ink-strong)] hover:underline"
                >
                  @{a.handle} <ExternalLink className="size-3 opacity-50" />
                </a>
                <span className="block text-xs text-[var(--pi-muted)]">{PLATFORM_NAME[a.platform]}</span>
              </div>
              {a.verified_at ? (
                <Chip tone="green">{t('acc.verified')}</Chip>
              ) : (
                <>
                  <Chip tone="amber">{t('acc.pending')}</Chip>
                  <Btn size="sm" variant="outline" onClick={() => setActive(a)}>
                    {t('acc.finish')}
                  </Btn>
                </>
              )}
              <button
                type="button"
                onClick={() => setRemoving(a)}
                title={t('common.remove')}
                className="p-2 text-[var(--pi-muted)] transition-colors hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="size-4" strokeWidth={1.6} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddAccount
        open={addOpen}
        onClose={() => setAddOpen(false)}
        userId={profile.id}
        t={t}
        onCreated={(a) => {
          setAddOpen(false);
          refresh();
          setActive(a);
        }}
      />
      <VerifyDialog
        account={active}
        onClose={() => setActive(null)}
        t={t}
        onVerified={() => {
          toast(t('acc.verifiedToast'));
          setActive(null);
          refresh();
        }}
      />
      <Modal open={!!removing} onClose={() => setRemoving(null)} title={t('acc.removeTitle')}>
        <div className="space-y-5">
          <p className="text-sm text-[var(--pi-ink)]">{t('acc.removeDesc').replace('{h}', `@${removing?.handle || ''}`)}</p>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </Btn>
            <Btn
              variant="danger"
              onClick={async () => {
                if (!removing) return;
                try {
                  await removeAccount(removing.id);
                  setRemoving(null);
                  refresh();
                } catch (e) {
                  toast(errText(e), 'red');
                }
              }}
            >
              {t('common.remove')}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AddAccount({
  open,
  onClose,
  userId,
  t,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  t: T;
  onCreated: (a: SocialAccountRow) => void;
}) {
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = cleanHandle(handle);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clean) return;
    setBusy(true);
    setError(null);
    try {
      const a = await addAccount(userId, platform, clean);
      setHandle('');
      onCreated(a);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('acc.connect')}>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`pi-notch flex h-16 flex-col items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer ${
                platform === p ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'bg-[var(--pi-line)] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]'
              }`}
            >
              <PlatformIcon platform={p} className="size-5" />
              {PLATFORM_NAME[p]}
            </button>
          ))}
        </div>
        <Field label={t('acc.handle')} hint={t('acc.handleHint')}>
          <div className="flex items-center gap-1">
            <span className="text-[var(--pi-muted)]">@</span>
            <input autoFocus required value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" className={inputCls} />
          </div>
        </Field>
        {error && <Notice tone="red">{error}</Notice>}
        <Btn type="submit" size="lg" className="w-full" disabled={!clean} loading={busy}>
          {t('acc.getCode')}
        </Btn>
      </form>
    </Modal>
  );
}

function VerifyDialog({ account, onClose, t, onVerified }: { account: SocialAccountRow | null; onClose: () => void; t: T; onVerified: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setMsg(null), [account?.id]);
  if (!account) return null;
  const code = account.verify_code || '';

  const check = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await verifyAccount(account.id);
      if (r.verified) onVerified();
      else setMsg(r.error || t('acc.notFoundYet'));
    } catch (e) {
      setMsg(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t('acc.verifyTitle').replace('{h}', `@${account.handle}`)}>
      <div className="space-y-6">
        <div className="mx-auto w-40"><VerifyAccount /></div>
        <ol className="space-y-4 text-sm font-light leading-relaxed text-[var(--pi-ink)]">
          <li className="flex gap-3">
            <span className="tabular-nums text-[var(--pi-muted)]">01</span>
            <div className="min-w-0 flex-1 space-y-3">
              <span>{t('acc.step1')}</span>
              <div className="pi-notch flex items-center justify-between gap-3 bg-[var(--pi-line)] px-4 py-3">
                <code className="text-2xl font-light tracking-[0.18em] text-[var(--pi-ink-strong)]">{code}</code>
                <CopyButton value={code} label={t('common.copy')} copiedLabel={t('common.copied')} />
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="tabular-nums text-[var(--pi-muted)]">02</span>
            <div className="min-w-0 flex-1 space-y-2.5">
              <span className="block">{t(`acc.where_${account.platform}`)}</span>
              <div className="pi-notch bg-[var(--pi-line)] px-3.5 py-2.5 text-[13px] text-[var(--pi-ink-strong)]">
                <span className="block text-[11px] text-[var(--pi-muted)]">{t('acc.desktop')}</span>
                {t(`acc.path_${account.platform}`)}
                <span className="mt-2 block text-[11px] text-[var(--pi-muted)]">{t('acc.phone')}</span>
                {t(`acc.pathApp_${account.platform}`)}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {account.platform === 'youtube' && (
                  <a href="https://studio.youtube.com" target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {t('acc.openStudio')}
                  </a>
                )}
                <a href={PROFILE_URL[account.platform](account.handle)} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {t('acc.openProfile')}
                </a>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="tabular-nums text-[var(--pi-muted)]">03</span>
            <span>{t('acc.step3')}</span>
          </li>
        </ol>
        {account.platform !== 'youtube' && <Notice tone="blue">{t('acc.manualNote')}</Notice>}
        {msg && <Notice tone="amber">{msg}</Notice>}
        <Btn size="lg" className="w-full" onClick={check} loading={busy}>
          <RefreshCw className="size-4" /> {t('acc.checkBio')}
        </Btn>
        <p className="text-center text-xs text-[var(--pi-muted)]">{t('acc.removeAfter')}</p>
      </div>
    </Modal>
  );
}

/* ============================== profile ============================== */

async function toSquare(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const s = Math.min(img.width, img.height);
    c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ImagePick({ value, onChange, label, t }: { value: string | null; onChange: (v: string | null) => void; label: string; t: T }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="pi-notch flex size-20 shrink-0 items-center justify-center overflow-hidden bg-[var(--pi-line)] text-[var(--pi-muted)] transition-colors hover:text-[var(--pi-ink-strong)] cursor-pointer"
        aria-label={label}
      >
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6" strokeWidth={1.4} />}
      </button>
      <div className="space-y-1.5">
        <span className="block text-[13px] text-[var(--pi-muted)]">{label}</span>
        <div className="flex gap-2">
          <Btn size="sm" variant="outline" onClick={() => ref.current?.click()}>
            {t('acc.upload')}
          </Btn>
          {value && (
            <Btn size="sm" variant="ghost" onClick={() => onChange(null)}>
              {t('common.remove')}
            </Btn>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f && f.type.startsWith('image/')) onChange(await toSquare(f));
          e.target.value = '';
        }}
      />
    </div>
  );
}

function ProfileTab({ profile, t, toast, onSaved }: { profile: Profile; t: T; toast: (m: string, tone?: 'green' | 'red') => void; onSaved: () => void }) {
  const [name, setName] = useState(profile.full_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(profile.id, { full_name: name.trim() || null, bio: bio.trim() || null, avatar_url: avatar });
      toast(t('common.saved'));
      onSaved();
    } catch (err) {
      toast(errText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-12 lg:grid-cols-12!">
      <div className="space-y-7 lg:col-span-7!">
        <ImagePick value={avatar} onChange={setAvatar} label={t('acc.avatar')} t={t} />
        <Field label={t('acc.name')}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputCls} />
        </Field>
        <Field label={t('acc.bio')} hint={t('acc.bioHint')}>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} className={boxInputCls} />
        </Field>
        <Field label={t('acc.email')} hint={t('acc.emailHint')}>
          <input value={profile.email} disabled className={inputCls} />
        </Field>
        <Btn type="submit" loading={busy}>
          {t('common.save')}
        </Btn>
      </div>
      <aside className="space-y-4 lg:col-span-5!">
        <Label>{t('acc.publicCard')}</Label>
        <div className="pi-notch pi-edge flex items-center gap-4 bg-[var(--pi-surface)] p-5">
          {avatar ? (
            <img src={avatar} alt="" className="pi-notch size-14 object-cover" />
          ) : (
            <span className="pi-notch flex size-14 items-center justify-center bg-[var(--pi-btn)] text-lg text-[var(--pi-btn-fg)]">
              {(name || profile.email).slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] text-[var(--pi-ink-strong)]">{name || '—'}</p>
            <p className="line-clamp-2 text-xs text-[var(--pi-muted)]">{bio || t('acc.noBio')}</p>
          </div>
        </div>
        <Btn href={`/dashboard/creators/${profile.id}`} variant="ghost" size="sm">
          {t('shell.publicProfile')} <ExternalLink className="size-3.5" />
        </Btn>
      </aside>
    </form>
  );
}

const INDUSTRIES = ['media', 'gaming', 'music', 'tech', 'finance', 'ecommerce', 'education', 'sports', 'other'] as const;

function BrandTab({ profile, t, toast, onSaved }: { profile: Profile; t: T; toast: (m: string, tone?: 'green' | 'red') => void; onSaved: () => void }) {
  const [name, setName] = useState(profile.brand_name || '');
  const [site, setSite] = useState(profile.brand_website || '');
  const [bio, setBio] = useState(profile.brand_bio || '');
  const [industry, setIndustry] = useState(profile.brand_industry || t('acc.ind.media'));
  const [logo, setLogo] = useState<string | null>(profile.brand_logo_url || null);
  const [busy, setBusy] = useState(false);
  const siteOk = !site.trim() || /^https?:\/\/\S+\.\S+/.test(site.trim());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !siteOk) return;
    setBusy(true);
    try {
      await updateProfile(profile.id, {
        has_brand_profile: true,
        brand_name: name.trim(),
        brand_website: site.trim() || null,
        brand_bio: bio.trim() || null,
        brand_industry: industry,
        brand_logo_url: logo,
      });
      toast(t('common.saved'));
      onSaved();
    } catch (err) {
      toast(errText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-7">
      <p className="text-sm font-light leading-relaxed text-[var(--pi-ink)]">{t('acc.brandIntro')}</p>
      <ImagePick value={logo} onChange={setLogo} label={t('acc.logo')} t={t} />
      <div className="grid gap-6 sm:grid-cols-2!">
        <Field label={t('create.brand')}>
          <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputCls} />
        </Field>
        <Field label={t('acc.industry')}>
          <Select value={industry} onChange={setIndustry} ariaLabel={t('acc.industry')} options={INDUSTRIES.map((k) => ({ value: t(`acc.ind.${k}`), label: t(`acc.ind.${k}`) }))} />
        </Field>
      </div>
      <Field label={t('acc.website')} error={siteOk ? null : t('acc.badSite')}>
        <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://" className={inputCls} />
      </Field>
      <Field label={t('acc.about')}>
        <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={400} className={boxInputCls} />
      </Field>
      <Btn type="submit" loading={busy} disabled={!name.trim() || !siteOk}>
        {t('common.save')}
      </Btn>
    </form>
  );
}
