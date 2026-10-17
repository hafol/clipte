'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Zap } from '@/components/icons';

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'clippers' | 'brands'>('clippers');
  const [selectedCampaign, setSelectedCampaign] = useState<number>(1);

  const campaigns = [
    {
      id: 1,
      title: 'Kick Clipping',
      badge: 'Active • 50 days left',
      rate: '$300',
      rateSub: 'Up to per 100k views',
      avatar: '/clients/kick.webp',
      pot: '$25,000 Pool',
      minViews: 'Min 100K views to qualify',
      platforms: ['TikTok', 'Instagram', 'YouTube', 'X'],
    },
    {
      id: 2,
      title: 'Stake Bounties',
      badge: 'Active • 40 days left',
      rate: '$300',
      rateSub: 'Up to per 100k views',
      avatar: '/clients/stake-logo.webp',
      pot: '$40,000 Pool',
      minViews: 'Min 10K views to qualify',
      platforms: ['TikTok', 'Instagram', 'YouTube', 'X'],
    },
    {
      id: 3,
      title: 'Drake Official Clips',
      badge: 'Active • 31 days left',
      rate: '$40',
      rateSub: 'Up to per 100k views',
      avatar: '/clients/young-thug.webp',
      pot: '$15,000 Pool',
      minViews: 'Min 100K views to qualify',
      platforms: ['TikTok', 'Instagram', 'X'],
    },
    {
      id: 4,
      title: 'PlaqueBoyMax Stream',
      badge: 'Active • 300 days left',
      rate: '$4,000',
      rateSub: 'Bounty Pot Competition',
      avatar: '/clients/plaqueboymax.webp',
      pot: '$10,000 Pool',
      minViews: 'Min 500K views to qualify',
      platforms: ['TikTok', 'Instagram', 'YouTube'],
    },
  ];

  return (
    <section id="campaigns" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] bg-[#07080B]">
      <div className="max-w-[85rem] mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl text-left">
            <div className="font-mono text-xs uppercase tracking-widest text-white/50">
              HOW IT WORKS
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Three steps to your first payout.
            </h2>
            <p className="text-sm sm:text-base text-white/70">
              No following, no application, no catch. Pick a campaign, post your clips, and watch the views turn into earnings.
            </p>
          </div>

          {/* Toggle Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.04] border border-white/10 self-start">
            <button
              onClick={() => setActiveTab('clippers')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'clippers'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              For clippers
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'brands'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              For brands
            </button>
          </div>
        </div>

        {/* 4 Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {campaigns.map((camp) => {
            const isSelected = selectedCampaign === camp.id;
            return (
              <div
                key={camp.id}
                onClick={() => setSelectedCampaign(camp.id)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/40 shadow-2xl scale-[1.02]'
                    : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/20'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden p-1.5">
                      <img src={camp.avatar} alt={camp.title} className="w-full h-full object-contain" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                      {camp.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-white">
                      {camp.title}
                    </h3>
                    <div className="text-xs text-white/50 mt-0.5 font-mono">{camp.pot}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 font-mono">
                    <div className="text-[10px] text-white/40 uppercase">Payout Rate</div>
                    <div className="font-display text-xl font-extrabold text-white">
                      {camp.rate}{' '}
                      <span className="text-xs text-white/50 font-normal font-sans">
                        {camp.rateSub}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 text-[11px] text-white/50 flex items-center justify-between">
                  <span>{camp.minViews}</span>
                  <span className="text-white font-semibold">Join Campaign →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Step Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-4">
          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <span className="font-mono text-xs text-white/40">STEP 01</span>
            <h4 className="font-display text-xl font-bold text-white">Pick a Campaign</h4>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-normal">
              Select from 200+ brand campaigns. Access high-definition source video files, stream recordings, and guideline packs directly from your dashboard.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <span className="font-mono text-xs text-white/40">STEP 02</span>
            <h4 className="font-display text-xl font-bold text-white">Post Your Clips</h4>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-normal">
              Edit hooks, kinetic captions, and viral cuts. Post them to your verified TikTok, YouTube Shorts, Instagram Reels, or X accounts.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <span className="font-mono text-xs text-white/40">STEP 03</span>
            <h4 className="font-display text-xl font-bold text-white">Get Paid Weekly</h4>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-normal">
              Every view is tracked and verified in real time. Payouts land directly into your crypto or bank account on automated weekly cycles.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
