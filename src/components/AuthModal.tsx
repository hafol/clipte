'use client';

import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, ArrowRight } from '@/components/icons';
import { GoogleColorIcon, DiscordColorIcon, ClipteLogoIcon } from '@/components/ui/SocialIcons';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useLanguage } from '@/context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title,
  subtitle,
}: AuthModalProps) {
  const { signInWithOAuth } = useUserProfile();
  const { t } = useLanguage();
  const [signingIn, setSigningIn] = useState<'google' | 'discord' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (provider: 'google' | 'discord') => {
    setSigningIn(provider);
    setError(null);
    const { error: err } = await signInWithOAuth(provider);
    if (err) {
      setError(t('auth.oauthNotConfigured').replace('{provider}', provider === 'google' ? 'Google' : 'Discord'));
      setSigningIn(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Liquid Glass Modal Box */}
      <div
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all animate-scaleUp z-10 overflow-hidden
          bg-white/95 dark:bg-[#0c0c0e]/95 
          border-black/10 dark:border-white/15 
          backdrop-blur-3xl"
        style={{
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-lg">
            <ClipteLogoIcon className="h-6 w-6" />
          </div>
        </div>

        {/* Modal Headings */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight font-display text-neutral-950 dark:text-white">
            {title || 'Join CLIPTE Network'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {subtitle || 'Sign in to track viral clip payouts and join exclusive brand campaigns.'}
          </p>
        </div>

        {/* Google OAuth Main Button */}
        <button
          type="button"
          onClick={() => handleLogin('google')}
          disabled={signingIn !== null}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer shadow-md
            bg-white dark:bg-neutral-900 
            text-neutral-900 dark:text-white 
            border border-neutral-300/80 dark:border-neutral-700 
            hover:border-neutral-400 dark:hover:border-neutral-500 
            hover:shadow-lg active:scale-[0.98] disabled:opacity-75"
        >
          {signingIn === 'google' ? (
            <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <GoogleColorIcon className="h-5 w-5" />
          )}
          <span>{t('auth.google')}</span>
        </button>

        {/* Discord OAuth */}
        <button
          type="button"
          onClick={() => handleLogin('discord')}
          disabled={signingIn !== null}
          className="mt-3 w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer shadow-md
            bg-[#5865F2] text-white hover:bg-[#4752c4] active:scale-[0.98] disabled:opacity-75"
        >
          {signingIn === 'discord' ? (
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <DiscordColorIcon className="h-5 w-5" />
          )}
          <span>{t('auth.discord')}</span>
        </button>

        {error && <p className="mt-3 text-center text-xs font-medium text-rose-500">{error}</p>}

        {/* Trust Badges */}
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Automatic view tracking & payout verification</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Secure 1-click sign-in with Google or Discord</span>
          </div>
        </div>

        {/* Terms footer */}
        <p className="text-[11px] text-center text-neutral-400 dark:text-neutral-500 mt-6">
          By continuing, you agree to CLIPTE's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
