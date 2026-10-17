'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Search, X } from '@/components/icons';
import { EmptyCampaigns } from '@/components/illustrations';
import { useLanguage } from '@/context/LanguageContext';
import { useLiveCampaigns, useSavedCampaigns, errText, topCpm, type Platform, type CampaignRow } from '@/lib/supabase/data';
import { useUserProfile } from '@/lib/supabase/hooks';
import { EmptyState, ErrorNote } from '@/components/dashboard/ui';
import { CardRow, DiscoverCard, FilterPill, HeroCarousel, SavedContext, platformOptions } from '@/components/dashboard/discover';
import { useToast } from '@/components/dashboard/forms';

// Discover marketplace (Content Rewards structure). Used by /dashboard/campaigns in clipper mode
// and by /dashboard/discover in any mode (brands browse the market and see their own campaign as clippers do).
/* ============================== Clipper: discover ============================== */

type Sort = 'new' | 'recommended' | 'popular' | 'rate' | 'budget' | 'ending';

export default function DiscoverView() {
  const { t } = useLanguage();
  const { data, loading, error, refresh } = useLiveCampaigns();
  const { profile } = useUserProfile();
  const saved = useSavedCampaigns(profile?.id);
  const { toast, toastNode } = useToast();
  const [onlySaved, setOnlySaved] = useState(false);
  const savedCtx = useMemo(
    () => ({
      isSaved: saved.isSaved,
      toggle: (id: string) =>
        saved
          .toggle(id)
          .then((now) => toast(now ? t('disc.saved') : t('disc.removed')))
          .catch((e) => toast(errText(e), 'red')),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saved.saved]
  );
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const live = useMemo(() => data.campaigns.filter((c) => c.remaining_budget > 0), [data.campaigns]);
  const stats = data.stats;
  const clippersOf = (c: CampaignRow) => stats[c.id]?.clippers ?? 0;

  const sorters: Record<Sort, (a: CampaignRow, b: CampaignRow) => number> = {
    new: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
    // rate × how much budget is still there to earn from
    recommended: (a, b) => topCpm(b) * Math.sqrt(b.remaining_budget) - topCpm(a) * Math.sqrt(a.remaining_budget),
    popular: (a, b) => clippersOf(b) - clippersOf(a) || b.views_delivered - a.views_delivered,
    rate: (a, b) => topCpm(b) - topCpm(a),
    budget: (a, b) => b.remaining_budget - a.remaining_budget,
    ending: (a, b) => a.remaining_budget / (a.escrow_budget || 1) - b.remaining_budget / (b.escrow_budget || 1),
  };
  const by = (s: Sort) => [...live].sort(sorters[s]);

  const categories = useMemo(() => [...new Set(live.map((c) => c.category).filter(Boolean) as string[])].sort(), [live]);
  const filtering = !!(q.trim() || platform || category || sort || onlySaved);
  const savedList = useMemo(() => saved.saved.map((id) => live.find((c) => c.id === id)).filter(Boolean) as CampaignRow[], [saved.saved, live]);
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = live.filter(
      (c) =>
        (!onlySaved || saved.isSaved(c.id)) &&
        (!platform || c.platforms.includes(platform)) &&
        (!category || c.category === category) &&
        (!needle || `${c.title} ${c.brand_name} ${c.category || ''} ${c.description || ''}`.toLowerCase().includes(needle))
    );
    return out.sort(sorters[sort || 'new']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, q, platform, category, sort, stats, onlySaved, saved.saved]);

  const featured = useMemo(() => [...live].sort((a, b) => Number(!!b.cover_url) - Number(!!a.cover_url) || sorters.recommended(a, b)).slice(0, 5), [live, stats]); // eslint-disable-line react-hooks/exhaustive-deps
  const showRows = !filtering && live.length >= 5;

  const clear = () => {
    setQ('');
    setPlatform(null);
    setCategory(null);
    setSort(null);
    setOnlySaved(false);
  };
  const seeAll = (s: Sort) => {
    setSort(s);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const sortOptions: { id: Sort; label: string }[] = [
    { id: 'new', label: t('disc.rowNew') },
    { id: 'recommended', label: t('disc.rowRecommended') },
    { id: 'popular', label: t('disc.rowPopular') },
    { id: 'rate', label: t('disc.sortRate') },
    { id: 'budget', label: t('disc.sortBudget') },
    { id: 'ending', label: t('disc.rowEnding') },
  ];

  return (
    <SavedContext.Provider value={savedCtx}>
    <div className="cr-page space-y-8">
      {toastNode}
      <header className="flex flex-col gap-1">
        <h1 className="text-[clamp(2rem,4.2vw,3.25rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]">{t('disc.heroTitle')}</h1>
        <p className="text-[15px] text-[var(--pi-muted)]">{t('disc.heroSub')}</p>
      </header>

      {error && <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />}

      {loading ? (
        <div className="@container space-y-8">
          <div className="aspect-[4/5] w-full animate-pulse rounded-[24px] bg-[var(--pi-line)] sm:aspect-[16/7]!" />
          <div className="grid grid-cols-1 gap-3 @min-[420px]:grid-cols-2! @min-[640px]:grid-cols-3! @min-[860px]:grid-cols-4!">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3.3] animate-pulse rounded-2xl bg-[var(--pi-line)]" />
            ))}
          </div>
        </div>
      ) : live.length === 0 ? (
        <EmptyState art={<EmptyCampaigns />} title={t('overview.c.noCampaigns')} desc={t('overview.c.noCampaignsDesc')} />
      ) : (
        <>
          {!filtering && <HeroCarousel campaigns={featured} />}

          {/* filter bar */}
          <div className="sticky top-16 z-30 -mx-4 flex flex-wrap items-center gap-2 bg-[var(--pi-bg)]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6! sm:px-6! lg:-mx-10! lg:px-10!">
            <label className="cr-outline-pill flex h-9 w-full min-w-0 items-center gap-2 rounded-full px-3 sm:w-auto! sm:flex-1! sm:max-w-xs!">
              <Search className="size-4 shrink-0 text-[var(--pi-muted)]" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('disc.search')}
                className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--pi-ink-strong)] placeholder:text-[var(--pi-muted)] outline-none"
              />
              <kbd className="hidden shrink-0 rounded-md border border-[var(--pi-line-strong)] px-1.5 text-[11px] text-[var(--pi-muted)] sm:inline!">⌘K</kbd>
            </label>
            <button
              type="button"
              onClick={clear}
              className={`flex h-9 items-center gap-1 rounded-full px-3 text-[14px] text-[var(--pi-ink)] transition-[opacity,transform] duration-200 hover:text-[var(--pi-ink-strong)] cursor-pointer ${
                filtering ? 'opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}
            >
              <X className="size-3.5" /> {t('disc.clear')}
            </button>
            {savedList.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlySaved((v) => !v)}
                aria-pressed={onlySaved}
                className={`cr-outline-pill flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] transition-colors cursor-pointer ${onlySaved ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-ink)]'}`}
                data-active={onlySaved}
              >
                <Bookmark className={`size-3.5 ${onlySaved ? '[&_.ci-fill]:opacity-100!' : ''}`} /> {t('disc.savedFilter')}
                <span className="tabular-nums text-[var(--pi-muted)]">{savedList.length}</span>
              </button>
            )}
            <FilterPill label={t('disc.platform')} value={platform} onChange={setPlatform} options={platformOptions()} />
            {categories.length > 0 && (
              <FilterPill label={t('disc.category')} value={category} onChange={setCategory} options={categories.map((c) => ({ id: c, label: c }))} />
            )}
            <FilterPill label={t('disc.sort')} value={sort} onChange={setSort} options={sortOptions} />
          </div>

          {!filtering && savedList.length > 0 && <CardRow title={t('disc.rowSaved')} campaigns={savedList} stats={stats} />}

          {showRows && (
            <div className="space-y-10">
              <CardRow title={t('disc.rowRecommended')} campaigns={by('recommended').slice(0, 12)} stats={stats} onSeeAll={() => seeAll('recommended')} />
              <CardRow title={t('disc.rowNew')} campaigns={by('new').slice(0, 12)} stats={stats} onSeeAll={() => seeAll('new')} />
              <CardRow title={t('disc.rowPopular')} campaigns={by('popular').slice(0, 12)} stats={stats} onSeeAll={() => seeAll('popular')} />
              <CardRow title={t('disc.rowEnding')} campaigns={by('ending').slice(0, 12)} stats={stats} onSeeAll={() => seeAll('ending')} />
            </div>
          )}

          <section ref={gridRef} className="@container relative scroll-mt-32 [&:has(.group\/card:hover)]:z-10" aria-label={t('disc.allCampaigns')}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--pi-ink-strong)] md:text-xl!">
                {filtering ? t('disc.results') : t('disc.allCampaigns')}
              </h2>
              <span className="text-[13px] tabular-nums text-[var(--pi-muted)]">{t('disc.count').replace('{n}', String(results.length))}</span>
            </div>
            {results.length === 0 ? (
              <EmptyState art={<EmptyCampaigns />} title={t('disc.noMatch')} desc={t('disc.noMatchDesc')} />
            ) : (
              <div className="grid grid-cols-1 gap-3 @min-[420px]:grid-cols-2! @min-[640px]:grid-cols-3! @min-[860px]:grid-cols-4!">
                {results.map((c, i) => (
                  <DiscoverCard key={c.id} c={c} stats={stats[c.id]} index={i} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
    </SavedContext.Provider>
  );
}
