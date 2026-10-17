'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowUp, ChevronDown, Headphones, RefreshCw, Search, ShieldCheck, Users, X } from '@/components/icons';
import { EmptyChat } from '@/components/illustrations';
import { useLanguage } from '@/context/LanguageContext';
import { useMessenger, looksLikeContact, type Conversation, type Message, type Person } from '@/lib/supabase/messenger';

type Filter = 'all' | 'direct' | 'rooms' | 'support';
type T = (k: string) => string;

const locale = (lang: string) => (lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US');
const hhmm = (iso: string, lang: string) => new Date(iso).toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' });
const listTime = (iso: string, lang: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return hhmm(iso, lang);
  if ((now.getTime() - d.getTime()) / 86400000 < 7) return d.toLocaleDateString(locale(lang), { weekday: 'short' });
  return d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short' });
};
const dayPill = (iso: string, lang: string, t: T) => {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return t('msg.today');
  if (d.toDateString() === y.toDateString()) return t('msg.yesterday');
  return d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
};

/* Telegram-style avatar: photo, or initials on a gradient picked from the name */
const GRADS = [
  ['#ff885e', '#ff516a'], ['#ffcd6a', '#ffa85c'], ['#82b1ff', '#665fff'], ['#a0de7e', '#54cb68'],
  ['#53edd6', '#28c9b7'], ['#72d5fd', '#2a9ef1'], ['#e0a2f3', '#d669ed'],
];
const gradFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADS[Math.abs(h) % GRADS.length];
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

function Avatar({ name, src, seed, size = 44, icon: Icon, online }: { name: string; src?: string | null; seed: string; size?: number; icon?: React.ElementType; online?: boolean }) {
  const [a, b] = gradFor(seed);
  const [broken, setBroken] = useState(false);
  const photo = src && !broken ? src : null;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex size-full items-center justify-center overflow-hidden rounded-full font-semibold text-white"
        style={{ background: photo ? undefined : `linear-gradient(160deg, ${a}, ${b})`, fontSize: size * 0.36 }}
      >
        {photo ? <img src={photo} alt="" onError={() => setBroken(true)} className="size-full object-cover" /> : Icon ? <Icon className="size-[46%]" strokeWidth={1.8} duotone={false} /> : initials(name)}
      </span>
      {online && <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-[var(--pi-surface)]" />}
    </span>
  );
}

const iconFor = (type: Conversation['type']) => (type === 'campaign_room' ? Users : type === 'support' ? Headphones : type === 'staff' ? ShieldCheck : undefined);

/* read ticks */
const Ticks = ({ read, pending }: { read: boolean; pending?: boolean }) =>
  pending ? (
    <svg viewBox="0 0 16 16" className="size-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 18 12" className="h-3 w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m1 6.5 3.2 3.2L11 2.5" />
      {read && <path d="m7.4 9.4.3.3L14.6 2.5" />}
    </svg>
  );

export default function MessengerDrawer() {
  const { t, lang } = useLanguage();
  const m = useMessenger();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(0);
  const isStaff = m.me?.role === 'moderator' || m.me?.role === 'admin';

  const active = m.conversations.find((c) => c.id === m.activeId) || null;

  // Esc closes; lock page scroll while open
  useEffect(() => {
    if (!m.open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && m.setOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [m.open, m]);

  // open a chat → jump to the newest message
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setAtBottom(true);
    setNewBelow(0);
    lastCount.current = m.messages.length;
    if (m.activeId) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.activeId, m.open]);

  // new messages: follow if at the bottom (or if it's mine), otherwise count them
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const added = m.messages.length - lastCount.current;
    lastCount.current = m.messages.length;
    if (!el || added <= 0) return;
    const last = m.messages[m.messages.length - 1];
    if (atBottom || last?.sender_id === m.me?.id) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else setNewBelow((n) => n + added);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.messages.length]);

  // composer grows with its text
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return m.conversations.filter((c) => {
      if (filter === 'direct' && c.type !== 'direct') return false;
      if (filter === 'rooms' && c.type !== 'campaign_room') return false;
      if (filter === 'support' && c.type !== 'support' && c.type !== 'staff') return false;
      return !needle || `${c.name} ${c.last_message_text || ''}`.toLowerCase().includes(needle);
    });
  }, [m.conversations, filter, q]);

  if (!m.open) return null;

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await m.send(body);
    inputRef.current?.focus();
  };

  const typeLabel = (c: Conversation) =>
    c.type === 'campaign_room' ? t('msg.room') : c.type === 'support' ? t('msg.support') : c.type === 'staff' ? t('msg.staff') : t('msg.direct');

  const typingNames = m.typing.map((id) => m.people[id]?.full_name?.split(' ')[0] || t('msg.someone'));
  const status = (() => {
    if (!active) return '';
    if (typingNames.length) return active.type === 'direct' ? t('msg.typing') : `${typingNames.join(', ')} ${t('msg.typingMany')}`;
    if (active.type === 'direct') return m.online.includes(active.peerId || '') ? t('msg.online') : t('msg.direct');
    if (m.online.length) return `${typeLabel(active)} · ${t('msg.onlineN').replace('{n}', String(m.online.length + 1))}`;
    return typeLabel(active);
  })();

  return (
    <div className="pi fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={t('shell.messages')}>
      <button type="button" aria-label={t('common.close')} className="msg-backdrop absolute inset-0 cursor-default bg-black/40 backdrop-blur-[3px]" onClick={() => m.setOpen(false)} />

      <div className="msg-panel relative flex h-full w-full max-w-[980px] overflow-hidden bg-[var(--pi-surface)] shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.45)] sm:rounded-l-[22px]!">
        {/* ================= chat list ================= */}
        <aside className={`flex w-full shrink-0 flex-col border-r border-[var(--pi-line)] bg-[var(--pi-surface)] md:w-[340px]! ${active ? 'hidden md:flex!' : 'flex'}`}>
          <div className="flex items-center gap-3 px-4 pb-2 pt-4">
            <h2 className="flex-1 text-[22px] font-semibold tracking-[-0.02em] text-[var(--pi-ink-strong)]">{t('shell.messages')}</h2>
            <button type="button" onClick={() => m.setOpen(false)} aria-label={t('common.close')} className="flex size-9 items-center justify-center rounded-full text-[var(--pi-muted)] transition-colors hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)] cursor-pointer">
              <X className="size-5" strokeWidth={1.8} />
            </button>
          </div>
          <div className="px-4">
            <label className="flex h-10 items-center gap-2 rounded-full bg-[var(--pi-line)] px-3.5">
              <Search className="size-4 text-[var(--pi-muted)]" duotone={false} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('msg.search')} className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--pi-ink-strong)] placeholder:text-[var(--pi-muted)] outline-none" />
            </label>
            <div className="pi-hide-scroll -mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1">
              {(['all', 'direct', 'rooms', 'support'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors cursor-pointer ${
                    filter === f ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'text-[var(--pi-ink)] hover:bg-[var(--pi-line)]'
                  }`}
                >
                  {t(`msg.f_${f}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="pi-hide-scroll mt-1 flex-1 overflow-y-auto px-2 pb-3" data-lenis-prevent>
            {m.loading && !m.conversations.length ? (
              <div className="space-y-1 px-2 pt-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="size-12 animate-pulse rounded-full bg-[var(--pi-line)]" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-[var(--pi-line)]" />
                      <span className="block h-3 w-3/4 animate-pulse rounded bg-[var(--pi-line)]" />
                    </span>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <p className="px-3 py-6 text-sm font-light text-[var(--pi-muted)]">{t('msg.noChats')}</p>
            ) : (
              <ul>
                {list.map((c) => {
                  const unread = m.unread[c.id] || 0;
                  const on = c.id === m.activeId;
                  const mineLast = c.last_message_sender_id === m.me?.id;
                  const lastMsg = (m.messages.length && on ? m.messages[m.messages.length - 1] : null) as Message | null;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => m.setActiveId(c.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                          on ? 'bg-[#3390ec] text-white' : 'hover:bg-[var(--pi-line)]'
                        }`}
                      >
                        <Avatar name={c.name} src={c.avatar} seed={c.id} size={50} icon={iconFor(c.type)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={`truncate text-[15px] font-medium ${on ? '' : 'text-[var(--pi-ink-strong)]'}`}>{c.name}</span>
                            <span className={`flex shrink-0 items-center gap-1 text-[12px] ${on ? 'opacity-70' : 'text-[var(--pi-muted)]'}`}>
                              {mineLast && <Ticks read={lastMsg ? lastMsg.is_read : false} />}
                              {listTime(c.last_message_at, lang)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className={`truncate text-[14px] ${on ? 'opacity-75' : 'text-[var(--pi-muted)]'}`}>
                              {c.last_message_text ? (
                                <>
                                  {mineLast && <span className={on ? '' : 'text-[var(--pi-ink)]'}>{t('msg.you')}: </span>}
                                  {c.last_message_text}
                                </>
                              ) : (
                                typeLabel(c)
                              )}
                            </span>
                            {unread > 0 && (
                              <span className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${on ? 'bg-white text-[#3390ec]' : 'bg-[#3390ec] text-white'}`}>
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex gap-1.5 border-t border-[var(--pi-line)] p-2.5">
            <button type="button" onClick={m.openSupport} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--pi-ink)] transition-colors hover:bg-[var(--pi-line)] cursor-pointer">
              <Headphones className="size-4" strokeWidth={1.7} /> {t('msg.contactSupport')}
            </button>
            {isStaff && (
              <button type="button" onClick={m.openStaff} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--pi-ink)] transition-colors hover:bg-[var(--pi-line)] cursor-pointer">
                <ShieldCheck className="size-4" strokeWidth={1.7} /> {t('msg.staffRoom')}
              </button>
            )}
          </div>
        </aside>

        {/* ================= thread ================= */}
        <section className={`msg-wall relative min-w-0 flex-1 flex-col ${active ? 'flex' : 'hidden md:flex!'}`}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="w-52"><EmptyChat /></div>
              <p className="rounded-full bg-black/25 px-4 py-1.5 text-[13px] font-medium text-white backdrop-blur-md">{t('msg.pickTitle')}</p>
              <p className="max-w-sm text-[13px] text-[var(--pi-ink)]">{m.canColdDm ? t('msg.pickDesc') : t('msg.lockedDesc')}</p>
              {m.error && <p className="text-sm text-rose-600">{m.error}</p>}
            </div>
          ) : (
            <>
              <header className="relative z-10 flex items-center gap-3 border-b border-[var(--pi-line)] bg-[var(--pi-surface)]/90 px-3 py-2.5 backdrop-blur-xl md:px-4!">
                <button type="button" onClick={() => m.setActiveId(null)} className="flex size-9 items-center justify-center rounded-full text-[var(--pi-ink)] hover:bg-[var(--pi-line)] md:hidden! cursor-pointer" aria-label={t('common.back')}>
                  <ArrowLeft className="size-5" />
                </button>
                <Avatar name={active.name} src={active.avatar} seed={active.id} size={42} icon={iconFor(active.type)} online={active.type === 'direct' && m.online.includes(active.peerId || '')} />
                <div className="min-w-0 flex-1">
                  {active.type === 'direct' && active.peerId ? (
                    <Link href={`/dashboard/creators/${active.peerId}`} onClick={() => m.setOpen(false)} className="block truncate text-[15px] font-semibold text-[var(--pi-ink-strong)] hover:underline">
                      {active.name}
                    </Link>
                  ) : active.type === 'campaign_room' && active.campaign_id ? (
                    <Link href={`/dashboard/campaigns/${active.campaign_id}`} onClick={() => m.setOpen(false)} className="block truncate text-[15px] font-semibold text-[var(--pi-ink-strong)] hover:underline">
                      {active.name}
                    </Link>
                  ) : (
                    <span className="block truncate text-[15px] font-semibold text-[var(--pi-ink-strong)]">{active.name}</span>
                  )}
                  <span className={`block truncate text-[13px] ${typingNames.length || (active.type === 'direct' && m.online.includes(active.peerId || '')) ? 'text-[#3390ec]' : 'text-[var(--pi-muted)]'}`}>
                    {typingNames.length > 0 && <TypingDots />}
                    {status}
                  </span>
                </div>
                <button type="button" onClick={() => m.setOpen(false)} aria-label={t('common.close')} className="hidden size-9 items-center justify-center rounded-full text-[var(--pi-muted)] hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)] md:flex! cursor-pointer">
                  <X className="size-5" strokeWidth={1.8} />
                </button>
              </header>

              <div
                ref={scrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                  setAtBottom(bottom);
                  if (bottom) setNewBelow(0);
                }}
                className="pi-hide-scroll relative flex-1 overflow-y-auto px-2 py-3 md:px-6!"
                data-lenis-prevent
              >
                {m.messagesLoading ? (
                  <div className="space-y-2 px-2 pt-2">
                    {[52, 68, 40, 60].map((w, i) => (
                      <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
                        <span className="h-10 animate-pulse rounded-2xl bg-[var(--pi-surface)]/70" style={{ width: `${w}%` }} />
                      </div>
                    ))}
                  </div>
                ) : m.messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="max-w-xs rounded-2xl bg-black/25 px-4 py-2.5 text-center text-[13px] text-white backdrop-blur-md">
                      {active.type === 'support' ? t('msg.supportHello') : t('msg.empty')}
                    </p>
                  </div>
                ) : (
                  <Thread messages={m.messages} meId={m.me?.id || ''} people={m.people} group={active.type !== 'direct'} lang={lang} t={t} onRetry={m.retry} />
                )}
              </div>

              {!atBottom && (
                <button
                  type="button"
                  onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                  className="msg-fab absolute bottom-24 right-5 z-10 flex size-11 items-center justify-center rounded-full bg-[var(--pi-surface)] text-[var(--pi-ink)] shadow-[0_6px_20px_-6px_rgba(0,0,0,0.35)] cursor-pointer"
                  aria-label={t('msg.toBottom')}
                >
                  <ChevronDown className="size-5" />
                  {newBelow > 0 && (
                    <span className="absolute -top-1.5 left-1/2 flex h-5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full bg-[#3390ec] px-1.5 text-[11px] font-semibold text-white">
                      {newBelow}
                    </span>
                  )}
                </button>
              )}

              <footer className="relative z-10 px-2 pb-3 pt-1 md:px-6!">
                {looksLikeContact(text) && (
                  <p className="mx-auto mb-2 flex max-w-2xl items-start gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-800 backdrop-blur-md dark:text-amber-200!">
                    <AlertTriangle className="mt-px size-3.5 shrink-0" /> {t('msg.leakHint')}
                  </p>
                )}
                {m.error && <p className="mx-auto mb-2 max-w-2xl rounded-xl bg-rose-500/15 px-3 py-2 text-xs text-rose-700 dark:text-rose-200!">{m.error}</p>}
                <div className="mx-auto flex max-w-2xl items-end gap-2">
                  <div className="flex min-h-[48px] flex-1 items-end rounded-[24px] bg-[var(--pi-surface)] px-4 shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        if (e.target.value) m.pingTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submit();
                        }
                      }}
                      placeholder={t('msg.placeholder')}
                      maxLength={4000}
                      className="max-h-40 flex-1 resize-none bg-transparent py-3 text-[15px] leading-[22px] text-[var(--pi-ink-strong)] placeholder:text-[var(--pi-muted)] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!text.trim()}
                    aria-label={t('msg.send')}
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-[0_2px_8px_-2px_rgba(51,144,236,0.6)] transition-[transform,opacity,background-color] duration-200 cursor-pointer ${
                      text.trim() ? 'scale-100 bg-[#3390ec] hover:bg-[#2b82d9]' : 'scale-90 bg-[#3390ec]/50 opacity-70'
                    }`}
                  >
                    <ArrowUp className="size-5" strokeWidth={2.2} duotone={false} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="msg-typing mr-1.5 inline-flex translate-y-[-1px] items-end gap-[3px] align-middle" aria-hidden>
      <i /><i /><i />
    </span>
  );
}

function Thread({
  messages,
  meId,
  people,
  group,
  lang,
  t,
  onRetry,
}: {
  messages: Message[];
  meId: string;
  people: Record<string, Person>;
  group: boolean;
  lang: string;
  t: T;
  onRetry: (id: string) => void;
}) {
  return (
    <ol className="msg-thread mx-auto flex max-w-2xl flex-col">
      {messages.map((msg, i) => {
        const mine = msg.sender_id === meId;
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
        const sameAsPrev = !newDay && prev && prev.sender_id === msg.sender_id && Date.parse(msg.created_at) - Date.parse(prev.created_at) < 5 * 60000;
        const sameAsNext =
          next && next.sender_id === msg.sender_id && new Date(next.created_at).toDateString() === new Date(msg.created_at).toDateString() && Date.parse(next.created_at) - Date.parse(msg.created_at) < 5 * 60000;
        const sender = people[msg.sender_id];
        const name = sender?.full_name || t('msg.someone');
        const showName = group && !mine && !sameAsPrev;
        const showAvatar = group && !mine && !sameAsNext;
        const tail = !sameAsNext;
        return (
          <li key={msg.id} className={sameAsPrev ? 'mt-[3px]' : 'mt-2.5'}>
            {newDay && (
              <div className="sticky top-1 z-[1] my-3 flex justify-center">
                <span className="rounded-full bg-black/25 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-md">{dayPill(msg.created_at, lang, t)}</span>
              </div>
            )}
            <div className={`msg-in flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
              {group && !mine && (
                <span className="w-9 shrink-0">{showAvatar && <Avatar name={name} src={sender?.avatar_url} seed={msg.sender_id} size={36} />}</span>
              )}
              <div
                className={`msg-bubble relative max-w-[min(78%,520px)] px-3 pb-1.5 pt-[7px] text-[15px] leading-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.13)] ${
                  mine ? 'msg-mine text-[var(--msg-mine-fg)]' : 'msg-theirs text-[var(--pi-ink-strong)]'
                } ${tail ? (mine ? 'rounded-[18px] rounded-br-none' : 'rounded-[18px] rounded-bl-none') : 'rounded-[18px]'} ${msg.failed ? 'opacity-70' : ''}`}
              >
                {tail && <span aria-hidden className={`msg-tail ${mine ? 'msg-tail-mine' : 'msg-tail-theirs'}`} />}
                {showName && (
                  <span className="mb-0.5 block text-[13px] font-semibold" style={{ color: gradFor(msg.sender_id)[1] }}>
                    {name}
                  </span>
                )}
                <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                {/* time + ticks float at the end of the last line, like Telegram */}
                <span className="invisible inline-block w-[64px]" aria-hidden />
                <span className={`absolute bottom-1 right-2.5 flex items-center gap-1 text-[11px] ${mine ? 'text-[var(--msg-mine-meta)]' : 'text-[var(--pi-muted)]'}`}>
                  {hhmm(msg.created_at, lang)}
                  {mine && !msg.failed && <Ticks read={msg.is_read} pending={msg.pending} />}
                </span>
                {!mine && msg.has_leak_warning && (
                  <span className="mt-1 flex items-start gap-1 border-t border-black/10 pt-1 text-[12px] text-amber-700 dark:border-white/10! dark:text-amber-300!">
                    <AlertTriangle className="mt-px size-3 shrink-0" /> {t('msg.leakWarning')}
                  </span>
                )}
              </div>
            </div>
            {msg.failed && (
              <div className="mt-1 flex justify-end">
                <button type="button" onClick={() => onRetry(msg.id)} className="flex items-center gap-1 text-[12px] text-rose-600 hover:underline cursor-pointer">
                  <RefreshCw className="size-3" /> {t('msg.retry')}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
