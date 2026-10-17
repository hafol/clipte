'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Compass, Video, Wallet, Users, UserCheck, Target, PlusCircle, ShieldAlert, Sparkles,
  Bell, MessageSquare, PanelLeftClose, PanelLeft, LogOut, ChevronDown, User as UserIcon, Settings,
  Scissors, Tag,
} from '@/components/icons';
import { useLanguage } from '@/context/LanguageContext';
import { useUserProfile } from '@/lib/supabase/hooks';
import { ClipteLogo, NotchButton } from '@/components/pi';
import { LangSwitch } from '@/components/OfficialNavbar';
import ThemeToggle from '@/components/ThemeToggle';
import MessengerDrawer from '@/components/messenger/MessengerDrawer';
import NotificationsBell from '@/components/dashboard/NotificationsBell';
import { MessengerProvider, useMessenger } from '@/lib/supabase/messenger';
import { money } from '@/lib/money';

type NavItem = { label: string; href: string; icon: React.ElementType; exact?: boolean };

/** $ / ₸ display switch (payments stay in USD). The tooltip names today's rate and its source. */
function CurrencySwitch() {
  const { currency, setCurrency, fx, t } = useLanguage();
  if (!fx.rate) return null;
  const tip = t('shell.fxTip').replace('{rate}', fx.rate.toLocaleString('ru-RU', { maximumFractionDigits: 2 })).replace('{source}', fx.source === 'nationalbank.kz' ? t('shell.fxNbk') : fx.source || '');
  return (
    <div role="group" aria-label={t('shell.currency')} title={tip} className="pi-notch pi-glass flex h-12 items-center gap-0.5 px-1.5 text-xs text-[var(--pi-ink-strong)]">
      {(['USD', 'KZT'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          aria-pressed={currency === c}
          className={`h-8 min-w-8 px-2 text-[13px] transition-[opacity,background-color] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pi-ink-strong)]/40 ${
            currency === c ? 'pi-notch pi-glass-chip' : 'opacity-55 hover:opacity-100'
          }`}
        >
          {c === 'USD' ? '$' : '₸'}
        </button>
      ))}
    </div>
  );
}

