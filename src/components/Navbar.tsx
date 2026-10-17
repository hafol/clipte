'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, ArrowRight } from '@/components/icons';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 px-2 sm:px-4 pt-2">
      <header className="relative w-full z-50">
        <nav
          className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8 py-2 rounded-2xl border border-white/10 bg-[#07080B]/80 backdrop-blur-xl shadow-2xl transition-all"
        >
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
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
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest leading-none">
                    Beta
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    Clipping
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center space-x-1">
                {/* Product Dropdown */}
                <div className="relative group">
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white group bg-transparent cursor-pointer"
                  >
                    Product
                    <ChevronDown className="ml-1 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 text-white/50" />
                  </button>
                  <div className="absolute top-full left-0 hidden group-hover:block pt-2 w-56">
                    <div className="rounded-xl border border-white/10 bg-[#0C0D12]/95 backdrop-blur-xl p-2 shadow-2xl space-y-1">
                      <Link
                        href="#campaigns"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Get Paid to Clip
                      </Link>
                      <Link
                        href="#brands"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        For Brands
                      </Link>
                      <Link
                        href="#campaigns"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Campaigns
                      </Link>
                      <Link
                        href="#enterprise"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Enterprise
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Guides Dropdown */}
                <div className="relative group">
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white group bg-transparent cursor-pointer"
                  >
                    Guides
                    <ChevronDown className="ml-1 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 text-white/50" />
                  </button>
                  <div className="absolute top-full left-0 hidden group-hover:block pt-2 w-60">
                    <div className="rounded-xl border border-white/10 bg-[#0C0D12]/95 backdrop-blur-xl p-2 shadow-2xl space-y-1">
                      <Link
                        href="#guides"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        How to Become a Clipper?
                      </Link>
                      <Link
                        href="#guides"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        How Much Do Clippers Make?
                      </Link>
                      <Link
                        href="#guides"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        TikTok Clipper Guide
                      </Link>
                      <Link
                        href="#guides"
                        className="block rounded-lg px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        YouTube Shorts Guide
                      </Link>
                    </div>
                  </div>
                </div>

                <Link
                  href="#leaders"
                  className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Talent & Brands
                </Link>

                <Link
                  href="#contact"
                  className="inline-flex h-9 items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="#login"
                className="hidden sm:inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Log In
              </Link>
              
              <Link
                href="#login"
                className="inline-flex items-center justify-center h-9 px-5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-white/10 space-y-2 pb-2 text-left">
              <Link
                href="#campaigns"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
              >
                Campaigns
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
              >
                How It Works
              </Link>
              <Link
                href="#leaders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
              >
                Creators & Brands
              </Link>
              <Link
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10"
              >
                Contact
              </Link>
            </div>
          )}
        </nav>
      </header>
    </div>
  );
}
