'use client';

// Clipte charts — hand-drawn SVG in the landing style (thin ink lines, soft fills, notched
// tooltips). No chart library: everything here is small, responsive and animates in.
//   MetricTabs   KPI tabs that double as the chart's metric switch (value + change vs previous period)
//   AreaChart    smooth line + fill, hover crosshair & tooltip, optional previous-period ghost line
//   BarChart     daily bars with the same hover behaviour
//   Sparkline    tiny inline trend for list rows
//   ShareBar     one stacked bar + legend (platform split)
//   RankList     ranked rows with a proportional bar (top clippers, campaigns…)
//   Delta        "+12%" / "−4%" change chip

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export type Point = { x: string; y: number }; // x = ISO day (yyyy-mm-dd)

const locale = (lang: string) => (lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US');
export const dayLabel = (iso: string, lang: string, long = false) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(locale(lang), long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });

/** % change between two totals; null when there's nothing to compare against. */
export const pctChange = (now: number, before: number) => (before > 0 ? ((now - before) / before) * 100 : now > 0 ? null : 0);

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Monotone cubic path (no overshoot below zero), Fritsch–Carlson. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [], m: number[] = [], t: number[] = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1);
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) {
      const s = 3 / Math.sqrt(h);
      t[i] = s * a * m[i];
      t[i + 1] = s * b * m[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + h * t[i]} ${pts[i + 1][0] - h},${pts[i + 1][1] - h * t[i + 1]} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
};

/* ------------------------------------------------------------------ */

export function Delta({ value, invert = false, className = '' }: { value: number | null; invert?: boolean; className?: string }) {
  const { t } = useLanguage();
  if (value === null) return <span className={`rounded-full bg-[var(--pi-line)] px-1.5 py-px text-[11px] text-[var(--pi-muted)] ${className}`}>{t('stats.new')}</span>;
  const up = value >= 0.05, down = value <= -0.05;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums ${
        good ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400!' : bad ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400!' : 'bg-[var(--pi-line)] text-[var(--pi-muted)]'
      } ${className}`}
    >
      {up ? '↑' : down ? '↓' : ''}
      {Math.abs(value) >= 1000 ? '999+' : Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0)}%
    </span>
  );
}

export type Metric = { id: string; label: string; value: string; delta?: number | null; hint?: string };

/** KPI tabs: each shows its total + change; the active one drives the chart below. */
export function MetricTabs({ metrics, active, onChange }: { metrics: Metric[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-2 border-b border-[var(--pi-line)] sm:flex!">
      {metrics.map((m) => {
        const on = m.id === active;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onChange(m.id)}
            className={`group relative min-w-0 px-4 pb-4 pt-3 text-left transition-colors sm:min-w-[150px]! cursor-pointer ${on ? '' : 'hover:bg-[var(--pi-line)]/50'}`}
          >
            <span className={`block truncate text-[12px] ${on ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-muted)]'}`}>{m.label}</span>
            <span className="mt-1.5 flex items-baseline gap-2">
              <span className={`truncate text-[22px] font-light leading-none tracking-[-0.03em] tabular-nums ${on ? 'text-[var(--pi-ink-strong)]' : 'text-[var(--pi-ink)]'}`}>
                {m.value}
              </span>
              {m.delta !== undefined && <Delta value={m.delta} />}
            </span>
            {m.hint && <span className="mt-1 block truncate text-[11px] text-[var(--pi-muted)]">{m.hint}</span>}
            <span className={`absolute inset-x-3 bottom-[-1px] h-[2px] rounded-full bg-[var(--pi-ink-strong)] transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0'}`} />
          </button>
        );
      })}
    </div>
  );
}

/** 7 / 30 / 90-day switch, styled like the header's glass chips. */
export function RangePicker({ value, onChange, options = [7, 30, 90], label = (d: number) => `${d}d` }: { value: number; onChange: (d: number) => void; options?: number[]; label?: (d: number) => string }) {
  return (
    <div role="group" className="pi-notch inline-flex h-9 items-center gap-0.5 bg-[var(--pi-line)] p-1 text-[12px]">
      {options.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-pressed={value === d}
          className={`pi-notch h-full px-2.5 tabular-nums transition-colors cursor-pointer ${
            value === d ? 'bg-[var(--pi-surface)] text-[var(--pi-ink-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-[var(--pi-muted)] hover:text-[var(--pi-ink-strong)]'
          }`}
        >
          {label(d)}
        </button>
      ))}
    </div>
  );
}

