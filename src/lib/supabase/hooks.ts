'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from './client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  role: 'clipper' | 'brand' | 'moderator' | 'admin';
  active_mode: 'clipper' | 'brand';
  balance_earnings: number;
  balance_escrow: number;
  payout_method: string | null;
  payout_address: string | null;
  total_earnings: number;
  bio?: string | null;
  referral_code?: string | null;
  has_brand_profile?: boolean;
  brand_name?: string | null;
  brand_logo_url?: string | null;
  brand_website?: string | null;
  brand_bio?: string | null;
  brand_industry?: string | null;
  is_suspended?: boolean;
  created_at?: string;
}

export type OAuthProvider = 'google' | 'discord';

const authRedirect = (next?: unknown) => {
  const target = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'; // ignore click events etc.
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=${encodeURIComponent(target)}`;
};

const toProfile = (row: any): Profile => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  avatar_url: row.avatar_url,
  role: row.role || 'clipper',
  active_mode: row.active_mode || 'clipper',
  balance_earnings: Number(row.balance_earnings) || 0,
  balance_escrow: Number(row.balance_escrow) || 0,
  payout_method: null,
  payout_address: null,
  total_earnings: Number(row.total_earnings) || 0,
  bio: row.bio ?? null,
  referral_code: row.referral_code ?? null,
  has_brand_profile: !!row.has_brand_profile,
  brand_name: row.brand_name ?? null,
  brand_logo_url: row.brand_logo_url ?? null,
  brand_website: row.brand_website ?? null,
  brand_bio: row.brand_bio ?? null,
  brand_industry: row.brand_industry ?? null,
  is_suspended: !!row.is_suspended,
  created_at: row.created_at,
});

// 1. Hook for the signed-in user (Supabase Auth only — no local/fake sessions).
// The role comes from the database (profiles.role); make someone admin with SQL:
//   update public.profiles set role = 'admin' where email = '…';
export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }
      // The profile row is created by a database trigger on sign-up; retry briefly in case it lags
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setProfile(toProfile(data));
          return;
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      setProfile(null);
    } catch (err) {
      console.error('Error loading profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Old builds kept a fake session here — clear it
    try {
      localStorage.removeItem('clipte_active_user');
    } catch {}

    loadProfile();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });
    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const setActiveMode = async (mode: 'clipper' | 'brand') => {
    if (!profile) return;
    setProfile({ ...profile, active_mode: mode });
    await supabase.from('profiles').update({ active_mode: mode }).eq('id', profile.id);
  };

  const signInWithOAuth = (provider: OAuthProvider, next?: unknown) =>
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: authRedirect(next) } });

  const signInWithGoogle = (next?: unknown) => signInWithOAuth('google', next);
  const signInWithDiscord = (next?: unknown) => signInWithOAuth('discord', next);

  const signInWithEmail = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });

  const signUpWithEmail = (email: string, password: string, referralCode?: string | null) =>
    supabase.auth.signUp({
      email,
      password,
      // records the sign-up age confirmation (14+, under 18 with guardian consent);
      // referral_code links the new profile to the inviter (see handle_new_user in schema.sql)
      options: {
        emailRedirectTo: authRedirect(),
        data: { age_confirmed_at: new Date().toISOString(), ...(referralCode ? { referral_code: referralCode } : {}) },
      },
    });

  const resetPassword = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirect('/dashboard') });

  return {
    profile,
    loading,
    refresh: loadProfile,
    signOut,
    setActiveMode,
    signInWithOAuth,
    signInWithGoogle,
    signInWithDiscord,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  };
}
