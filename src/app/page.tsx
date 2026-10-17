'use client';

import React from 'react';
import OfficialNavbar from '@/components/OfficialNavbar';
import OfficialHeroSection from '@/components/OfficialHeroSection';
import OfficialBrandMarquee from '@/components/OfficialBrandMarquee';
import OfficialHowItWorksSection from '@/components/OfficialHowItWorksSection';
import ProClipteGridSection from '@/components/ProClipteGridSection';
import OfficialIndustryLeadersSection from '@/components/OfficialIndustryLeadersSection';
import OfficialTwoSidesSection from '@/components/OfficialTwoSidesSection';
import OfficialFooter from '@/components/OfficialFooter';
import { PauseOffscreen, ScrollIndicator } from '@/components/pi';

export default function Home() {
  return (
    <div className="pi flex flex-col min-h-screen antialiased">
      {/* 1. Header Navigation */}
      <OfficialNavbar />

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* 2. Hero Section with Live Video */}
        <OfficialHeroSection />

        {/* Full-width Brand Logos Infinite Marquee */}
        <OfficialBrandMarquee />

        {/* 3. Five Steps (Number | Step) with floating stones */}
        <OfficialHowItWorksSection />

        {/* Band + Interactive Flip Grid: PRO / CLIPTE */}
        <ProClipteGridSection />

        {/* 4. The Creators and Brands Behind the Campaigns */}
        <OfficialIndustryLeadersSection />

        {/* 5. Two Sides. One Platform. Pick Yours. */}
        <OfficialTwoSidesSection />
      </main>

      {/* 6. Footer */}
      <OfficialFooter />

      {/* Perf: pause off-screen marquees / floating stones */}
      <PauseOffscreen />

      {/* Thin custom scrollbar (native one hidden on the landing) */}
      <ScrollIndicator />
    </div>
  );
}