/** Dashboard frame in the landing design system: glass header, hairline sidebar, mobile dock. */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { t } = useLanguage();
  const { profile, loading, signOut, setActiveMode } = useUserProfile();

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const mode = profile?.active_mode || 'clipper';
  const isStaff = profile?.role === 'moderator' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  // Sidebar state + Ctrl/⌘+B, outside clicks for popovers
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('clipte_sidebar_collapsed') === 'true');
    } catch {}
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const toggleSidebar = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem('clipte_sidebar_collapsed', String(!prev));
      } catch {}
      return !prev;
    });

  const clipperNav: NavItem[] = [
    { label: t('shell.overview'), href: '/dashboard', icon: LayoutGrid, exact: true },
    { label: t('shell.discover'), href: '/dashboard/campaigns', icon: Compass },
    { label: t('shell.clips'), href: '/dashboard/clips', icon: Video },
    { label: t('shell.payments'), href: '/dashboard/payments', icon: Wallet },
    { label: t('shell.accounts'), href: '/dashboard/accounts', icon: UserCheck },
    { label: t('shell.teams'), href: '/dashboard/teams', icon: Users },
  ];
  const brandNav: NavItem[] = [
    { label: t('shell.overview'), href: '/dashboard', icon: LayoutGrid, exact: true },
    { label: t('shell.myCampaigns'), href: '/dashboard/campaigns', icon: Target, exact: true },
    { label: t('shell.discover'), href: '/dashboard/discover', icon: Compass },
    { label: t('shell.newCampaign'), href: '/dashboard/campaigns/create', icon: PlusCircle },
    { label: t('shell.escrow'), href: '/dashboard/payments', icon: Wallet },
  ];
  const staffNav: NavItem[] = [
    ...(isStaff ? [{ label: t('shell.moderation'), href: '/dashboard/moderation', icon: ShieldAlert }] : []),
    ...(isAdmin ? [{ label: t('shell.admin'), href: '/dashboard/admin', icon: Sparkles }] : []),
  ];
  const mainNav = mode === 'brand' ? brandNav : clipperNav;
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const initial = (profile?.full_name || profile?.email || 'U').slice(0, 1).toUpperCase();
  const Avatar = ({ size = 'size-8' }: { size?: string }) =>
    profile?.avatar_url ? (
      <img src={profile.avatar_url} alt="" className={`${size} pi-notch object-cover`} />
    ) : (
      <span className={`${size} pi-notch flex items-center justify-center bg-[var(--pi-btn)] text-xs font-medium text-[var(--pi-btn-fg)]`}>{initial}</span>
    );

  const roleLabel = isAdmin ? t('shell.roleAdmin') : profile?.role === 'moderator' ? t('shell.roleModerator') : mode === 'brand' ? t('shell.brand') : t('shell.clipper');

  // ---------- signed-out / loading ----------
  if (loading || !profile) {
    return (
      <div className="pi flex min-h-screen flex-col items-center justify-center px-6 text-center antialiased">
        <ClipteLogo size="lg" className="text-[var(--pi-ink-strong)]" />
        {loading ? (
          <p className="mt-8 text-sm text-[var(--pi-muted)]">{t('shell.loading')}</p>
        ) : (
          <>
            <h1 className="mt-10 text-[clamp(2rem,4vw,3rem)] font-light leading-[0.95] tracking-[-0.05em] text-[var(--pi-ink-strong)]">{t('shell.gateTitle')}</h1>
            <p className="mt-4 max-w-sm text-base font-light text-[var(--pi-ink)]">{t('shell.gateDesc')}</p>
            <div className="mt-8">
              <NotchButton href={`/register?next=${encodeURIComponent(pathname)}`} size="lg">
                {t('shell.gateCta')}
              </NotchButton>
            </div>
          </>
        )}
      </div>
    );
  }

  const iconBtn =
    'pi-notch relative flex size-10 items-center justify-center text-[var(--pi-ink)] transition-colors hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)] cursor-pointer';

  return (
    <MessengerProvider profile={profile}>
    <div className="pi flex min-h-screen flex-col antialiased">
      {/* ================= Header ================= */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[var(--pi-line)] bg-[var(--pi-bg)]/85 px-4 backdrop-blur-xl md:px-6!">
        <div className="flex min-w-0 items-center gap-4 md:gap-6!">
          <Link href="/" aria-label="CLIPTE Home" className="shrink-0 text-[var(--pi-ink-strong)] transition-opacity hover:opacity-70">
            <ClipteLogo />
          </Link>

          {/* Clipper / Brand mode */}
          <div className="pi-notch flex h-9 items-center gap-0.5 bg-[var(--pi-line)] p-1 text-[12px] sm:h-10! sm:text-[13px]!" role="tablist" aria-label="Mode">
            {(['clipper', 'brand'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setActiveMode(m)}
                className={`pi-notch flex h-full items-center gap-1.5 px-2.5 tracking-tight sm:px-3! transition-colors cursor-pointer ${
                  mode === m ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]'
                }`}
              >
                {m === 'clipper' ? <Scissors className="size-4" /> : <Tag className="size-4" />}
                {t(m === 'clipper' ? 'shell.clipper' : 'shell.brand')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Balance */}
          <Link
            href="/dashboard/payments"
            className="pi-notch pi-edge hidden h-10 items-center gap-2 bg-[var(--pi-surface)] px-3.5 text-[13px] tabular-nums text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-bg)] sm:flex!"
          >
            <span className="text-[var(--pi-muted)]">{mode === 'brand' ? t('shell.escrowBalance') : t('shell.balance')}</span>
            {money(mode === 'brand' ? profile.balance_escrow : profile.balance_earnings)}
          </Link>

          {/* Notifications */}
          <NotificationsBell userId={profile.id} />

          <MessagesButton className={`${iconBtn} hidden sm:flex!`} label={t('shell.messages')} />

          <div className="hidden md:block!">
            <CurrencySwitch />
          </div>
          <div className="hidden md:block!">
            <LangSwitch />
          </div>
          <div className="hidden md:block!">
            <ThemeToggle />
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="pi-notch flex h-10 items-center gap-2 pl-1 pr-2 transition-colors hover:bg-[var(--pi-line)] cursor-pointer"
              aria-expanded={menuOpen}
            >
              <Avatar />
              <span className="hidden flex-col text-left leading-tight lg:flex!">
                <span className="max-w-[120px] truncate text-[13px] text-[var(--pi-ink-strong)]">{profile.full_name || profile.email}</span>
                <span className="text-[11px] text-[var(--pi-muted)]">{roleLabel}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-[var(--pi-muted)] lg:block!" />
            </button>
            {menuOpen && (
              <div className="pi-notch pi-edge absolute right-0 top-12 z-50 w-64 bg-[var(--pi-surface)] p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
                <div className="border-b border-[var(--pi-line)] px-3 py-2.5">
                  <p className="truncate text-sm text-[var(--pi-ink-strong)]">{profile.full_name || '—'}</p>
                  <p className="truncate text-xs text-[var(--pi-muted)]">{profile.email}</p>
                </div>
                {[
                  { href: `/dashboard/creators/${profile.id}`, icon: UserIcon, label: t('shell.publicProfile') },
                  { href: '/dashboard/accounts', icon: Settings, label: t('shell.settings') },
                  { href: '/dashboard/payments', icon: Wallet, label: t('shell.ledger') },
                  ...(isAdmin ? [{ href: '/dashboard/admin', icon: Sparkles, label: t('shell.admin') }] : []),
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--pi-ink)] transition-colors hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)]"
                  >
                    <l.icon className="size-4" strokeWidth={1.6} />
                    {l.label}
                  </Link>
                ))}
                <div className="mt-1 border-t border-[var(--pi-line)] pt-1 sm:hidden!">
                  <MobileMessagesItem label={t('shell.messages')} onDone={() => setMenuOpen(false)} />
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-[var(--pi-muted)]">{mode === 'brand' ? t('shell.escrowBalance') : t('shell.balance')}</span>
                    <span className="tabular-nums text-[var(--pi-ink-strong)]">{money(mode === 'brand' ? profile.balance_escrow : profile.balance_earnings)}</span>
                  </div>
                </div>
                <div className="mt-1 border-t border-[var(--pi-line)] pt-1 md:hidden!">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2">
                    <CurrencySwitch />
                    <LangSwitch />
                    <ThemeToggle />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 flex w-full items-center gap-2.5 border-t border-[var(--pi-line)] px-3 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-500/10 cursor-pointer"
                >
                  <LogOut className="size-4" strokeWidth={1.6} />
                  {t('shell.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-w-0 flex-1">
        {/* ================= Sidebar ================= */}
        <aside
          className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col justify-between border-r border-[var(--pi-line)] px-3 py-4 transition-[width] duration-300 lg:flex! ${
            collapsed ? 'w-[72px]' : 'w-60'
          }`}
        >
          <nav className="space-y-6">
            <div>
              <div className={`mb-2 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
                {!collapsed && (
                  <span className="text-xs text-[var(--pi-muted)]">({mode === 'brand' ? t('shell.brandStudio') : t('shell.clipperStudio')})</span>
                )}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title={collapsed ? t('shell.expand') : t('shell.collapse')}
                  className="p-1.5 text-[var(--pi-muted)] transition-colors hover:text-[var(--pi-ink-strong)] cursor-pointer"
                >
                  {collapsed ? <PanelLeft className="size-4" strokeWidth={1.6} /> : <PanelLeftClose className="size-4" strokeWidth={1.6} />}
                </button>
              </div>
              <SideLinks items={mainNav} collapsed={collapsed} isActive={isActive} />
            </div>

            {staffNav.length > 0 && (
              <div className="border-t border-[var(--pi-line)] pt-4">
                {!collapsed && <span className="mb-2 block px-2 text-xs text-[var(--pi-muted)]">({t('shell.staff')})</span>}
                <SideLinks items={staffNav} collapsed={collapsed} isActive={isActive} />
              </div>
            )}
          </nav>

          <div className="border-t border-[var(--pi-line)] pt-3">
            <Link
              href={`/dashboard/creators/${profile.id}`}
              className={`flex items-center gap-2.5 p-1.5 transition-colors hover:bg-[var(--pi-line)] ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? profile.full_name || profile.email : undefined}
            >
              <Avatar size="size-8" />
              {!collapsed && (
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[13px] text-[var(--pi-ink-strong)]">{profile.full_name || profile.email}</span>
                  <span className="block text-[11px] text-[var(--pi-muted)]">{roleLabel}</span>
                </span>
              )}
            </Link>
          </div>
        </aside>

        {/* ================= Content ================= */}
        <main className="mx-auto w-full min-w-0 max-w-[1200px] flex-1 px-4 pb-28 pt-6 sm:px-6! lg:px-10! lg:pb-12! lg:pt-8!">{children}</main>
      </div>

      {/* ================= Mobile dock ================= */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[var(--pi-line)] bg-[var(--pi-bg)]/90 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur-xl lg:hidden!">
        {[...mainNav.slice(0, 5), ...staffNav.slice(0, 1)].map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 text-[10px] tracking-tight ${
                active ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-muted)]'
              }`}
            >
              <item.icon className="size-5" strokeWidth={active ? 2 : 1.5} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
              <span className={`h-0.5 w-4 rounded-full ${active ? 'bg-[var(--pi-ink-strong)]' : 'bg-transparent'}`} />
            </Link>
          );
        })}
      </nav>

      <MessengerDrawer />
    </div>
    </MessengerProvider>
  );
}

