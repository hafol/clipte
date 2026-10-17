'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, X } from '@/components/icons';

// Form controls, dialogs and feedback for dashboard pages (landing design system, app-tuned).

export const inputCls =
  'h-11 w-full border-b border-[var(--pi-line-strong)] bg-transparent text-[15px] text-[var(--pi-ink-strong)] placeholder:text-[var(--pi-muted)] outline-none transition-colors focus:border-[var(--pi-ink-strong)] disabled:opacity-50';
export const boxInputCls =
  'pi-notch w-full bg-[var(--pi-line)] px-3.5 py-3 text-[15px] text-[var(--pi-ink-strong)] placeholder:text-[var(--pi-muted)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1px_var(--pi-ink-strong)]';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-[var(--pi-muted)]">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-600 dark:text-rose-400!">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-[var(--pi-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function Btn({
  children,
  onClick,
  type = 'button',
  variant = 'solid',
  size = 'md',
  disabled,
  loading,
  className = '',
  href,
  external,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'solid' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  href?: string;
  external?: boolean;
}) {
  const v = {
    solid: 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)] hover:opacity-90',
    outline: 'pi-edge bg-[var(--pi-surface)] text-[var(--pi-ink-strong)] hover:bg-[var(--pi-bg)]',
    ghost: 'text-[var(--pi-ink)] hover:bg-[var(--pi-line)] hover:text-[var(--pi-ink-strong)]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }[variant];
  const sz = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-[15px]' }[size];
  const cls = `pi-notch inline-flex shrink-0 items-center justify-center gap-2 tracking-tight transition-[opacity,background-color] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer ${v} ${sz} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cls}>
      {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        })
      }
      className="pi-notch pi-edge inline-flex h-8 shrink-0 items-center gap-1.5 bg-[var(--pi-surface)] px-2.5 text-xs text-[var(--pi-ink-strong)] transition-colors hover:bg-[var(--pi-bg)] cursor-pointer"
    >
      {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {done ? copiedLabel : label}
    </button>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string; count?: number }[];
}) {
  return (
    <div className="pi-hide-scroll -mx-1 flex gap-1 overflow-x-auto border-b border-[var(--pi-line)] px-1" role="tablist">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={`relative shrink-0 whitespace-nowrap px-3 pb-3 pt-2 text-sm tracking-tight transition-colors cursor-pointer ${
            value === it.id ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-muted)] hover:text-[var(--pi-ink-strong)]'
          }`}
        >
          {it.label}
          {it.count !== undefined && <span className="ml-1.5 text-xs tabular-nums text-[var(--pi-muted)]">{it.count}</span>}
          {value === it.id && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-[var(--pi-ink-strong)]" />}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  items,
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={`pi-notch pi-hide-scroll inline-flex h-10 max-w-full items-center gap-0.5 overflow-x-auto bg-[var(--pi-line)] p-1 text-[13px] ${className}`}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`pi-notch flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap px-3 tracking-tight transition-colors cursor-pointer ${
            value === it.id ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'text-[var(--pi-ink)] hover:text-[var(--pi-ink-strong)]'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** Centered dialog (bottom sheet on phones). Esc and the backdrop close it. */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center! sm:p-6!" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`pi-notch relative flex max-h-[92vh] w-full flex-col bg-[var(--pi-surface)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] ${
          wide ? 'sm:max-w-2xl!' : 'sm:max-w-md!'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--pi-line)] px-6 py-4">
          <h2 className="text-lg font-light tracking-[-0.03em] text-[var(--pi-ink-strong)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[var(--pi-muted)] transition-colors hover:text-[var(--pi-ink-strong)] cursor-pointer"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Notice({ tone = 'muted', children }: { tone?: 'muted' | 'green' | 'amber' | 'red' | 'blue'; children: React.ReactNode }) {
  const cls = {
    muted: 'bg-[var(--pi-line)] text-[var(--pi-ink)]',
    green: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300!',
    amber: 'bg-amber-500/12 text-amber-800 dark:text-amber-300!',
    red: 'bg-rose-500/10 text-rose-700 dark:text-rose-300!',
    blue: 'bg-sky-500/10 text-sky-800 dark:text-sky-300!',
  }[tone];
  return <div className={`pi-notch px-4 py-3 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

/** Short-lived status message in the bottom corner. */
export function useToast() {
  const [msg, setMsg] = useState<{ text: string; tone: 'green' | 'red' } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(id);
  }, [msg]);
  const toastNode = msg ? (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] flex justify-center lg:inset-x-auto! lg:bottom-8! lg:right-8!">
      <div
        role="status"
        className={`pi-notch px-4 py-3 text-sm shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)] ${
          msg.tone === 'green' ? 'bg-[var(--pi-btn)] text-[var(--pi-btn-fg)]' : 'bg-rose-600 text-white'
        }`}
      >
        {msg.text}
      </div>
    </div>
  ) : null;
  return { toast: (text: string, tone: 'green' | 'red' = 'green') => setMsg({ text, tone }), toastNode };
}

export function timeAgo(iso: string | null | undefined, lang = 'en') {
  if (!iso) return '—';
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'kk' ? 'kk' : lang === 'ru' ? 'ru' : 'en', { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 2629800) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 31557600) return rtf.format(Math.round(diff / 2629800), 'month');
  return rtf.format(Math.round(diff / 31557600), 'year');
}

/**
 * Dropdown in the dashboard style (the native <select> list can't be themed — it showed
 * light text on a white list in dark mode). Keyboard: ↑ ↓ Home End Enter Space Esc Tab.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  className = '',
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    setHi(Math.max(0, options.findIndex((o) => o.value === value)));
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, options, value]);

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-i="${hi}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [hi, open]);

  const pick = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(options.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setHi(0); }
    else if (e.key === 'End') { e.preventDefault(); setHi(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(hi); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onKeyDown={onKey}
        className={`${inputCls} flex items-center justify-between gap-3 text-left cursor-pointer`}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={`size-4 shrink-0 text-[var(--pi-muted)] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          className="pi-notch pi-hide-scroll absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto bg-[var(--pi-surface)] p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45),0_0_0_1px_var(--pi-line)]"
          data-lenis-prevent
        >
          {options.map((o, i) => {
            const on = o.value === value;
            return (
              <li
                key={o.value}
                data-i={i}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                className={`pi-notch flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                  i === hi ? 'bg-[var(--pi-line)] text-[var(--pi-ink-strong)]' : 'text-[var(--pi-ink)]'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {on && <Check className="size-4 shrink-0 text-[var(--pi-ink-strong)]" animate />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