type ChartProps = {
  data: Point[];
  format: (n: number) => string;
  lang: string;
  height?: number;
  compare?: number[]; // previous period, same length → dashed ghost line
  compareLabel?: string;
  empty?: React.ReactNode;
  axis?: (n: number) => string; // gridline labels; defaults to 12K / 1.2M
};

const shortNum = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '')}K` : String(Math.round(n * 100) / 100);

function YLabels({ max, w, innerH, fmt }: { max: number; w: number; innerH: number; fmt: (n: number) => string }) {
  return (
    <>
      {[0.5, 1].map((f) => (
        <text key={f} x={w - PAD.right} y={PAD.top + innerH * (1 - f) - 5} textAnchor="end" className="fill-[var(--pi-muted)] text-[10px] tabular-nums">
          {fmt(max * f)}
        </text>
      ))}
    </>
  );
}

function Tooltip({ x, w, children }: { x: number; w: number; children: React.ReactNode }) {
  const left = Math.min(Math.max(x, 70), Math.max(w - 70, 70));
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--pi-ink-strong)] px-2.5 py-1.5 text-[12px] leading-tight text-[var(--pi-surface)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
      style={{ left }}
    >
      {children}
    </div>
  );
}

const PAD = { top: 34, right: 8, bottom: 26, left: 8 };

function useHover(n: number, w: number) {
  const [i, setI] = useState<number | null>(null);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left - PAD.left;
    const step = (w - PAD.left - PAD.right) / Math.max(n - 1, 1);
    setI(Math.max(0, Math.min(n - 1, Math.round(x / step))));
  };
  return { i, onMove, onLeave: () => setI(null) };
}

function XLabels({ data, xs, lang, h }: { data: Point[]; xs: number[]; lang: string; h: number }) {
  if (!data.length) return null;
  const idx = data.length <= 2 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1];
  return (
    <>
      {idx.map((i, k) => (
        <text
          key={i}
          x={xs[i]}
          y={h - 6}
          textAnchor={k === 0 ? 'start' : k === idx.length - 1 ? 'end' : 'middle'}
          className="fill-[var(--pi-muted)] text-[11px]"
        >
          {dayLabel(data[i].x, lang)}
        </text>
      ))}
    </>
  );
}

export function AreaChart({ data, format, lang, height = 230, compare, compareLabel, empty, axis = shortNum }: ChartProps) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const gid = useId().replace(/:/g, '');
  const n = data.length;
  const total = data.reduce((a, p) => a + p.y, 0);
  const max = niceMax(Math.max(...data.map((p) => p.y), ...(compare || [0]), 0));
  const innerW = Math.max(w - PAD.left - PAD.right, 1);
  const innerH = height - PAD.top - PAD.bottom;
  const xs = data.map((_, i) => PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW));
  const ys = data.map((p) => PAD.top + innerH - (p.y / max) * innerH);
  const line = useMemo(() => smoothPath(xs.map((x, i) => [x, ys[i]])), [xs.join(), ys.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const ghost = compare?.length === n ? smoothPath(xs.map((x, i) => [x, PAD.top + innerH - (compare[i] / max) * innerH])) : '';
  const area = n > 1 ? `${line}L${xs[n - 1]},${PAD.top + innerH}L${xs[0]},${PAD.top + innerH}Z` : '';
  const { i, onMove, onLeave } = useHover(n, w);

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} className="block overflow-visible" onPointerMove={onMove} onPointerLeave={onLeave}>
          <defs>
            <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--pi-ink-strong)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--pi-ink-strong)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={PAD.left} x2={w - PAD.right} y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)} stroke="var(--pi-line)" strokeDasharray={f === 1 ? undefined : '2 4'} />
          ))}
          <line x1={PAD.left} x2={w - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--pi-line-strong)" />
          {ghost && <path d={ghost} fill="none" stroke="var(--pi-muted)" strokeOpacity="0.45" strokeWidth="1.25" strokeDasharray="3 4" />}
          {area && <path key={`a${gid}${n}${max}`} d={area} fill={`url(#g${gid})`} className="ch-fade" />}
          <path key={`l${gid}${n}${max}`} d={line} fill="none" stroke="var(--pi-ink-strong)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="ch-draw" />
          <XLabels data={data} xs={xs} lang={lang} h={height} />
          {total > 0 && <YLabels max={max} w={w} innerH={innerH} fmt={axis} />}
          {i !== null && (
            <g>
              <line x1={xs[i]} x2={xs[i]} y1={PAD.top - 6} y2={PAD.top + innerH} stroke="var(--pi-ink-strong)" strokeOpacity="0.25" />
              <circle cx={xs[i]} cy={ys[i]} r="4.5" fill="var(--pi-surface)" stroke="var(--pi-ink-strong)" strokeWidth="1.75" />
            </g>
          )}
        </svg>
      )}
      {i !== null && w > 0 && (
        <Tooltip x={xs[i]} w={w}>
          <span className="block opacity-60">{dayLabel(data[i].x, lang, true)}</span>
          <span className="tabular-nums">{format(data[i].y)}</span>
          {compare?.length === n && (
            <span className="ml-2 tabular-nums opacity-60">
              {compareLabel} {format(compare[i])}
            </span>
          )}
        </Tooltip>
      )}
      {total === 0 && empty && <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6">{empty}</div>}
    </div>
  );
}

