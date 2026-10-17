'use client';

// Real-time messenger on Supabase (tables: conversations, direct_messages — schema v2.3+).
// One provider per dashboard: the header badge, the drawer and "Message" buttons share this state.
//
// Speed: messages live in a per-conversation cache. Right after the conversation list loads,
// the latest messages of the recent chats are prefetched in ONE query, so opening a chat is
// instant; the open chat is still refreshed quietly in the background every time it's opened.
// Presence ("online") and typing indicators use Supabase Realtime channels per conversation.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from './client';
import type { Profile } from './hooks';

export type ConvType = 'direct' | 'campaign_room' | 'support' | 'staff';

export interface Conversation {
  id: string;
  type: ConvType;
  campaign_id: string | null;
  participant_one: string | null;
  participant_two: string | null;
  title: string | null;
  last_message_text: string | null;
  last_message_sender_id: string | null;
  last_message_at: string;
  /** resolved for display */
  name: string;
  avatar: string | null;
  peerId: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  is_read: boolean;
  has_leak_warning: boolean;
  created_at: string;
  pending?: boolean;
  failed?: boolean;
}

export type Person = { id: string; full_name: string | null; avatar_url: string | null; role?: string | null };

/** Mirrors has_contact_leak() in the database, for the live hint while typing. */
export const looksLikeContact = (text: string) =>
  /(t\.me\/|wa\.me\/|telegram|whatsapp|discord\.gg\/|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\+?[0-9][0-9 ()-]{8,}[0-9])/i.test(text);

const MSG_COLS = 'id, conversation_id, sender_id, text, is_read, has_leak_warning, created_at';
const PREFETCH_CHATS = 20;
const PREFETCH_ROWS = 600;
const THREAD_ROWS = 200;

