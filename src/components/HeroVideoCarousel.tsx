'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PolaroidCard {
  id: number;
  videoId: string;
  title: string;
  views: string;
  payout: string;
  desktopTop: string;
  desktopLeft: string;
  desktopWidth: string;
  desktopRotateClass: string;
  mobileRotateClass: string;
  zIndex: number;
  buttonPosition: 'top-right' | 'bottom-right';
}

const POLAROID_CARDS: PolaroidCard[] = [
  {
    id: 1,
    videoId: 'qGRgUSg4TlA',
    title: 'Adrien Broner & Tsarukyan Viral Clip',
    views: '892,140 views',
    payout: '+$1,420.50',
    desktopTop: 'md:top-[2%]! lg:top-[3%]!',
    desktopLeft: 'md:left-[0%]! lg:left-[0%]!',
    desktopWidth: 'w-[230px] sm:w-[250px]! lg:w-[255px]! xl:w-[275px]!',
    desktopRotateClass: 'md:-rotate-[5deg]!',
    mobileRotateClass: '-rotate-[2deg]',
    zIndex: 10,
    buttonPosition: 'top-right',
  },
  {
    id: 2,
    videoId: 'kJQP7kiw5Fk',
    title: 'Larry Wheels Ninja Warrior Challenge',
    views: '1,450,000 views',
    payout: '+$2,300.00',
    desktopTop: 'md:top-[14%]! lg:top-[16%]!',
    desktopLeft: 'md:left-[24%]! lg:left-[175px]! xl:left-[200px]!',
    desktopWidth: 'w-[260px] sm:w-[280px]! lg:w-[290px]! xl:w-[315px]!',
    desktopRotateClass: 'md:-rotate-[2deg]!',
    mobileRotateClass: '-rotate-[1deg]',
    zIndex: 30, // Largest card on top
    buttonPosition: 'bottom-right',
  },
  {
    id: 3,
    videoId: 'lcGku-xZ3ok',
    title: 'How Clippers Make Real Revenue',
    views: '2,100,000 views',
    payout: '+$3,400.00',
    desktopTop: 'md:top-[4%]! lg:top-[6%]!',
    desktopLeft: 'md:left-[50%]! lg:left-[365px]! xl:left-[415px]!',
    desktopWidth: 'w-[240px] sm:w-[260px]! lg:w-[265px]! xl:w-[285px]!',
    desktopRotateClass: 'md:rotate-[6deg]!',
    mobileRotateClass: 'rotate-[2deg]',
    zIndex: 20,
    buttonPosition: 'bottom-right',
  },
];

export default function HeroVideoCarousel() {
  const collageRef = useRef<HTMLDivElement>(null);

  // Perf: pause the YouTube embeds while the hero is off screen (enablejsapi=1)
  useEffect(() => {
    const el = collageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Videos autoplay on load, so only send commands on actual visibility changes
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === visible) return;
      visible = entry.isIntersecting;
      const func = visible ? 'playVideo' : 'pauseVideo';
      el.querySelectorAll('iframe').forEach((f) =>
        f.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*')
      );
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [activeSoundId, setActiveSoundId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loadedIframes, setLoadedIframes] = useState<Record<number, boolean>>({});

  const toggleSound = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSoundId((prev) => (prev === id ? null : id));
  };

  const handleIframeLoad = (id: number) => {
    setLoadedIframes((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full relative flex justify-center lg:justify-end! select-none py-4">
      {/* Container Collage (Polaroid cards) */}
      <div ref={collageRef} className="collage relative w-full max-w-xl min-h-[580px] lg:h-[620px]! flex flex-col md:block! items-center justify-center gap-8 md:gap-0!">
        
        {POLAROID_CARDS.map((card) => {
          const isUnmuted = activeSoundId === card.id;
          const isHovered = hoveredId === card.id;
          const isReady = loadedIframes[card.id];

          return (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredId(card.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`card relative md:absolute! ${card.desktopTop} ${card.desktopLeft} ${card.desktopWidth} aspect-[9/16] 
                bg-white dark:bg-[#1f1f1f]! p-2.5 md:p-3! rounded-none border border-black/5 dark:border-white/10!
                shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]!
                transition-all duration-400 ease-out cursor-pointer group
                ${isHovered ? 'rotate-0 scale-105 -translate-y-2' : `${card.mobileRotateClass} ${card.desktopRotateClass}`}`}
              style={{
                zIndex: isHovered ? 50 : card.zIndex,
              }}
            >
              {/* Inner Video Container */}
              <div className="w-full h-full relative overflow-hidden rounded-none bg-neutral-950">
                {/* Instant Poster Thumbnail (Eliminates black screen flash while video buffers) */}
                <img
                  src={`https://img.youtube.com/vi/${card.videoId}/hqdefault.jpg`}
                  alt={card.title}
                  className={`absolute inset-0 w-full h-full object-cover scale-[1.35] transition-opacity duration-700 pointer-events-none ${
                    isReady ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="eager"
                />

                {/* Embedded Video */}
                <iframe
                  key={`${card.id}-${isUnmuted ? 'sound-on' : 'sound-off'}`}
                  onLoad={() => handleIframeLoad(card.id)}
                  src={`https://www.youtube-nocookie.com/embed/${card.videoId}?autoplay=1&mute=${
                    isUnmuted ? 0 : 1
                  }&loop=1&playlist=${card.videoId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                  title={card.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  className={`w-full h-full object-cover pointer-events-none scale-[1.35] transition-opacity duration-500 ${
                    isReady ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Circular Sound Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => toggleSound(card.id, e)}
                  aria-label={isUnmuted ? 'Mute sound' : 'Unmute sound'}
                  className={`sound pi-notch absolute z-30 w-11 h-11 sm:w-12! sm:h-12!
                    bg-[#434343]/90 hover:bg-[#1f1f1f] text-white backdrop-blur-md 
                    flex items-center justify-center transition-all duration-200 
                    hover:scale-110 active:scale-95 cursor-pointer shadow-lg ${
                      card.buttonPosition === 'top-right' ? 'top-3 right-3' : 'bottom-3 right-3'
                    }`}
                >
                  {isUnmuted ? (
                    <svg
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 576 512"
                      className="w-5 h-5 text-emerald-400 animate-pulse"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zm233.15-5.12c-6.24-6.24-16.38-6.24-22.62 0-6.25 6.24-6.25 16.38 0 22.62 97.2 97.2 97.2 255.54 0 352.74-6.25 6.24-6.25 16.38 0 22.62 6.24 6.24 16.38 6.24 22.62 0 109.66-109.66 109.66-288.32 0-397.98z" />
                    </svg>
                  ) : (
                    <svg
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 576 512"
                      className="w-5 h-5 text-white/80"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