export function BarChart({ data, format, lang, height = 230, empty, axis = shortNum }: ChartProps) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const n = data.length;
  const total = data.reduce((a, p) => a + p.y, 0);
  const max = niceMax(Math.max(...data.map((p) => p.y), 0));
  const innerW = Math.max(w - PAD.left - PAD.right, 1);
  const innerH = height - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(n, 1);
  const bw = Math.max(2, Math.min(28, slot * 0.62));
  const xs = data.map((_, i) => PAD.left + slot * i + slot / 2);
  const [hi, setHi] = useState<number | null>(null);

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {w > 0 && (
        <svg
          width={w}
          height={height}
          className="block overflow-visible"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHi(Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left - PAD.left) / slot))));
          }}
          onPointerLeave={() => setHi(null)}
        >
          {[0.5, 1].map((f) => (
            <line key={f} x1={PAD.left} x2={w - PAD.right} y1={PAD.top + innerH * (1 - f)} y2={PAD.top + innerH * (1 - f)} stroke="var(--pi-line)" strokeDasharray="2 4" />
          ))}
          <line x1={PAD.left} x2={w - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--pi-line-strong)" />
          {data.map((p, i) => {
            const h = (p.y / max) * innerH;
            return (
              <rect
                key={p.x}
                x={xs[i] - bw / 2}
                y={PAD.top + innerH - Math.max(h, p.y > 0 ? 2 : 0)}
                width={bw}
                height={Math.max(h, p.y > 0 ? 2 : 0)}
                rx={Math.min(3, bw / 3)}
                fill="var(--pi-ink-strong)"
                fillOpacity={hi === null || hi === i ? 0.9 : 0.25}
                className="ch-grow transition-[fill-opacity] duration-150"
                style={{ animationDelay: `${Math.min(i * 12, 400)}ms` }}
              />
            );
          })}
          <XLabels data={data} xs={xs} lang={lang} h={height} />
          {total > 0 && <YLabels max={max} w={w} innerH={innerH} fmt={axis} />}
        </svg>
      )}
      {hi !== null && w > 0 && (
        <Tooltip x={xs[hi]} w={w}>
          <span className="block opacity-60">{dayLabel(data[hi].x, lang, true)}</span>
          <span className="tabular-nums">{format(data[hi].y)}</span>
        </Tooltip>
      )}
      {total === 0 && empty && <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6">{empty}</div>}
    </div>
  );
}

