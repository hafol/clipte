'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Shield, Users, DollarSign } from '@/components/icons';

export default function TwoSidesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] bg-[#07080B]">
      <div className="max-w-[85rem] mx-auto space-y-16">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="font-mono text-xs uppercase tracking-widest text-white/50">
            NETWORK DYNAMICS
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Two sides of the same network.
          </h2>
          <p className="text-sm sm:text-base text-white/70">
            Clippers get paid per view. Brands get reach they only pay for when it is verified.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
          
          {/* For Clippers */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>FOR CLIPPERS & EDITORS</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Turn your editing skills into predictable weekly income.
              </h3>

              <p className="text-sm text-white/70 leading-relaxed">
                You don't need millions of followers. You just need a knack for editing hooks and viral pacing. Post clips to your accounts and get rewarded for every single view.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Transparent CPM rates ($10 to $300+ per 100k views)</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct access to source vods, raw streams, and brand assets</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated escrow payouts every 7 days</span>
                </div>
              </div>
            </div>

            <div>
              <Link
                href="#campaigns"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-md"
              >
                <span>Browse Open Campaigns</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* For Brands */}
          <div id="brands" className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>FOR CREATORS & BRANDS</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Amplify your reach with an army of 77,000+ clippers.
              </h3>

              <p className="text-sm text-white/70 leading-relaxed">
                Launch a bounty pool in minutes. Thousands of talented clippers will generate hundreds of high-performing reels, shorts, and TikToks promoting your product or stream.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Pay-for-Performance model — only pay for verified views</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Deep AI fraud prevention and duplicate view filtering</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Full brand safety and content guideline enforcement</span>
                </div>
              </div>
            </div>

            <div>
              <Link
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Launch Brand Campaign</span>
                <ArrowRight className="w-4 h-4 text-white/50" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
