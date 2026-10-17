'use client';

import React, { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('clipping_theme') as Theme) || 'light';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      // System mode
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    }
  };

  const handleSelect = (selected: Theme) => {
    setTheme(selected);
    localStorage.setItem('clipping_theme', selected);
    applyTheme(selected);
  };

  if (!mounted) {
    return (
      <div className="relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border opacity-70">
        <div className="h-6 w-6 rounded-full" />
        <div className="h-6 w-6 rounded-full" />
        <div className="h-6 w-6 rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border items-center">
      
      {/* 1. System Theme Button */}
      <button
        type="button"
        aria-label="System theme"
        onClick={() => handleSelect('system')}
        className="relative h-6 w-6 rounded-full touch-interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center transition-colors"
      >
        {theme === 'system' && (
          <div className="absolute inset-0 rounded-full bg-secondary shadow-sm ring-1 ring-border" />
        )}
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 576 512"
          className={`relative z-10 m-auto h-4 w-4 transition-colors ${
            theme === 'system' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 224L64 288 64 64l448 0z" />
        </svg>
      </button>

      {/* 2. Light Theme Button */}
      <button
        type="button"
        aria-label="Light theme"
        onClick={() => handleSelect('light')}
        className="relative h-6 w-6 rounded-full touch-interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center transition-colors"
      >
        {theme === 'light' && (
          <div className="absolute inset-0 rounded-full bg-secondary shadow-sm ring-1 ring-border" />
        )}
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 512 512"
          className={`relative z-10 m-auto h-4 w-4 transition-colors ${
            theme === 'light' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
        </svg>
      </button>

      {/* 3. Dark Theme Button */}
      <button
        type="button"
        aria-label="Dark theme"
        onClick={() => handleSelect('dark')}
        className="relative h-6 w-6 rounded-full touch-interactive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center transition-colors"
      >
        {theme === 'dark' && (
          <div className="absolute inset-0 rounded-full bg-secondary shadow-sm ring-1 ring-border" />
        )}
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 384 512"
          className={`relative z-10 m-auto h-4 w-4 transition-colors ${
            theme === 'dark' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
        </svg>
      </button>

    </div>
  );
}
