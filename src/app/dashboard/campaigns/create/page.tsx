'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ImagePlus, Plus, X } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import {
  createCampaign, errText, PLATFORMS, PLATFORM_NAME, normCampaign,
  type CampaignDraft, type Platform, type PlatformRate,
} from '@/lib/supabase/data';
import { PageHeader, PlatformIcon, Label, usd, compact } from '@/components/dashboard/ui';
import { Btn, Field, Notice, Segmented, Select, boxInputCls, inputCls } from '@/components/dashboard/forms';
import { LevelMedal } from '@/components/dashboard/levels';
import { FundPanel } from '@/components/dashboard/campaign';
import { DiscoverCard } from '@/components/dashboard/discover';

type T = (k: string) => string;
type Step = 1 | 2 | 3 | 4;

const CATEGORIES = ['podcasts', 'streaming', 'gaming', 'music', 'sports', 'tech', 'finance', 'lifestyle', 'education', 'other'] as const;
const DO_KEYS = ['do1', 'do2', 'do3', 'do4', 'do5'] as const;
const DONT_KEYS = ['dont1', 'dont2', 'dont3', 'dont4'] as const;
const DEFAULT_RATES: Record<Platform, PlatformRate> = {
  tiktok: { cpm: 1.5, minPayout: 0, maxCap: 300 },
  youtube: { cpm: 1.5, minPayout: 0, maxCap: 300 },
  instagram: { cpm: 1.5, minPayout: 0, maxCap: 300 },
};

/** Resize an uploaded image to a 1280×720 JPEG data URL (keeps the row small). */
async function toCover(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const W = 1280,
      H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const scale = Math.max(W / img.width, H / img.height);
    const w = img.width * scale,
      h = img.height * scale;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const isUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());