function chime(kind: 'send' | 'receive') {
  if (typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const [a, b] = kind === 'send' ? [587.33, 880] : [880, 1046.5];
    osc.frequency.setValueAtTime(a, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(b, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {}
}

const errMsg = (e: any) => String(e?.message || e || 'Something went wrong').replace(/^.*?exception:\s*/i, '');
const byTime = (a: Message, b: Message) => a.created_at.localeCompare(b.created_at);

/** Merge fresh rows into a cached thread (keeps pending/failed local messages). */
function mergeThread(prev: Message[] | undefined, fresh: Message[]) {
  const map = new Map<string, Message>();
  for (const m of prev || []) if (m.pending || m.failed) map.set(m.id, m);
  for (const m of fresh) map.set(m.id, m);
  // drop optimistic copies that the server already confirmed
  const confirmed = new Set(fresh.map((m) => `${m.sender_id}|${m.text}`));
  for (const [id, m] of map) if (m.pending && confirmed.has(`${m.sender_id}|${m.text}`)) map.delete(id);
  return [...map.values()].sort(byTime);
}

interface MessengerState {
  open: boolean;
  setOpen: (v: boolean) => void;
  conversations: Conversation[];
  loading: boolean;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  messages: Message[];
  /** true only when the open chat has never been loaded (no cache yet) */
  messagesLoading: boolean;
  people: Record<string, Person>;
  unread: Record<string, number>;
  totalUnread: number;
  error: string | null;
  send: (text: string) => Promise<boolean>;
  retry: (tempId: string) => Promise<void>;
  openDirect: (userId: string) => Promise<void>;
  openSupport: () => Promise<void>;
  openStaff: () => Promise<void>;
  openCampaignRoom: (campaignId: string) => Promise<void>;
  canColdDm: boolean;
  me: Profile | null;
  /** live: people online in the open chat, people typing there, and a typing ping */
  online: string[];
  typing: string[];
  pingTyping: () => void;
}

const Ctx = createContext<MessengerState | null>(null);

export function useMessenger() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMessenger must be used inside <MessengerProvider>');
  return v;
}

export function MessengerProvider({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const me = profile?.id || null;
  const isStaff = profile?.role === 'moderator' || profile?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Omit<Conversation, 'name' | 'avatar' | 'peerId'>[]>([]);
  const [campaignTitles, setCampaignTitles] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, Message[]>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);

  const activeRef = useRef<string | null>(null);
  const openRef = useRef(false);
  const peopleRef = useRef<Record<string, Person>>({});
  const roomChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastPing = useRef(0);
  activeRef.current = activeId;
  openRef.current = open;
  peopleRef.current = people;

  const loadPeople = useCallback(
    async (ids: (string | null | undefined)[]) => {
      const need = [...new Set(ids.filter((x): x is string => !!x))].filter((id) => !peopleRef.current[id]);
      if (!need.length) return;
      const { data } = await supabase.from('public_profiles').select('id, full_name, avatar_url, role').in('id', need);
      if (data) setPeople((p) => ({ ...p, ...Object.fromEntries(data.map((x: any) => [x.id, x])) }));
    },
    [supabase]
  );

  /** Fetch one thread and merge it into the cache. */
  const fetchThread = useCallback(
    async (convId: string) => {
      const { data, error: e } = await supabase
        .from('direct_messages')
        .select(MSG_COLS)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(THREAD_ROWS);
      if (e) {
        setError(errMsg(e));
        setCache((c) => (c[convId] ? c : { ...c, [convId]: [] }));
        return;
      }
      const fresh = ((data || []) as Message[]).reverse();
      setCache((c) => ({ ...c, [convId]: mergeThread(c[convId], fresh) }));
      loadPeople(fresh.map((m) => m.sender_id));
    },
    [supabase, loadPeople]
  );

  /** Prefetch the latest messages of the recent chats in a single request. */
  const prefetch = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      const { data } = await supabase
        .from('direct_messages')
        .select(MSG_COLS)
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })
        .limit(PREFETCH_ROWS);
      const grouped: Record<string, Message[]> = Object.fromEntries(ids.map((id) => [id, []]));
      for (const m of (data || []) as Message[]) grouped[m.conversation_id]?.push(m);
      setCache((c) => {
        const next = { ...c };
        for (const id of ids) next[id] = mergeThread(c[id], grouped[id].reverse());
        return next;
      });
      loadPeople(((data || []) as Message[]).map((m) => m.sender_id));
    },
    [supabase, loadPeople]
  );

  // Conversations I'm part of: directs, my support thread (all threads for staff), staff room,
  // and rooms of campaigns I own or clip for.
  const loadConversations = useCallback(async () => {
    if (!me) return;
    try {
      const [convs, myClips, mine, un] = await Promise.all([
        supabase.from('conversations').select('*').order('last_message_at', { ascending: false }).limit(300),
        supabase.from('clips').select('campaign_id').eq('user_id', me),
        supabase.from('campaigns').select('id').eq('brand_id', me),
        supabase.rpc('my_unread'),
      ]);
      if (convs.error) throw convs.error;
      const roomIds = new Set([...(myClips.data || []), ...(mine.data || [])].map((r: any) => r.campaign_id || r.id));
      const list = (convs.data || []).filter(
        (c: any) =>
          c.type === 'direct' ||
          c.type === 'support' ||
          (c.type === 'staff' && isStaff) ||
          (c.type === 'campaign_room' && (roomIds.has(c.campaign_id) || c.id === activeRef.current))
      );
      setRows(list);
      setUnread(Object.fromEntries((un.data || []).map((r: any) => [r.conversation_id, Number(r.unread) || 0])));
      prefetch(list.slice(0, PREFETCH_CHATS).map((c: any) => c.id));
      const campIds = list.filter((c: any) => c.type === 'campaign_room').map((c: any) => c.campaign_id);
      if (campIds.length) {
        const { data } = await supabase.from('campaigns').select('id, title').in('id', campIds);
        if (data) setCampaignTitles(Object.fromEntries(data.map((x: any) => [x.id, x.title])));
      }
      await loadPeople(list.flatMap((c: any) => [c.participant_one, c.participant_two]));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [me, isStaff, supabase, loadPeople, prefetch]);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // Resolve display names
  const conversations: Conversation[] = useMemo(
    () =>
      rows.map((c) => {
        let peerId: string | null = null;
        let name = c.title || '';
        if (c.type === 'direct') {
          peerId = c.participant_one === me ? c.participant_two : c.participant_one;
          name = people[peerId || '']?.full_name || 'Clipte user';
        } else if (c.type === 'support') {
          peerId = c.participant_one === me ? null : c.participant_one;
          name = peerId ? people[peerId]?.full_name || 'Clipte user' : 'Clipte Support';
        } else if (c.type === 'campaign_room') {
          name = campaignTitles[c.campaign_id || ''] || c.title || 'Campaign';
        } else if (c.type === 'staff') {
          name = 'Staff';
        }
        return { ...c, name, avatar: peerId ? people[peerId]?.avatar_url || null : null, peerId };
      }),
    [rows, people, campaignTitles, me]
  );

  const markRead = useCallback(
    async (convId: string) => {
      if (!me) return;
      setUnread((u) => (u[convId] ? { ...u, [convId]: 0 } : u));
      await supabase.from('direct_messages').update({ is_read: true }).eq('conversation_id', convId).neq('sender_id', me).eq('is_read', false);
    },
    [supabase, me]
  );

  /** Open a chat: show the cache instantly, refresh it in the background, mark it read. */
  const selectChat = useCallback(
    (id: string | null) => {
      setError(null);
      activeRef.current = id;
      setActiveIdState(id);
      if (!id) return;
      fetchThread(id);
      if (openRef.current) markRead(id);
    },
    [fetchThread, markRead]
  );

  useEffect(() => {
    if (open && activeId) markRead(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Realtime: every message I'm allowed to read arrives here (RLS filters the stream)
  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel(`messenger-${me}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const m = payload.new as Message;
        const mineMsg = m.sender_id === me;
        setRows((prev) => {
          const found = prev.find((c) => c.id === m.conversation_id);
          if (!found) {
            loadConversations(); // a new chat someone opened with me
            return prev;
          }
          const updated = { ...found, last_message_text: m.text.slice(0, 200), last_message_sender_id: m.sender_id, last_message_at: m.created_at };
          return [updated, ...prev.filter((c) => c.id !== m.conversation_id)];
        });
        setCache((c) => ({ ...c, [m.conversation_id]: mergeThread(c[m.conversation_id], [...(c[m.conversation_id] || []).filter((x) => !x.pending), m]) }));
        // the sender stops "typing" once the message lands
        setTyping((t) => t.filter((id) => id !== m.sender_id));
        if (m.conversation_id === activeRef.current && openRef.current) {
          if (!mineMsg) markRead(m.conversation_id);
        } else if (!mineMsg) {
          setUnread((u) => ({ ...u, [m.conversation_id]: (u[m.conversation_id] || 0) + 1 }));
        }
        if (!mineMsg) {
          loadPeople([m.sender_id]);
          chime('receive');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const m = payload.new as Message;
        setCache((c) =>
          c[m.conversation_id] ? { ...c, [m.conversation_id]: c[m.conversation_id].map((x) => (x.id === m.id ? { ...x, is_read: m.is_read } : x)) } : c
        );
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // Presence + typing for the open chat (only while the drawer is open)
  useEffect(() => {
    setOnline([]);
    setTyping([]);
    if (!me || !activeId || !open) return;
    const ch = supabase.channel(`room-${activeId}`, { config: { presence: { key: me }, broadcast: { self: false } } });
    ch.on('presence', { event: 'sync' }, () => {
      setOnline(Object.keys(ch.presenceState()).filter((id) => id !== me));
    })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const who = String(payload?.user || '');
        if (!who || who === me) return;
        setTyping((t) => (t.includes(who) ? t : [...t, who]));
        clearTimeout(typingTimers.current[who]);
        typingTimers.current[who] = setTimeout(() => setTyping((t) => t.filter((id) => id !== who)), 3500);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') ch.track({ at: Date.now() });
      });
    roomChannel.current = ch;
    return () => {
      roomChannel.current = null;
      supabase.removeChannel(ch);
    };
  }, [supabase, me, activeId, open]);

  const pingTyping = useCallback(() => {
    const now = Date.now();
    if (!roomChannel.current || now - lastPing.current < 2000) return;
    lastPing.current = now;
    roomChannel.current.send({ type: 'broadcast', event: 'typing', payload: { user: me } });
  }, [me]);

  const deliver = useCallback(
    async (conv: string, temp: Message) => {
      const { data, error: e } = await supabase.from('direct_messages').insert({ conversation_id: conv, text: temp.text }).select(MSG_COLS).single();
      if (e) {
        setCache((c) => ({ ...c, [conv]: (c[conv] || []).map((x) => (x.id === temp.id ? { ...x, pending: false, failed: true } : x)) }));
        setError(errMsg(e));
        return false;
      }
      setCache((c) => ({
        ...c,
        [conv]: mergeThread((c[conv] || []).filter((x) => x.id !== temp.id), [...(c[conv] || []).filter((x) => x.id !== temp.id && !x.pending), data as Message]),
      }));
      setError(null);
      return true;
    },
    [supabase]
  );

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      const conv = activeRef.current;
      if (!body || !conv || !me) return false;
      const temp: Message = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversation_id: conv,
        sender_id: me,
        text: body,
        is_read: false,
        has_leak_warning: looksLikeContact(body),
        created_at: new Date().toISOString(),
        pending: true,
      };
      setCache((c) => ({ ...c, [conv]: [...(c[conv] || []), temp] }));
      setRows((prev) => {
        const found = prev.find((c) => c.id === conv);
        if (!found) return prev;
        return [{ ...found, last_message_text: body.slice(0, 200), last_message_sender_id: me, last_message_at: temp.created_at }, ...prev.filter((c) => c.id !== conv)];
      });
      chime('send');
      return deliver(conv, temp);
    },
    [me, deliver]
  );

  const retry = useCallback(
    async (tempId: string) => {
      const conv = activeRef.current;
      if (!conv) return;
      const msg = (cache[conv] || []).find((m) => m.id === tempId);
      if (!msg) return;
      setCache((c) => ({ ...c, [conv]: (c[conv] || []).map((x) => (x.id === tempId ? { ...x, failed: false, pending: true } : x)) }));
      await deliver(conv, msg);
    },
    [cache, deliver]
  );

  const openVia = useCallback(
    async (fn: string, args: Record<string, unknown> = {}) => {
      setOpen(true);
      setError(null);
      const { data, error: e } = await supabase.rpc(fn, args);
      if (e) {
        setError(errMsg(e));
        return;
      }
      selectChat(data as string);
      loadConversations();
    },
    [supabase, loadConversations, selectChat]
  );

  const value: MessengerState = {
    open,
    setOpen,
    conversations,
    loading,
    activeId,
    setActiveId: selectChat,
    messages: (activeId && cache[activeId]) || [],
    messagesLoading: !!activeId && !cache[activeId],
    people,
    unread,
    totalUnread: Object.values(unread).reduce((a, b) => a + b, 0),
    error,
    send,
    retry,
    openDirect: (userId) => openVia('start_direct', { p_other: userId }),
    openSupport: () => openVia('my_support_conversation'),
    openStaff: () => openVia('staff_room'),
    openCampaignRoom: (campaignId) => openVia('campaign_room', { p_campaign_id: campaignId }),
    canColdDm: !!profile && (isStaff || !!profile.has_brand_profile || profile.total_earnings >= 1),
    me: profile,
    online,
    typing,
    pingTyping,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
