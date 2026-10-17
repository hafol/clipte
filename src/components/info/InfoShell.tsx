'use client';

import React from 'react';
import OfficialNavbar from '@/components/OfficialNavbar';
import OfficialFooter from '@/components/OfficialFooter';
import { PauseOffscreen, ScrollIndicator } from '@/components/pi';

/** Shared frame for landing-styled pages: navbar, footer, custom scrollbar. */
export default function InfoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pi flex flex-col min-h-screen antialiased">
      <OfficialNavbar />
      <main className="flex-1 w-full">{children}</main>
      <OfficialFooter />
      <PauseOffscreen />
      <ScrollIndicator />
    </div>
  );
}
