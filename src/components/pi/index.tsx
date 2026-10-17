'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ==========================================================================
   Landing primitives — Pensatori-inspired design system
   ========================================================================== */

/**
 * Pauses infinite animations (marquees, floating stones) in any
 * `[data-pi-pause]` element while it is off screen. Render once per page.
 */
export function PauseOffscreen() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('pi-paused', !e.isIntersecting)),
      { rootMargin: '200px 0px' }
    );
    document.querySelectorAll('[data-pi-pause]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/** Adds `is-in` once the element scrolls into view (reveals run once). */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView, className: inView ? 'is-in' : '' };
}

/** "+ (Label)" eyebrow used above every statement. */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, className: inCls } = useInView<HTMLDivElement>(0.6);
  return (
    <div ref={ref} className={`flex items-center gap-2 text-sm text-[var(--pi-ink)] ${inCls} ${className}`}>
      <svg className="pi-plus size-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true">
        <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" />
        <line y1="5" x2="10" y2="5" stroke="currentColor" />
      </svg>
      <span className="pi-fade">({children})</span>
    </div>
  );
}

/** Splits text into words that de-blur in sequence when scrolled into view. */
export function RevealWords({
  text,
  as: Tag = 'p',
  className = '',
  stagger = 0.035,
  delay = 0,
}: {
  text: string;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const { ref, className: inCls } = useInView<HTMLElement>(0.25);
  const words = text.split(' ');
  return (
    <Tag ref={ref as React.Ref<never>} className={`${className} ${inCls}`} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={`${w}-${i}`}>
          <span aria-hidden="true" className="pi-word" style={{ transitionDelay: `${delay + i * stagger}s` }}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

/**
 * Notched button with two motions from the old site:
 * - `slide`  (default): old hero CTA — arrow chip slides out of the right edge + magnetic cursor follow
 * - `spring`: old Get Started — start chip collapses, body springs left, end chip pops in
 */
export function NotchButton({
  href,
  children,
  variant = 'solid',
  size = 'md',
  arrow = true,
  className = '',
  onClick,
  ariaLabel,
  motion = 'slide',
}: {
  href?: string;
  children?: React.ReactNode;
  variant?: 'solid' | 'outline' | 'light' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'nav';
  motion?: 'slide' | 'spring';
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const sizes = {
    sm: '[--h:2.5rem] text-xs',
    md: '[--h:3rem] text-sm',
    lg: '[--h:3.5rem] text-base',
    nav: '[--h:3rem] md:[--h:3.5rem]! text-sm',
  }[size];

  const tone = {
    solid: { fill: 'bg-[var(--pi-btn)]', text: 'text-[var(--pi-btn-fg)]' },
    light: { fill: 'bg-white', text: 'text-[#1f1f1f]' },
    outline: { fill: 'bg-[var(--pi-bg)]', text: 'text-[var(--pi-ink-strong)]' },
    glass: { fill: 'pi-glass', text: 'text-[var(--pi-ink-strong)]' },
  }[variant];

  // Solid fill, or a 1px notched outline (outer line plate + inner bg plate)
  const plate = (
    <>
      <span aria-hidden="true" className={`pi-spring__plate pi-notch ${variant === 'outline' ? 'bg-[var(--pi-line-strong)]' : tone.fill}`} />
      {variant === 'outline' && <span aria-hidden="true" className={`pi-spring__plate pi-spring__plate--inner pi-notch ${tone.fill}`} />}
    </>
  );

  const arrowIcon = (
    <svg className="pi-spring__arrow" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 1.827 1.71 0H10v8.22L8.11 10V5.93c0-.992.009-1.89.03-2.695l-6.642 6.58-1.316-1.44 6.641-6.58c-.787.022-1.67.032-2.647.032H0Z"
      />
    </svg>
  );

  const body = (
    <span className="pi-spring__body">
      {plate}
      <span className="relative uppercase tracking-[0.02em]">{children}</span>
    </span>
  );

  // Magnetic pull toward the cursor (slide motion only)
  const onMagnetMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate3d(${x * 0.15}px, ${y * 0.15}px, 0) scale(1.04)`;
  };
  const onMagnetLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = '';
  };

  const slideInner = (
    <>
      {body}
      {arrow && (
        <span className="pi-slide__reveal" aria-hidden="true">
          <span className="pi-slide__chip">
            {plate}
            <svg className="pi-slide__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="square" />
            </svg>
          </span>
        </span>
      )}
    </>
  );

  const springInner = (
    <>
      {arrow && (
        <span className="pi-spring__chip pi-spring__chip--start" aria-hidden="true">
          <span className="pi-spring__plate-wrap">{plate}</span>
          {arrowIcon}
        </span>
      )}
      {body}
      {arrow && (
        <span className="pi-spring__chip pi-spring__chip--end" aria-hidden="true">
          <span className="pi-spring__plate-wrap">{plate}</span>
          {arrowIcon}
        </span>
      )}
    </>
  );

  const isSlide = motion === 'slide';
  const inner = isSlide ? slideInner : springInner;
  const cls = `${isSlide ? 'pi-slide' : 'pi-spring'} shrink-0 font-normal ${tone.text} ${sizes} ${className}`;
  const magnet = isSlide ? { onMouseMove: onMagnetMove, onMouseLeave: onMagnetLeave } : {};

  if (href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel} {...magnet}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel} {...magnet}>
      {inner}
    </button>
  );
}

/**
 * Giant endless band: every word in the Ballet script between hairlines.
 * Driven by a JS loop (one running position, wrapped by the unit width) so it
 * never visibly restarts; speeds up with scroll and reverses when scrolling up.
 */
export function BandMarquee({
  script,
  index,
  words,
  duration = 46,
}: {
  script: string;
  index: string;
  words: string[];
  duration?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const unit = unitRef.current;
    if (!root || !track || !unit) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let unitW = unit.offsetWidth;
    const ro = new ResizeObserver(() => (unitW = unit.offsetWidth));
    ro.observe(unit);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '200px 0px' });
    io.observe(root);

    let x = 0;            // running offset, always wrapped into [0, unitW)
    let dir = 1;          // 1 = leftwards, -1 = rightwards (after scrolling up)
    let speed = 0;        // smoothed px/s
    let lastY = window.scrollY;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const scrollV = (y - lastY) / Math.max(dt, 0.001); // px/s
      lastY = y;
      if (!visible || !unitW) return;

      if (scrollV > 20) dir = 1;
      else if (scrollV < -20) dir = -1;
      const base = unitW / duration;
      const boost = Math.min(Math.abs(scrollV) * 0.35, base * 6);
      const target = dir * (base + boost);
      speed += (target - speed) * Math.min(1, dt * 6);

      x = (((x + speed * dt) % unitW) + unitW) % unitW;
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [duration]);

  const word = 'relative font-script text-[7.5rem] md:text-[15rem]! leading-none mt-4 md:mt-10! text-[var(--pi-ink)] whitespace-nowrap';
  const bar = <span aria-hidden="true" className="mx-8 md:mx-16! inline-block h-1 w-10 md:h-1.5! md:w-16! shrink-0 bg-[var(--pi-ink)]" />;

  const renderUnit = (ref?: React.Ref<HTMLDivElement>, key?: string) => (
    <div ref={ref} key={key} className="flex shrink-0 items-center">
      <div className={`${word} pr-4 md:pr-8!`}>
        {script}
        <span className="absolute top-3 md:top-[18%]! -right-1 md:-right-3! font-pi italic text-sm md:text-lg! tracking-tight text-[var(--pi-muted)]">
          ({index})
        </span>
      </div>
      {words.map((w) => (
        <React.Fragment key={w}>
          {bar}
          <div className={word}>{w}</div>
        </React.Fragment>
      ))}
      {bar}
    </div>
  );

  return (
    <div ref={rootRef} className="pi-band w-full py-16 md:py-28! select-none" aria-label={`${script} — ${words.join(', ')}`}>
      <div className="flex h-[3.7rem] md:h-[7.2rem]! items-center border-y border-[var(--pi-line)]">
        {/* 3 identical units: enough to cover the viewport at any wrap offset */}
        <div ref={trackRef} className="flex w-max will-change-transform" aria-hidden="true">
          {renderUnit(unitRef, 'a')}
          {renderUnit(undefined, 'b')}
          {renderUnit(undefined, 'c')}
        </div>
      </div>
    </div>
  );
}

/** Neon ticker strip linking to a CTA. */
export function NeonStrip({
  text,
  href,
  color = 'var(--pi-green)',
  reverse = false,
}: {
  text: string;
  href: string;
  color?: string;
  reverse?: boolean;
}) {
  const items = Array.from({ length: 8 });
  return (
    <a href={href} data-pi-pause className="block w-full overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.01]" aria-label={text}>
      <div className="flex w-full py-2 text-[#111]" style={{ backgroundColor: color }}>
        <div className={`pi-marquee-track ${reverse ? 'reverse' : ''}`} style={{ ['--pi-marquee-duration' as string]: '30s' }} aria-hidden="true">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0">
              {items.map((_, i) => (
                <span key={i} className="uppercase text-sm pr-1 whitespace-nowrap">
                  {text}&nbsp;
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </a>
  );
}

/** Clipte wordmark (icon + BETA + CLIPTE). */
export function ClipteLogo({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className={`${lg ? 'size-9' : 'size-6 md:size-7!'} shrink-0 bg-current`}
        style={{
          WebkitMaskImage: 'url(/icon.svg)',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskImage: 'url(/icon.svg)',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
        }}
      />
      <span className="flex flex-col leading-none">
        <span className={`${lg ? 'text-[10px]' : 'text-[8px] md:text-[9px]!'} uppercase tracking-[0.18em] opacity-70`}>Beta</span>
        <span className={`${lg ? 'text-xl' : 'text-sm md:text-base!'} font-medium uppercase tracking-[0.12em]`}>Clipte</span>
      </span>
    </span>
  );
}

/**
 * Thin Pensatori-style scroll indicator that replaces the native scrollbar on
 * the landing page. Fades in while scrolling; drag the thumb or click the track.
 */
export function ScrollIndicator() {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    if (!root || !thumb) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const trackH = root.clientHeight;
      const thumbH = Math.max(28, trackH * (window.innerHeight / doc.scrollHeight));
      const progress = max > 0 ? window.scrollY / max : 0;
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translateY(${progress * (trackH - thumbH)}px)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      setVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), 1200);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      clearTimeout(hideTimer);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Map a pointer position on the track to a scroll position
  const scrollToPointer = (clientY: number, immediate: boolean) => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    if (!root || !thumb) return;
    const r = root.getBoundingClientRect();
    const thumbH = thumb.offsetHeight;
    const ratio = Math.min(1, Math.max(0, (clientY - r.top - thumbH / 2) / (r.height - thumbH)));
    const target = ratio * (document.documentElement.scrollHeight - window.innerHeight);
    if (window.__lenis) window.__lenis.scrollTo(target, { immediate });
    else window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    scrollToPointer(e.clientY, false);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) scrollToPointer(e.clientY, true);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pi-scrollbar ${visible ? 'is-visible' : ''} ${dragging ? 'is-dragging' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="pi-scrollbar__track" />
      <div ref={thumbRef} className="pi-scrollbar__thumb" />
    </div>
  );
}