export default function CreateCampaignPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { profile } = useUserProfile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [tried, setTried] = useState(false);

  // 1 · basics
  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('podcasts');
  const [minLevel, setMinLevel] = useState<'all' | 'silver' | 'gold' | 'platinum'>('all');
  const [platforms, setPlatforms] = useState<Platform[]>(['tiktok', 'youtube', 'instagram']);
  const [cover, setCover] = useState<string | null>(null);
  const [coverErr, setCoverErr] = useState<string | null>(null);

  // 2 · brief
  const [description, setDescription] = useState('');
  const [drive, setDrive] = useState('');
  const [handle, setHandle] = useState('');
  const [tags, setTags] = useState('');
  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
  const [customDo, setCustomDo] = useState('');
  const [customDont, setCustomDont] = useState('');

  // 3 · rates
  const [sameRate, setSameRate] = useState<'same' | 'each'>('same');
  const [rates, setRates] = useState<Record<Platform, PlatformRate>>(DEFAULT_RATES);
  const [budget, setBudget] = useState('500');

  // 4 · create + fund
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const brand = brandName.trim() || profile?.brand_name || profile?.full_name || '';
  const effRates = useMemo(() => {
    const out: Partial<Record<Platform, PlatformRate>> = {};
    for (const p of platforms) out[p] = sameRate === 'same' ? { ...rates.tiktok } : { ...rates[p] };
    return out;
  }, [platforms, rates, sameRate]);
  const cpms = platforms.map((p) => Number(effRates[p]?.cpm) || 0);
  const avgCpm = cpms.length ? cpms.reduce((a, b) => a + b, 0) / cpms.length : 0;
  const budgetNum = Number(budget) || 0;
  const estViews = avgCpm > 0 ? Math.round((budgetNum / avgCpm) * 1000) : 0;

  const errs = {
    title: title.trim().length < 4 ? t('create.errTitle') : null,
    brand: !brand ? t('create.errBrand') : null,
    drive: !isUrl(drive) ? t('create.errDrive') : null,
    rates: cpms.some((v) => !(v > 0) || v > 100) ? t('create.errRate') : null,
    budget: budgetNum < 10 ? t('fund.min') : null,
  };
  const stepOk: Record<Step, boolean> = {
    1: !errs.title && !errs.brand && platforms.length > 0,
    2: !errs.drive,
    3: !errs.rates && !errs.budget,
    4: true,
  };

  const go = (next: Step) => {
    if (next > step && !stepOk[step]) {
      setTried(true);
      return;
    }
    setTried(false);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => (prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]));
  const setRate = (p: Platform, k: keyof PlatformRate, v: string) =>
    setRates((prev) => ({ ...prev, [p]: { ...prev[p], [k]: v === '' ? undefined : Number(v) } }));
  const toggle = (list: string[], set: (v: string[]) => void, item: string) =>
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const draft: CampaignDraft = {
    title: title.trim(),
    brand_name: brand,
    category, // stored as a key; every screen translates it (categoryLabel)
    min_level: minLevel === 'all' ? null : minLevel,
    drive_url: drive.trim(),
    cover_url: cover,
    icon_url: profile?.brand_logo_url || null,
    hashtags: tags
      .split(/\s+/)
      .filter(Boolean)
      .map((x) => (x.startsWith('#') ? x : `#${x}`)),
    description: description.trim() || null,
    dos,
    donts,
    brand_handle: handle.trim().replace(/^@/, '') || null,
    platforms,
    platform_rates: Object.fromEntries(
      Object.entries(effRates).map(([p, r]) => [
        p,
        { cpm: Number(r?.cpm) || 0, ...(r?.minPayout ? { minPayout: Number(r.minPayout) } : {}), ...(r?.maxCap ? { maxCap: Number(r.maxCap) } : {}) },
      ])
    ),
    cpm_rate: Math.max(0.01, Math.min(...cpms.map((v) => (v > 0 ? v : 1.5)))),
    max_payout_per_clip: null,
  };

  const preview = normCampaign({
    ...draft,
    id: 'preview',
    brand_id: profile?.id,
    escrow_budget: budgetNum,
    remaining_budget: budgetNum,
    views_delivered: 0,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  });

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      setCreatedId(await createCampaign(draft));
    } catch (e) {
      setError(errText(e));
    } finally {
      setCreating(false);
    }
  };

  const onCover = async (f?: File) => {
    setCoverErr(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) return setCoverErr(t('create.coverType'));
    try {
      setCover(await toCover(f));
    } catch {
      setCoverErr(t('create.coverType'));
    }
  };

  if (!profile) return null;

  const steps = [t('create.s1'), t('create.s2'), t('create.s3'), t('create.s4')];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1.5 text-sm text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]">
        <ArrowLeft className="size-4" /> {t('shell.myCampaigns')}
      </Link>
      <PageHeader eyebrow={t('shell.brandStudio')} title={t('create.title')} subtitle={t('create.subtitle')} />

      {/* steps */}
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const n = (i + 1) as Step;
          const done = n < step || !!createdId;
          return (
            <li key={s}>
              <button
                type="button"
                disabled={!!createdId || n > step}
                onClick={() => go(n)}
                className={`w-full border-t-2 pt-3 text-left transition-colors disabled:cursor-default cursor-pointer ${
                  n === step && !createdId ? 'border-[var(--pi-ink-strong)]' : done ? 'border-[var(--pi-ink)]' : 'border-[var(--pi-line-strong)]'
                }`}
              >
                <span className="block text-xs tabular-nums text-[var(--pi-muted)]">{String(n).padStart(2, '0')}</span>
                <span className={`hidden text-sm tracking-tight sm:block! ${n === step ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-ink)]'}`}>{s}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12!">
        <div className="space-y-8 lg:col-span-7!">
          {/* ---------- 1 · basics ---------- */}
          {step === 1 && (
            <>
              <Field label={t('create.name')} error={tried ? errs.title : null}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('create.namePh')} className={inputCls} maxLength={90} />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2!">
                <Field label={t('create.brand')} error={tried ? errs.brand : null}>
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder={profile.brand_name || profile.full_name || ''} className={inputCls} />
                </Field>
                <Field label={t('create.category')}>
                  <Select value={category} onChange={setCategory} ariaLabel={t('create.category')} options={CATEGORIES.map((k) => ({ value: k, label: t(`create.cat.${k}`) }))} />
                </Field>
              </div>
              <Field label={t('create.who')} hint={minLevel === 'all' ? t('create.whoHintAll') : t('create.whoHint')}>
                <Segmented
                  value={minLevel}
                  onChange={setMinLevel}
                  items={(['all', 'silver', 'gold', 'platinum'] as const).map((l) => ({
                    id: l,
                    label: l === 'all' ? t('create.who_all') : (
                      <span className="inline-flex items-center gap-1">
                        <LevelMedal level={l} className="size-4" /> {t(`create.who_${l}`)}
                      </span>
                    ),
                  }))}
                />
              </Field>
              <div>
                <span className="text-[13px] text-[var(--pi-muted)]">{t('camp.platforms')}</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => {
                    const on = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`pi-notch flex h-12 items-center justify-center gap-2 text-sm transition-colors cursor-pointer ${
                          on ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'bg-[var(--pi-line)] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]'
                        }`}
                      >
                        <PlatformIcon platform={p} /> <span className="hidden sm:inline!">{PLATFORM_NAME[p]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="text-[13px] text-[var(--pi-muted)]">{t('create.cover')}</span>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    onCover(e.dataTransfer.files?.[0]);
                  }}
                  className="mt-2"
                >
                  {cover ? (
                    <div className="pi-notch relative aspect-video overflow-hidden">
                      <img src={cover} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCover(null)}
                        className="pi-notch absolute right-3 top-3 flex size-9 items-center justify-center bg-black/60 text-white backdrop-blur cursor-pointer"
                        aria-label={t('create.removeCover')}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="pi-notch flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[var(--pi-line)] text-sm text-[var(--pi-ink)] transition-colors hover:text-[var(--pi-ink-strong)] cursor-pointer"
                    >
                      <ImagePlus className="size-6" strokeWidth={1.4} />
                      {t('create.coverCta')}
                      <span className="text-xs text-[var(--pi-muted)]">{t('create.coverHint')}</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onCover(e.target.files?.[0])} />
                  {coverErr && <p className="mt-2 text-xs text-rose-600">{coverErr}</p>}
                </div>
              </div>
            </>
          )}

          {/* ---------- 2 · brief ---------- */}
          {step === 2 && (
            <>
              <Field label={t('create.description')} hint={t('create.descriptionHint')}>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={boxInputCls} maxLength={1500} />
              </Field>
              <Field label={t('create.drive')} hint={t('create.driveHint')} error={tried ? errs.drive : null}>
                <input type="url" value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="https://drive.google.com/drive/folders/…" className={inputCls} />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2!">
                <Field label={t('camp.tagAccount')}>
                  <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourbrand" className={inputCls} />
                </Field>
                <Field label={t('camp.hashtags')}>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#yourbrand #clips" className={inputCls} />
                </Field>
              </div>
              <RulePicker
                title={t('camp.dos')}
                presets={DO_KEYS.map((k) => t(`create.${k}`))}
                list={dos}
                onToggle={(x) => toggle(dos, setDos, x)}
                custom={customDo}
                setCustom={setCustomDo}
                onAdd={() => {
                  if (customDo.trim()) setDos([...dos, customDo.trim()]);
                  setCustomDo('');
                }}
                t={t}
              />
              <RulePicker
                title={t('camp.donts')}
                presets={DONT_KEYS.map((k) => t(`create.${k}`))}
                list={donts}
                onToggle={(x) => toggle(donts, setDonts, x)}
                custom={customDont}
                setCustom={setCustomDont}
                onAdd={() => {
                  if (customDont.trim()) setDonts([...donts, customDont.trim()]);
                  setCustomDont('');
                }}
                t={t}
              />
            </>
          )}

          {/* ---------- 3 · rates ---------- */}
          {step === 3 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[15px] tracking-tight text-[var(--pi-ink-strong)]">{t('camp.rates')}</span>
                {platforms.length > 1 && (
                  <Segmented
                    value={sameRate}
                    onChange={setSameRate}
                    items={[
                      { id: 'same', label: t('create.sameRate') },
                      { id: 'each', label: t('create.eachRate') },
                    ]}
                  />
                )}
              </div>
              <div className="space-y-3">
                {(sameRate === 'same' ? (['tiktok'] as Platform[]) : platforms).map((p) => (
                  <div key={p} className="pi-notch bg-[var(--pi-line)] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-[var(--pi-ink-strong)]">
                      {sameRate === 'same' ? (
                        <>
                          {platforms.map((x) => (
                            <PlatformIcon key={x} platform={x} />
                          ))}
                          <span className="ml-1">{t('create.allPlatforms')}</span>
                        </>
                      ) : (
                        <>
                          <PlatformIcon platform={p} /> {PLATFORM_NAME[p]}
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <RateInput label={t('create.cpm')} value={rates[p].cpm} onChange={(v) => setRate(p, 'cpm', v)} />
                      <RateInput label={t('camp.minPayout')} value={rates[p].minPayout} onChange={(v) => setRate(p, 'minPayout', v)} />
                      <RateInput label={t('camp.maxPerClip')} value={rates[p].maxCap} onChange={(v) => setRate(p, 'maxCap', v)} />
                    </div>
                  </div>
                ))}
              </div>
              {tried && errs.rates && <p className="text-xs text-rose-600">{errs.rates}</p>}
              <p className="text-xs leading-relaxed text-[var(--pi-muted)]">{t('create.ratesHelp')}</p>

              <Field label={t('create.budget')} hint={t('create.budgetHint')} error={tried ? errs.budget : null}>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--pi-muted)]">$</span>
                  <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ''))} className={`${boxInputCls} pl-7 tabular-nums`} />
                </div>
              </Field>
              <div className="border-y border-[var(--pi-line)] py-5">
                <Label>{t('create.estimate')}</Label>
                <p className="mt-3 text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-none tracking-[-0.04em] tabular-nums text-[var(--pi-ink-strong)]">
                  ≈ {compact(estViews)} <span className="text-base tracking-normal text-[var(--pi-muted)]">{t('common.views')}</span>
                </p>
                <p className="mt-2 text-xs text-[var(--pi-muted)]">{t('create.estimateNote')}</p>
              </div>
            </>
          )}

          {/* ---------- 4 · review + fund ---------- */}
          {step === 4 && !createdId && (
            <>
              <dl className="divide-y divide-[var(--pi-line)] border-y border-[var(--pi-line)] text-sm">
                {[
                  [t('create.name'), draft.title],
                  [t('create.brand'), draft.brand_name],
                  [t('create.category'), t(`create.cat.${category}`)],
                  [t('create.who'), t(`create.who_${minLevel}`)],
                  [t('camp.platforms'), platforms.map((p) => PLATFORM_NAME[p]).join(', ')],
                  [t('create.cpm'), platforms.map((p) => `${PLATFORM_NAME[p]} ${usd(Number(effRates[p]?.cpm) || 0)}`).join(' · ')],
                  [t('create.budget'), usd(budgetNum)],
                  [t('create.drive'), draft.drive_url],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-3">
                    <dt className="shrink-0 text-[var(--pi-muted)]">{k}</dt>
                    <dd className="min-w-0 truncate text-right text-[var(--pi-ink-strong)]">{v}</dd>
                  </div>
                ))}
              </dl>
              <Notice>{t('create.reviewNote')}</Notice>
              {error && <Notice tone="red">{error}</Notice>}
            </>
          )}

          {step === 4 && createdId && (
            <div className="space-y-6">
              <Notice tone="green">{t('create.saved')}</Notice>
              <FundPanel campaignId={createdId} defaultAmount={budgetNum} onPaid={() => setTimeout(() => router.push(`/dashboard/campaigns/${createdId}`), 1200)} />
              <Btn variant="ghost" onClick={() => router.push(`/dashboard/campaigns/${createdId}`)}>
                {t('create.fundLater')}
              </Btn>
            </div>
          )}

          {/* nav */}
          {!createdId && (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--pi-line)] pt-6">
              <Btn variant="ghost" onClick={() => go((step - 1) as Step)} disabled={step === 1}>
                {t('common.back')}
              </Btn>
              {step < 4 ? (
                <Btn onClick={() => go((step + 1) as Step)}>{t('common.next')}</Btn>
              ) : (
                <Btn onClick={create} loading={creating} size="lg">
                  {t('create.createCta')}
                </Btn>
              )}
            </div>
          )}
        </div>

        {/* live preview */}
        <aside className="lg:col-span-5!">
          <div className="space-y-3 lg:sticky! lg:top-24!">
            <Label>{t('create.preview')}</Label>
            <div className="pointer-events-none max-w-[320px]">
              <DiscoverCard interactive={false} c={{ ...preview, title: preview.title || t('create.namePh'), brand_name: brand || '—', description: draft.description }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="block truncate text-xs text-[var(--pi-muted)]">{label}</span>
      <div className="relative mt-1">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-[var(--pi-muted)]">$</span>
        <input
          inputMode="decimal"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
          className={`${inputCls} pl-3 tabular-nums`}
          placeholder="—"
        />
      </div>
    </label>
  );
}

function RulePicker({
  title,
  presets,
  list,
  onToggle,
  custom,
  setCustom,
  onAdd,
  t,
}: {
  title: string;
  presets: string[];
  list: string[];
  onToggle: (x: string) => void;
  custom: string;
  setCustom: (v: string) => void;
  onAdd: () => void;
  t: T;
}) {
  const extra = list.filter((x) => !presets.includes(x));
  return (
    <div>
      <span className="text-[13px] text-[var(--pi-muted)]">{title}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {[...presets, ...extra].map((x) => {
          const on = list.includes(x);
          return (
            <button
              key={x}
              type="button"
              onClick={() => onToggle(x)}
              className={`pi-notch inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5 text-left text-[13px] leading-snug transition-colors cursor-pointer ${
                on ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'bg-[var(--pi-line)] text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]'
              }`}
            >
              {on ? <Check className="size-3.5 shrink-0" /> : <Plus className="size-3.5 shrink-0" />}
              {x}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={t('create.addRule')}
          className={inputCls}
          maxLength={140}
        />
        <Btn variant="outline" size="sm" onClick={onAdd} disabled={!custom.trim()}>
          {t('create.add')}
        </Btn>
      </div>
    </div>
  );
}