/** Header button with the live unread count. */
function MessagesButton({ className, label }: { className: string; label: string }) {
  const m = useMessenger();
  return (
    <button type="button" className={className} aria-label={label} onClick={() => m.setOpen(true)}>
      <MessageSquare className="size-[18px]" strokeWidth={1.6} />
      {m.totalUnread > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--pi-ink-strong)] px-1 text-[9px] font-bold leading-none text-[var(--pi-bg)] ring-2 ring-[var(--pi-bg)]">
          {m.totalUnread > 9 ? '9+' : m.totalUnread}
        </span>
      )}
    </button>
  );
}

function MobileMessagesItem({ label, onDone }: { label: string; onDone: () => void }) {
  const m = useMessenger();
  return (
    <button
      type="button"
      onClick={() => {
        onDone();
        m.setOpen(true);
      }}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--pi-ink)] transition-colors hover:bg-[var(--pi-line)] cursor-pointer"
    >
      <MessageSquare className="size-4" strokeWidth={1.6} />
      {label}
      {m.totalUnread > 0 && <span className="ml-auto rounded-full bg-[var(--pi-ink-strong)] px-1.5 text-[10px] text-[var(--pi-bg)]">{m.totalUnread}</span>}
    </button>
  );
}

function SideLinks({ items, collapsed, isActive }: { items: NavItem[]; collapsed: boolean; isActive: (i: NavItem) => boolean }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`pi-notch group flex items-center gap-3 text-[14px] tracking-tight transition-colors ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
              } ${active ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'text-[var(--pi-ink)] hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)]'}`}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={active ? 1.9 : 1.6} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
