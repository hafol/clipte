'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#050608] border-t border-white/[0.08] text-xs text-white/60 text-left font-sans">
      <div className="max-w-[85rem] mx-auto space-y-12">
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded bg-white"
                style={{
                  WebkitMaskImage: 'url(/icon.svg)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskImage: 'url(/icon.svg)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                }}
                aria-label="CLIPPING"
              />
              <span className="font-display font-bold text-sm tracking-wider uppercase text-white">
                BETA CLIPPING
              </span>
            </div>
            <p className="text-xs text-white/40 max-w-xs leading-relaxed">
              The #1 platform for clippers to earn money creating viral short-form content for TikTok, YouTube Shorts, Instagram Reels, and X.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-white text-[11px] uppercase font-bold tracking-wider">Product</div>
            <ul className="space-y-2 text-white/50 text-xs">
              <li><Link href="#campaigns" className="hover:text-white transition-colors">Get Paid to Clip</Link></li>
              <li><Link href="#brands" className="hover:text-white transition-colors">For Brands</Link></li>
              <li><Link href="#campaigns" className="hover:text-white transition-colors">Campaigns</Link></li>
              <li><Link href="#enterprise" className="hover:text-white transition-colors">Enterprise</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-white text-[11px] uppercase font-bold tracking-wider">Guides</div>
            <ul className="space-y-2 text-white/50 text-xs">
              <li><Link href="#" className="hover:text-white transition-colors">How to Become a Clipper?</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">How Much Do Clippers Make?</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Clipping Side Hustle</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Freelance Clipper Guide</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-white text-[11px] uppercase font-bold tracking-wider">Platforms</div>
            <ul className="space-y-2 text-white/50 text-xs">
              <li><Link href="#" className="hover:text-white transition-colors">TikTok Guide</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">YouTube Shorts Guide</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Instagram Reels Guide</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">X/Twitter Guide</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-white text-[11px] uppercase font-bold tracking-wider">Legal</div>
            <ul className="space-y-2 text-white/50 text-xs">
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Clipper Terms</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-[11px] text-white/30 font-mono">
          <div>© {new Date().getFullYear()} CLIPPING NETWORK INC. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>Free to join · No following required</span>
            <span>Escrow Protected</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
