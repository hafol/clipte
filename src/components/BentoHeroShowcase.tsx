'use client';

import React, { useState, useRef } from 'react';

export default function BentoHeroShowcase() {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto lg:max-w-none grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* =========================================================================
          MAIN BENTO CARD 1: Featured Reel Video Player (Spans 2 columns on desktop)
         ========================================================================= */}
      <div className="col-span-1 md:col-span-2 relative group overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-primary/40">
        
        {/* Top Header Bar inside Video Container */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-medium tracking-wide uppercase text-white/90">
              Live Campaign
            </span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
            2.8M Views
          </span>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video sm:aspect-[16/10] w-full overflow-hidden bg-neutral-950">
          <video
            ref={videoRef}
            src="https://clipping.net/clients/videos/video-1.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Bottom Gradient & Sound Control Button */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-3.5 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div>
              <p className="text-xs font-semibold text-white font-display">Adin Ross & Kai Cenat</p>
              <p className="text-[11px] text-white/70">Top Creator Campaign</p>
            </div>

            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-lg backdrop-blur-md"
              aria-label="Toggle Sound"
            >
              {muted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO CARD 2: Live Payouts Ticker
         ========================================================================= */}
      <div className="col-span-1 p-4 rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/90 font-display">Live Payouts</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            ● Realtime
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-neutral-800/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                A
              </div>
              <span className="text-white/80">@alex_clips</span>
            </div>
            <span className="font-bold text-emerald-400">+$340.00</span>
          </div>

          <div className="p-2 rounded-lg bg-neutral-800/50 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                K
              </div>
              <span className="text-white/80">@kirill_vids</span>
            </div>
            <span className="font-bold text-emerald-400">+$185.50</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BENTO CARD 3: Platform Share Distribution
         ========================================================================= */}
      <div className="col-span-1 p-4 rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/90 font-display">Platform Reach</span>
          <span className="text-[10px] font-mono text-muted-foreground">3 Channels</span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono text-white/80">
              <span>TikTok</span>
              <span>58%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[58%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono text-white/80">
              <span>Instagram Reels</span>
              <span>27%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full w-[27%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1 font-mono text-white/80">
              <span>YouTube Shorts</span>
              <span>15%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full w-[15%]" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
