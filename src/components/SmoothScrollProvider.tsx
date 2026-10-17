'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { isPiRoute } from '@/content/routes';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

// Smooth (inertial) scrolling on landing-styled pages only — the dashboard has
// its own nested scroll panels, so it keeps native scrolling.

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isPiRoute(pathname)) return;
    // Native scrollbar is replaced by <ScrollIndicator /> on the landing
    const root = document.documentElement;
    root.classList.add('pi-no-scrollbar');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => root.classList.remove('pi-no-scrollbar');
    }

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      smoothWheel: true,
      // Touch keeps native momentum scrolling (already smooth on phones)
      syncTouch: false,
    });
    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      delete window.__lenis;
      root.classList.remove('pi-no-scrollbar');
    };
  }, [pathname]);

  return <>{children}</>;
}
