'use client';
import { NotFound } from '@/components/illustrations';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, Pencil } from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useMessenger } from '@/lib/supabase/messenger';
import { usePublicCreator, setFollow, errText, creatorLevel, type Level } from '@/lib/supabase/data';
import { LevelBadge } from '@/components/dashboard/levels';
import { StatStrip, EmptyState, ErrorNote, SkeletonRows, Label, compact } from '@/components/dashboard/ui';
import { Btn, CopyButton, useToast } from '@/components/dashboard/forms';

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { profile: me } = useUserProfile();
  const { data, setData, loading, error, refresh } = usePublicCreator(id, me?.id);
  const [level, setLevel] = useState<Level | null>(null);
  useEffect(() => {
    if (id) creatorLevel(id).then(setLevel);
  }, [id]);
  const messenger = useMessenger();
  const { toast, toastNode } = useToast();
  const [busy, setBusy] = useState(false);

  if (!me) return null;
  if (loading && !data.profile) return <SkeletonRows rows={4} />;
  if (error) return <ErrorNote message={error} onRetry={refresh} retryLabel={t('overview.retry')} />;
  const p = data.profile;
  if (!p) return <EmptyState art={<NotFound />} title={t('creator.notFound')} desc={t('creator.notFoundDesc')} />;

  const isSelf = p.id === me.id;
  const name = p.full_name || t('creator.clipper');

  const toggleFollow = async () => {
    setBusy(true);
    const next = !data.following;
    try {
      await setFollow(me.id, p.id, next);
      setData({ ...data, following: next, stats: { ...data.stats, followers: data.stats.followers + (next ? 1 : -1) } });
    } catch (e) {
      toast(errText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      {toastNode}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]">
        <ArrowLeft className="size-4" /> {t('shell.overview')}
      </Link>

      <header className="flex flex-col gap-8 md:flex-row! md:items-end! md:justify-between!">
        <div className="flex items-end gap-5">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="pi-notch size-24 object-cover md:size-28!" />
          ) : (
            <span className="pi-notch flex size-24 items-center justify-center bg-[var(--pi-btn)] text-3xl font-light text-[var(--pi-btn-fg)] md:size-28!">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 pb-1">
            <Label>{p.role === 'admin' || p.role === 'moderator' ? t('creator.team') : p.has_brand_profile ? t('creator.brandAndClipper') : t('creator.clipper')}</Label>
            <h1 className="mt-2 truncate text-[clamp(2rem,4.4vw,3.5rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]">{name}</h1>
            {level && <LevelBadge level={level} className="mt-3" />}
            {p.brand_name && <p className="mt-2 text-sm text-[var(--pi-muted)]">{p.brand_name}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSelf ? (
            <Btn href="/dashboard/accounts#profile" variant="outline">
              <Pencil className="size-4" /> {t('creator.edit')}
            </Btn>
          ) : (
            <>
              <Btn onClick={toggleFollow} loading={busy} variant={data.following ? 'outline' : 'solid'}>
                {data.following ? t('creator.following') : t('creator.follow')}
              </Btn>
              <Btn
                variant="outline"
                onClick={() => messenger.openDirect(p.id)}
              >
                <MessageSquare className="size-4" /> {t('creator.message')}
              </Btn>
            </>
          )}
          <CopyButton value={typeof window !== 'undefined' ? window.location.href : ''} label={t('camp.copyLink')} copiedLabel={t('common.copied')} />
        </div>
      </header>

      <p className="max-w-2xl text-[15px] font-light leading-relaxed text-[var(--pi-ink)]">{p.bio || t('acc.noBio')}</p>

      <StatStrip
        items={[
          { label: t('creator.views'), value: compact(data.stats.views), hint: t('creator.viewsHint') },
          { label: t('creator.clips'), value: String(data.stats.clips), hint: t('creator.clipsHint').replace('{n}', String(data.stats.campaigns)) },
          { label: t('creator.followers'), value: compact(data.stats.followers) },
          { label: t('creator.followingCount'), value: compact(data.stats.following) },
        ]}
      />

    </div>
  );
}
