'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from '@/components/icons';
import { GoogleColorIcon, DiscordColorIcon } from '@/components/ui/SocialIcons';
import ClipteMark from '@/components/ui/ClipteMark';
import { useUserProfile } from '@/lib/supabase/hooks';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import { LangSwitch } from '@/components/OfficialNavbar';
import { ClipteLogo, Eyebrow, RevealWords } from '@/components/pi';
import { ROUTES } from '@/content/routes';

export default function AuthSplitPage() {
  const router = useRouter();
  const { profile, loading, signInWithOAuth, signInWithEmail, signUpWithEmail, resetPassword } = useUserProfile();
  const { t, lang } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ageOk, setAgeOk] = useState(false); // sign-up: 14+ (under 18 with guardian consent)

  const [next, setNext] = useState<string | null>(null); // where to return after sign-in (relative paths only)
  const [ref, setRef] = useState<string | null>(null); // referral code from an invite link

  // Returning from a failed OAuth / email link; invite and return-to params
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('auth_error')) setAuthError(t('auth.oauthFailed'));
    const n = q.get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) setNext(n);
    const r = (q.get('ref') || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    if (r) {
      setRef(r);
      setMode('signup');
    }
  }, [t]);

  // Signed in → go back where the user came from, or to the right dashboard (role comes from the database)
  useEffect(() => {
    if (!loading && profile) router.push(next || (profile.role === 'admin' ? '/dashboard/admin' : '/dashboard'));
  }, [profile, loading, router, next]);

  const needsAge = mode === 'signup' && !ageOk;

  const handleOAuth = async (provider: 'google' | 'discord') => {
    if (needsAge) {
      setAuthError(t('auth.ageRequired'));
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    const { error } = await signInWithOAuth(provider, next || undefined);
    if (error) {
      setAuthError(t('auth.oauthNotConfigured').replace('{provider}', provider === 'google' ? 'Google' : 'Discord'));
      setIsSubmitting(false);
    }
    // on success the browser is redirected to the provider
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setNotice(null);
    if (!email || password.length < 8) {
      setAuthError(t('auth.passwordTooShort'));
      return;
    }
    if (needsAge) {
      setAuthError(t('auth.ageRequired'));
      return;
    }
    setIsSubmitting(true);
    const { data, error } = mode === 'login' ? await signInWithEmail(email, password) : await signUpWithEmail(email, password, ref);
    setIsSubmitting(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    // Sign-up with email confirmation enabled returns no session yet
    if (mode === 'signup' && !data.session) setNotice(t('auth.checkEmail'));
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setNotice(null);
    if (!email) {
      setAuthError(t('auth.enterEmailFirst'));
      return;
    }
    const { error } = await resetPassword(email);
    if (error) setAuthError(error.message);
    else setNotice(t('auth.resetSent'));
  };

  const oauthBtn =
    'pi-notch pi-edge group flex h-11 w-full items-center justify-center gap-3 bg-[var(--pi-surface)] text-[15px] tracking-tight text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-bg)] disabled:opacity-60 cursor-pointer';
  const inputCls =
    'h-10 w-full border-0 border-b border-[var(--pi-line-strong)] bg-transparent px-0 text-base font-light tracking-tight text-[var(--pi-ink-strong)] placeholder:text-[var(--pi-muted)] outline-none transition-colors focus:border-[var(--pi-ink-strong)]';

  return (
    <div className="pi flex min-h-screen w-full flex-col antialiased lg:flex-row">
      {/* =================== LEFT: paper poster =================== */}
      <aside className="relative hidden overflow-hidden bg-[#efefed] lg:sticky! lg:top-0! lg:flex! lg:h-screen! lg:w-1/2! xl:w-[52%]!" aria-hidden="true">
        <div className="absolute inset-0">
          <Image src="/auth/paper.jpg" alt="" fill priority sizes="(min-width: 1024px) 52vw, 1px" className="object-cover" />
        </div>
        {/* soft vignette so the ink reads as printed on the sheet */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(0,0,0,0.08)_100%)]" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:px-14! xl:py-12! text-[#1f1f1f]">
          {/* top bar */}
          <div className="flex items-center justify-between">
            <Link href={ROUTES.home} className="mix-blend-multiply transition-opacity hover:opacity-70" aria-label="CLIPTE Home">
              <ClipteLogo />
            </Link>
            <span className="text-sm text-[#1f1f1f]/60">({t('auth.leftTag')})</span>
          </div>

          {/* printed mark + script */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center py-6">
            <ClipteMark className="h-[min(34vh,380px)] w-auto text-[#1f1f1f] mix-blend-multiply opacity-[0.92]" />
            <span className="font-script pointer-events-none absolute bottom-[6%] right-[2%] text-[clamp(4.5rem,8vw,8rem)] leading-none text-[#1f1f1f] mix-blend-multiply select-none">
              Clipte
            </span>
          </div>

          {/* statement */}
          <div>
            <RevealWords
              key={`auth-left-${lang}`}
              as="h2"
              text={t('auth.leftHeadline')}
              className="max-w-[18ch] text-[clamp(2rem,3.2vw,3.25rem)] font-light leading-[0.95] tracking-[-0.05em] text-[#1f1f1f]"
            />
            <p className="mt-5 max-w-md text-[17px] font-light leading-snug text-[#1f1f1f]/75">{t('auth.leftDesc')}</p>
            <div className="mt-8 flex items-center justify-between border-t border-[#1f1f1f]/15 pt-4 text-sm text-[#1f1f1f]/60">
              <span>TikTok · YouTube Shorts · Instagram Reels</span>
              <span>©{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =================== RIGHT: form =================== */}
      <main className="flex flex-1 flex-col px-6 py-5 md:px-12! lg:h-screen! lg:overflow-y-auto! lg:py-6!">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={ROUTES.home}
            className="group inline-flex items-center gap-2 text-sm text-[var(--pi-muted)] transition-colors hover:text-[var(--pi-ink-strong)]"
          >
            <svg className="size-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M15 8H1M7 2L1 8l6 6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="hidden sm:inline!">{t('auth.backHome')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-6">
          {/* mobile logo (the poster is hidden on small screens) */}
          <Link href={ROUTES.home} className="mb-6 text-[var(--pi-ink-strong)] lg:hidden!" aria-label="CLIPTE Home">
            <ClipteLogo size="lg" />
          </Link>

          <Eyebrow>{mode === 'login' ? t('auth.loginLink') : t('auth.signupLink')}</Eyebrow>
          <RevealWords
            key={`auth-title-${mode}-${lang}`}
            as="h1"
            text={mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
            className="mt-3 text-[clamp(2rem,3vw,2.75rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]"
            stagger={0.05}
          />
          {mode === 'login' && (
            <p className="mt-2.5 text-base font-light leading-snug text-[var(--pi-ink)]">{t('auth.loginSubtitle')}</p>
          )}

          {(authError || notice) && (
            <div
              role="status"
              className={`pi-notch mt-5 flex gap-3 px-4 py-3 text-sm leading-snug ${
                authError ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400!' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400!'
              }`}
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${authError ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {authError || notice}
            </div>
          )}

          {/* Age confirmation (sign-up only) */}
          {mode === 'signup' && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-snug text-[var(--pi-ink)]">
              <input
                type="checkbox"
                checked={ageOk}
                onChange={(e) => {
                  setAgeOk(e.target.checked);
                  setAuthError(null);
                }}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--pi-ink-strong)]"
              />
              <span>{t('auth.ageConfirm')}</span>
            </label>
          )}

          {/* OAuth */}
          <div className="mt-4 space-y-2">
            <button type="button" onClick={() => handleOAuth('google')} disabled={isSubmitting} className={oauthBtn}>
              <GoogleColorIcon className="size-5 shrink-0" />
              {t('auth.google')}
            </button>
            <button type="button" onClick={() => handleOAuth('discord')} disabled={isSubmitting} className={oauthBtn}>
              <DiscordColorIcon className="size-5 shrink-0" />
              {t('auth.discord')}
            </button>
          </div>

          {/* divider */}
          <div className="my-4 flex items-center gap-4 text-sm text-[var(--pi-muted)]">
            <span className="h-px flex-1 bg-[var(--pi-line-strong)]" />({t('auth.or').toLowerCase()})
            <span className="h-px flex-1 bg-[var(--pi-line-strong)]" />
          </div>

          {/* email + password */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            <label className="block">
              <span className="text-sm text-[var(--pi-muted)]">{t('auth.emailLabel')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className={inputCls}
              />
            </label>

            <div>
              <div className="flex items-center justify-between text-sm text-[var(--pi-muted)]">
                <label htmlFor="auth-password">{t('auth.passwordLabel')}</label>
                {mode === 'login' && (
                  <button type="button" onClick={handleForgotPassword} className="text-[var(--pi-ink)] underline-offset-4 hover:underline cursor-pointer">
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[var(--pi-muted)] transition-colors hover:text-[var(--pi-ink-strong)] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="pi-notch group mt-2 flex h-12 w-full items-center justify-center gap-2 bg-[var(--pi-btn)] text-sm uppercase tracking-[0.04em] text-[var(--pi-btn-fg)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  {mode === 'login' ? t('auth.continue') : t('auth.createAccount')}
                  <svg className="size-3 transition-transform group-hover:translate-x-1" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* mode switch */}
          <p className="mt-5 text-center text-sm text-[var(--pi-muted)]">
            {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setAuthError(null);
                setNotice(null);
              }}
              className="ml-1 text-[var(--pi-ink-strong)] underline underline-offset-4 cursor-pointer"
            >
              {mode === 'login' ? t('auth.signupLink') : t('auth.loginLink')}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-[var(--pi-muted)]">
          {t('auth.termsPrefix')}{' '}
          <Link href={ROUTES.legal('terms-of-service')} className="underline underline-offset-4 hover:text-[var(--pi-ink-strong)]">
            {t('landing.footer.links.legal.0')}
          </Link>{' '}
          &{' '}
          <Link href={ROUTES.legal('privacy-policy')} className="underline underline-offset-4 hover:text-[var(--pi-ink-strong)]">
            {t('landing.footer.links.legal.1')}
          </Link>
        </p>
      </main>
    </div>
  );
}