/** Tiny trend line for list rows. Rising → green, falling → muted. */
export function Sparkline({ values, width = 76, height = 26, className = '' }: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return <span className={`inline-block ${className}`} style={{ width, height }} />;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 2) + 1, height - 2 - ((v - min) / span) * (height - 4)] as [number, number]);
  const up = values[values.length - 1] > values[0];
  const d = smoothPath(pts);
  return (
    <svg width={width} height={height} className={`overflow-visible ${className}`} aria-hidden>
      <path d={`${d}L${width - 1},${height}L1,${height}Z`} fill={up ? 'rgb(16 185 129 / .12)' : 'var(--pi-line)'} />
      <path d={d} fill="none" stroke={up ? 'rgb(16 185 129)' : 'var(--pi-muted)'} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={up ? 'rgb(16 185 129)' : 'var(--pi-muted)'} />
    </svg>
  );
}

export const PLATFORM_COLOR: Record<string, string> = { tiktok: '#ff2d55', youtube: '#ff0033', instagram: '#c13584' };
const SHARE_FALLBACK = ['#1f1f1f', '#7a7a7a', '#bdbdbd', '#3d7bff'];

/** Stacked share bar with a legend underneath. */
export function ShareBar({ items, format }: { items: { key: string; label: React.ReactNode; value: number; color?: string }[]; format: (n: number) => string }) {
  const total = items.reduce((a, it) => a + it.value, 0);
  if (!total) return <div className="h-2.5 rounded-full bg-[var(--pi-line)]" />;
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {items.map((it, i) => (
          <span
            key={it.key}
            className="ch-grow-x h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(it.value / total) * 100}%`, background: it.color || SHARE_FALLBACK[i % SHARE_FALLBACK.length] }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((it, i) => (
          <li key={it.key} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: it.color || SHARE_FALLBACK[i % SHARE_FALLBACK.length] }} />
            <span className="min-w-0 flex-1 truncate text-[var(--pi-ink-strong)]">{it.label}</span>
            <span className="tabular-nums text-[var(--pi-ink)]">{format(it.value)}</span>
            <span className="w-11 text-right tabular-nums text-[var(--pi-muted)]">{Math.round((it.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranked rows with a soft proportional bar behind each. */
export function RankList({
  items,
  empty,
}: {
  items: { key: string; lead?: React.ReactNode; label: React.ReactNode; sub?: React.ReactNode; value: number; display: React.ReactNode; href?: string }[];
  empty?: React.ReactNode;
}) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  if (!items.length) return <>{empty}</>;
  return (
    <ol className="space-y-1">
      {items.map((it, idx) => {
        const body = (
          <>
            <span className="ch-grow-x absolute inset-y-0 left-0 rounded-lg bg-[var(--pi-line)]" style={{ width: `${Math.max(4, (it.value / max) * 100)}%` }} />
            <span className="relative w-5 shrink-0 text-center text-[12px] tabular-nums text-[var(--pi-muted)]">{idx + 1}</span>
            {it.lead && <span className="relative shrink-0">{it.lead}</span>}
            <span className="relative min-w-0 flex-1">
              <span className="block truncate text-[13px] text-[var(--pi-ink-strong)]">{it.label}</span>
              {it.sub && <span className="block truncate text-[11px] text-[var(--pi-muted)]">{it.sub}</span>}
            </span>
            <span className="relative shrink-0 text-[13px] tabular-nums text-[var(--pi-ink-strong)]">{it.display}</span>
          </>
        );
        const cls = 'relative flex items-center gap-3 overflow-hidden rounded-lg px-2 py-2';
        return (
          <li key={it.key}>
            {it.href ? (
              <a href={it.href} className={`${cls} transition-opacity hover:opacity-80`}>
                {body}
              </a>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Card shell used by every stats block. */
export function ChartCard({ title, action, children, className = '' }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`pi-notch pi-edge min-w-0 bg-[var(--pi-surface)] p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-[15px] font-light tracking-[-0.02em] text-[var(--pi-ink-strong)]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Live countdown text that re-renders every minute. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
