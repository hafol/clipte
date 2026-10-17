'use client';

import React from 'react';
import { ArrowRight, Flame, Users, Sparkles } from '@/components/icons';
import { sound } from '@/components/audio/SoundManager';

export function Navbar() {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl">
      <nav className="pro-card rounded-full px-5 sm:px-7 py-3 flex items-center justify-between shadow-2xl transition-all duration-300">
        
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 group"
          onMouseEnter={() => sound.playHover()}
        >
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="font-display font-extrabold text-base tracking-tight text-white flex items-center gap-1">
            CLIPP<span className="text-[#8E9BAE]">.NETWORK</span>
          </span>
        </a>

        {/* Clear Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[#8E9BAE]">
          <a
            href="#campaigns"
            onMouseEnter={() => sound.playHover()}
            onClick={() => sound.playClick()}
            className="hover:text-white transition-colors"
          >
            Explore Campaigns
          </a>
          <a
            href="#how-it-works"
            onMouseEnter={() => sound.playHover()}
            onClick={() => sound.playClick()}
            className="hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#leaderboard"
            onMouseEnter={() => sound.playHover()}
            onClick={() => sound.playClick()}
            className="hover:text-white transition-colors"
          >
            Top Clippers
          </a>
          <a
            href="#calculator"
            onMouseEnter={() => sound.playHover()}
            onClick={() => sound.playClick()}
            className="hover:text-white transition-colors"
          >
            Earnings Calculator
          </a>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="#waitlist"
            onMouseEnter={() => sound.playHover()}
            onClick={() => sound.playClick()}
            className="hidden sm:inline-block text-xs font-medium text-[#8E9BAE] hover:text-white transition-colors px-3 py-1.5"
          >
            Creators Login
          </a>

          <a
            href="#waitlist"
            onMouseEnter={() => sound.playHover()}
            onClick={() => sound.playClick()}
            className="btn-white px-4 sm:px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Join Early Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </nav>
    </header>
  );
}
