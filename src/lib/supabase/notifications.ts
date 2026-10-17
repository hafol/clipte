'use client';

// Notifications are written by database triggers (schema v2.3); the browser only reads and marks them read.

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from './client';

export type NotificationKind =
  | 'new_clip'
  | 'clip_verified'
  | 'clip_rejected'
  | 'clip_flagged'
  | 'campaign_funded'
  | 'campaign_approved'
  | 'campaign_rejected'
  | 'campaign_completed'
  | 'payout_completed'
  | 'payout_failed'
  | 'account_verified';

export interface AppNotification {
  id: number;
  kind: NotificationKind;
  data: Record<string, any>;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('notifications').select('id, kind, data, link, is_read, created_at').order('created_at', { ascending: false }).limit(40);
    setItems((data as AppNotification[]) || []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setItems((prev) => [payload.new as AppNotification, ...prev].slice(0, 40));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, load]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  }, [supabase]);

  const markRead = useCallback(
    async (id: number) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    [supabase]
  );

  return { items, loading, unread: items.filter((n) => !n.is_read).length, markAllRead, markRead, refresh: load };
}
