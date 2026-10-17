'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Volume2, VolumeX, TrendingUp } from '@/components/icons';

export default function HeroSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [liveViews, setLiveViews] = useState(428190);

  // Live ticking counter
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveViews((v) => v + Math.floor(Math.random() * 5) + 2);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const brandLogos = [
    { name: 'DoorDash', src: '/clients/doordash-logo.webp', height: 'h-4' },
    { name: 'Cluely', src: '/clients/cluely-logo.webp', height: 'h-5' },
    { name: 'Kick', src: '/clients/kick-logo.webp', height: 'h-6' },
    { name: 'Stake', src: '/clients/stake-logo.webp', height: 'h-7' },
    { name: 'Crocs', src: '/clients/crocs-logo.webp', height: 'h-5' },
    { name: 'Pudgy Penguins', src: '/clients/pudgy-penguins-logo.webp', height: 'h-7' },
    { name: 'Weedmaps', src: '/clients/weedmaps-logo.webp', height: 'h-5' },
    { name: 'HyperX', src: '/clients/hyperx-logo.webp', height: 'h-6' },
    { name: 'Lucy', src: '/clients/lucy-logo.webp', height: 'h-6' },
    { name: 'Capitol Records', src: '/clients/capitolrecords-logo.webp', height: 'h-7' },
    { name: 'Atlantic Records', src: '/clients/atlanticrecords-logo.webp', height: 'h-8' },
    { name: 'Photon', src: '/clients/photon-logo.webp', height: 'h-4' },
  ];

  return (
    <section className="relative w-full pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] overflow-hidden bg-[#07080B]">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-[85rem] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        
        {/* Left Column: Text & CTAs */}
        <div className="flex-1 max-w-2xl space-y-6 text-center lg:text-left">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>The original and largest clipping network</span>
          </div>

          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Clip · Post · Get Paid
          </p>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.04em] text-white leading-[1.05]">
            Grow, Earn, and Go Viral <br />
            <span className="text-white">with CLIPPING</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
            A creative marketplace uniting brands and digital talent. Brands can start campaigns that engage expert clippers to craft viral content, amplify reach, and generate real revenue.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
            <Link
              href="#campaigns"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <span>Start Clipping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="#contact"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Start Campaign</span>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </Link>
          </div>

          {/* Stat Boxes */}
          <div className="pt-6 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 font-mono text-left">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center lg:text-left">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                $60M+
              </div>
              <div className="text-[11px] text-white/50 mt-1 font-sans">
                paid to clippers
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center lg:text-left">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                77,000+
              </div>
              <div className="text-[11px] text-white/50 mt-1 font-sans">
                clippers ready
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center lg:text-left">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                200+
              </div>
              <div className="text-[11px] text-white/50 mt-1 font-sans">
                brand campaigns
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Phone Mockup with Real Playing Short Video */}
        <div className="shrink-0 w-full max-w-[340px] flex flex-col items-center justify-center">
          
          <div className="w-full rounded-[42px] p-3 bg-gradient-to-b from-white/20 via-white/5 to-white/10 border border-white/20 phone-shadow relative select-none">
            
            {/* Screen Box */}
            <div className="aspect-[9/16] rounded-[34px] overflow-hidden relative bg-black border border-white/10 shadow-2xl">
              
              {/* Working Embedded Video / Shorts Loop */}
              <div className="absolute inset-0 w-full h-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/qGRgUSg4TlA?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=qGRgUSg4TlA&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1`}
                  title="Larry Wheels / Arman Tsarukyan Viral Clip"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  className="w-full h-full object-cover scale-[1.35] pointer-events-none"
                />
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

              {/* Top Bar: Live Views Indicator */}
              <div className="relative z-10 p-4 flex justify-between items-center text-xs font-mono">
                <span className="px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-white font-semibold backdrop-blur text-[11px]">
                  Kick & YT Short
                </span>

                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-emerald-400 font-bold backdrop-blur text-[11px]">
                  <TrendingUp className="w-3 h-3" />
                  <span>{liveViews.toLocaleString()} views</span>
                </span>
              </div>

              {/* Bottom Sound & Payout Controller */}
              <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2.5">
                <div className="flex items-center justify-between bg-black/80 p-2.5 rounded-xl border border-white/10 backdrop-blur">
                  <div className="text-left">
                    <div className="text-[10px] text-white/50 font-mono uppercase">Verified Payout</div>
                    <div className="font-display font-extrabold text-sm text-emerald-400">
                      +$856.38 Paid Out
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-white/70" />
                        <span>Unmute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-white" />
                        <span>Sound On</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Social Platform Badges */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {['tiktok', 'youtube', 'instagram', 'x', 'kick'].map((platform) => (
              <span
                key={platform}
                className="px-3 py-1 rounded-full text-[11px] font-mono uppercase text-white/60 bg-white/[0.04] border border-white/10"
              >
                {platform}
              </span>
            ))}
          </div>

        </div>

      </div>

      {/* Infinite Brand Marquee */}
      <div className="mt-20 pt-8 border-t border-white/[0.06] flex items-center gap-6 overflow-hidden">
        <div className="hidden sm:block shrink-0 pr-6 border-r border-white/10 text-xs text-white/40 font-mono uppercase tracking-wider whitespace-nowrap">
          Trusted by top brands
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee gap-8 sm:gap-12 items-center opacity-75 hover:opacity-100 transition-opacity">
            {[...brandLogos, ...brandLogos].map((b, bIdx) => (
              <img
                key={bIdx}
                src={b.src}
                alt={b.name}
                className={`${b.height} w-auto object-contain shrink-0 grayscale hover:grayscale-0 transition-all`}
              />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
