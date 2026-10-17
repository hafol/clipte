'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { ClipteLogo, NotchButton } from './pi';
import { ROUTES } from '@/content/routes';

type MenuKey = 'product' | 'blog' | null;

const PRODUCT_HREFS = [ROUTES.clip, ROUTES.brands, ROUTES.campaigns, ROUTES.enterprise];
const BLOG_HREFS = [
  ROUTES.guide('how-to-become-a-clipper'),
  ROUTES.guide('how-much-do-clippers-make'),
  ROUTES.guide('clipping-side-hustle'),
  ROUTES.blog,
];
const SOCIALS = [
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Discord', href: 'https://discord.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
];
const LANGS: { id: Language; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'РУС' },
  { id: 'kk', label: 'ҚАЗ' },
];

export function LangSwitch({ tone = 'glass' }: { tone?: 'glass' | 'panel' }) {
  const { lang, setLang } = useLanguage();

  // Menu panel (phones): full-width segmented control, white chip for the active language
  if (tone === 'panel') {
    return (
      <div
        role="group"
        className="pi-notch grid h-12 w-full grid-cols-3 gap-1 bg-white/[0.06] p-1 text-base font-medium leading-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      >
        {LANGS.map((opt) => {
          const active = lang === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLang(opt.id)}
              aria-pressed={active}
              className={`pi-notch flex h-full items-center justify-center tracking-[0.14em] transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${
                active ? 'bg-white text-[#1f1f1f]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="pi-notch pi-glass flex h-12 md:h-14! items-center gap-0.5 px-1.5 text-xs text-[var(--pi-ink-strong)]"
    >
      {LANGS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLang(opt.id)}
          aria-pressed={lang === opt.id}
          className={`h-8 md:h-9! px-2.5 tracking-[0.06em] transition-[opacity,background-color] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pi-ink-strong)]/40 ${
            lang === opt.id ? 'pi-notch pi-glass-chip' : 'opacity-55 hover:opacity-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h18M14 5l7 7-7 7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export default function OfficialNavbar() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<MenuKey>(null);
  const [expanded, setExpanded] = useState<MenuKey>(null);
  const { t, tr } = useLanguage();

  const productLinks = tr<string[]>('landing.nav.productLinks') ?? [];
  const blogLinks = tr<string[]>('landing.nav.blogLinks') ?? [];
  const cards = tr<{ tag: string; title: string; desc: string }[]>('landing.nav.cards') ?? [];

  // Lock scroll + close on Escape while the menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.__lenis?.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setHovered(null);
    setExpanded(null);
  };

  const items: { key: string; label: string; href?: string; sub?: MenuKey }[] = [
    { key: 'product', label: t('nav.product'), sub: 'product' },
    { key: 'blog', label: t('nav.blog'), sub: 'blog' },
    { key: 'contact', label: t('nav.contact'), href: ROUTES.contact },
    { key: 'dashboard', label: t('landing.nav.dashboard'), href: '/dashboard' },
  ];

  const subLinks = (key: MenuKey) =>
    key === 'product'
      ? productLinks.map((label, i) => ({ label, href: PRODUCT_HREFS[i] ?? '/dashboard' }))
      : key === 'blog'
      ? blogLinks.map((label, i) => ({ label, href: BLOG_HREFS[i] ?? '/dashboard' }))
      : [];

  return (
    <>
      {/* ================= Fixed minimal header ================= */}
      {/* Logo is its own fixed layer so mix-blend inverts against the page */}
      <a
        href="/"
        aria-label="CLIPTE Home"
        className="fixed left-6 md:left-12! top-6 md:top-8! z-50 flex h-12 md:h-14! items-center text-white mix-blend-difference transition-opacity hover:opacity-80"
      >
        <ClipteLogo />
      </a>
      <header className="pi fixed right-0 top-0 z-50 !bg-transparent pointer-events-none">
        <div className="flex items-start justify-end px-6 md:px-12! pt-6 md:pt-8!">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="hidden sm:block!">
              <LangSwitch />
            </div>
            <NotchButton href="/register" size="nav" motion="spring" variant="glass" className="hidden! sm:inline-flex!">
              {t('nav.getStarted')}
            </NotchButton>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('landing.nav.menu')}
              aria-expanded={open}
              className="pi-notch pi-glass group flex size-12 md:size-14! items-center justify-center text-[var(--pi-ink-strong)] transition-transform hover:scale-[1.04] cursor-pointer"
            >
              <span className="flex w-5 flex-col gap-[5px]">
                <span className="h-px w-full bg-current transition-transform duration-300 group-hover:translate-x-0.5" />
                <span className="h-px w-full bg-current transition-transform duration-300 group-hover:-translate-x-0.5" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= Full-screen menu ================= */}
      {open && (
        <div data-lenis-prevent className="pi fixed inset-0 z-[60] !bg-black/70 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={close}>
          <div className="flex h-full justify-end gap-4 px-4 md:px-12! py-4 md:py-8!" onClick={(e) => e.stopPropagation()}>
            {/* Left: contextual panel (desktop) */}
            <div className="hidden lg:flex! w-[38rem] flex-col gap-4 pi-panel-in" style={{ animationDelay: '0.08s' }}>
              {hovered ? (
                <div className="pi-notch flex-1 bg-[var(--pi-panel)] p-8 text-white">
                  <p className="text-sm text-white/50">({items.find((i) => i.key === hovered)?.label})</p>
                  <ul className="mt-6">
                    {subLinks(hovered).map((link) => (
                      <li key={link.label} className="border-b border-white/10">
                        <a
                          href={link.href}
                          onClick={close}
                          className="group flex items-center justify-between py-4 text-2xl tracking-tight text-white/80 hover:text-white"
                        >
                          {link.label}
                          <Arrow className="size-5 transition-transform group-hover:translate-x-1" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                cards.map((card, i) => (
                  <a
                    key={card.title}
                    href={i === 0 ? ROUTES.register : ROUTES.contactBrands}
                    onClick={close}
                    className="pi-notch group flex flex-1 gap-6 bg-[var(--pi-panel)] p-8 text-white"
                  >
                    <div className="flex flex-1 flex-col">
                      <p className="flex items-center gap-2 text-2xl font-medium tracking-tight">
                        {card.title}
                        <Arrow className="size-5 transition-transform group-hover:translate-x-1" />
                      </p>
                      <p className="mt-3 max-w-xs text-white/70 leading-snug">{card.desc}</p>
                      <p className="mt-auto text-white/40">({card.tag})</p>
                    </div>
                    <div
                      className="flex aspect-square w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                      style={{ backgroundColor: i === 0 ? 'var(--pi-green)' : 'var(--pi-pink)' }}
                    >
                      <span className="font-script text-5xl text-[#1f1f1f]">{i === 0 ? 'Clip' : 'Brands'}</span>
                    </div>
                  </a>
                ))
              )}
              <a
                href="/register"
                onClick={close}
                className="pi-notch group flex items-center justify-between bg-white px-6 py-5 text-xl tracking-tight text-[#1f1f1f]"
              >
                {t('nav.getStarted')}
                <Arrow className="size-6 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Right: navigation panel */}
            <nav className="pi-notch pi-panel-in relative flex w-full lg:w-[34rem]! flex-col overflow-y-auto pi-hide-scroll bg-[var(--pi-panel)] px-6 md:px-14! pt-20 pb-8 text-white">
              <button
                type="button"
                onClick={close}
                aria-label={t('landing.nav.close')}
                className="pi-notch absolute right-0 top-0 flex size-14 items-center justify-center border border-white/10 bg-[#1f1f1f] transition-colors hover:bg-black cursor-pointer"
              >
                <svg className="size-5" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>

              <ul>
                {items.map((item) => {
                  const isOpen = expanded === item.sub && !!item.sub;
                  const content = (
                    <>
                      <span>{item.label}</span>
                      <Arrow
                        className={`size-6 md:size-7! shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-90' : 'group-hover:translate-x-1'
                        }`}
                      />
                    </>
                  );
                  const cls =
                    'group flex w-full items-center justify-between py-5 md:py-6! text-[2.75rem] md:text-[4.5rem]! leading-none tracking-[-0.05em] text-white/40 transition-colors hover:text-white cursor-pointer';
                  return (
                    <li
                      key={item.key}
                      className="border-b border-white/10"
                      onMouseEnter={() => setHovered(item.sub ?? null)}
                    >
                      {item.sub ? (
                        <button
                          type="button"
                          className={cls}
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : item.sub!)}
                        >
                          {content}
                        </button>
                      ) : (
                        <a href={item.href} onClick={close} className={cls}>
                          {content}
                        </a>
                      )}
                      {isOpen && (
                        <ul className="pb-5 pi-panel-in">
                          {subLinks(item.sub!).map((link) => (
                            <li key={link.label}>
                              <a href={link.href} onClick={close} className="block py-1.5 text-lg text-white/70 hover:text-white">
                                {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-10 space-y-6">
                <div className="sm:hidden!">
                  <p className="mb-2 text-sm text-white/40">{t('landing.nav.language')}</p>
                  <LangSwitch tone="panel" />
                </div>
                <div>
                  <p className="mb-2 text-sm text-white/40">{t('landing.nav.social')}</p>
                  <div className="flex flex-col gap-1">
                    {SOCIALS.map((s) => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-xl tracking-tight hover:opacity-70">
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
                <a
                  href="/register"
                  onClick={close}
                  className="pi-notch flex items-center justify-between bg-white px-5 py-4 text-lg tracking-tight text-[#1f1f1f] lg:hidden!"
                >
                  {t('nav.getStarted')}
                  <Arrow className="size-5" />
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
