'use client';

import { useEffect } from 'react';

// Plays Clipte Icons motions to the end: when the pointer enters (or keyboard focus reaches)
// a link/button, every icon inside gets `data-ci-play` for one full cycle, so leaving early
// never snaps the animation back. Styles: `.ci[data-ci-play]` in globals.css.

const HOST = 'a, button, label, summary, [role="button"], .ci-host';
const CYCLE = 1250;

function play(host: Element) {
  host.querySelectorAll<SVGSVGElement>('svg.ci').forEach((svg) => {
    if (svg.hasAttribute('data-ci-play')) return;
    svg.setAttribute('data-ci-play', '');
    window.setTimeout(() => svg.removeAttribute('data-ci-play'), CYCLE);
  });
}

export default function IconMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onOver = (e: PointerEvent) => {
      const host = (e.target as Element | null)?.closest?.(HOST);
      if (!host) return;
      const from = e.relatedTarget as Node | null;
      if (from && host.contains(from)) return; // moving inside the same host
      play(host);
    };
    const onFocus = (e: FocusEvent) => {
      const host = (e.target as Element | null)?.closest?.(HOST);
      if (host && (e.target as Element).matches(':focus-visible')) play(host);
    };
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);
  return null;
}
