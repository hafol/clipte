import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import IconMotion from '@/components/icons/IconMotion';

export const metadata: Metadata = {
  // absolute URLs for link previews and canonical tags
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://clipte.vercel.app'),
  title: 'Clipte | Turn Short Clips into Viral Reach & Income',
  description:
    'Get paid to clip. Join brand campaigns and earn per view on TikTok, YouTube Shorts & Instagram Reels.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* SVG icon adapts to light/dark browser chrome; .ico is the fallback for older browsers */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Apply saved theme before paint (landing defaults to light) */}
        <Script
          id="pi-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('clipping_theme')||'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);r.style.colorScheme=d?'dark':'light'}catch(e){}`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Ballet:opsz@16..72&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap&subset=cyrillic,cyrillic-ext"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen antialiased selection:bg-primary/20">
        <IconMotion />
        <LanguageProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
