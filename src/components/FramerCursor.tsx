'use client';

import React, { useEffect } from 'react';

export default function FramerCursor() {
  useEffect(() => {
    // Only run on desktop devices with fine pointer (mouse)
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const dot = document.getElementById('framer-custom-cursor');
    const aura = document.getElementById('framer-cursor-aura');
    if (!dot || !aura) return;

    let mouseX = -100, mouseY = -100;
    let dotX = -100, dotY = -100;
    let auraX = -100, auraY = -100;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Smooth 60 FPS LERP loop
    function render() {
      // Dot follows mouse almost instantly (0.75 LERP)
      dotX += (mouseX - dotX) * 0.75;
      dotY += (mouseY - dotY) * 0.75;
      if (dot) {
        dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      }

      // Outer aura ring smoothly lags with elasticity (0.18 LERP)
      auraX += (mouseX - auraX) * 0.18;
      auraY += (mouseY - auraY) * 0.18;
      if (aura) {
        aura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    // Mouse click reaction
    const handleMouseDown = () => document.body.classList.add('cursor-active');
    const handleMouseUp = () => document.body.classList.remove('cursor-active');

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Automatic mode switching via event delegation
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Drag target (carousel / video collage / slider)
      const dragTarget = target.closest('.slider, .carousel, .drag-zone, .quotes-slider, [data-carousel], .group\\/card');
      if (dragTarget) {
        document.body.classList.add('cursor-drag');
        return;
      }

      // 2. Clickable / link target
      const hoverTarget = target.closest('a, button, [role="button"], input, select, textarea, .clickable');
      if (hoverTarget) {
        document.body.classList.add('cursor-hover');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const dragTarget = target.closest('.slider, .carousel, .drag-zone, .quotes-slider, [data-carousel], .group\\/card');
      if (dragTarget) {
        document.body.classList.remove('cursor-drag');
      }

      const hoverTarget = target.closest('a, button, [role="button"], input, select, textarea, .clickable');
      if (hoverTarget) {
        document.body.classList.remove('cursor-hover');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Central Cursor Dot */}
      <div id="framer-custom-cursor" aria-hidden="true" />

      {/* Outer Cursor Aura Ring */}
      <div id="framer-cursor-aura" aria-hidden="true">
        <div className="cursor-drag-arrows">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </>
  );
}
