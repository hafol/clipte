'use client';

import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';

interface LanguageSwitcherProps {
  size?: 'sm' | 'md';
}

export default function LanguageSwitcher({ size = 'md' }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  const options: { id: Language; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'ru', label: 'РУС' },
    { id: 'kk', label: 'ҚАЗ' },
  ];

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center rounded-full border font-mono transition-all duration-300 select-none
        bg-white/25 dark:bg-[#07080B]/40 
        border-black/[0.08] dark:border-white/[0.12] 
        backdrop-blur-xl shadow-xs ${isSmall ? 'p-0.5 text-[10px]' : 'p-1 text-[11px]'}`}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLang(opt.id)}
          className={`rounded-full transition-all duration-200 cursor-pointer font-semibold ${
            isSmall ? 'px-1.5 py-0.5' : 'px-2.5 py-1'
          } ${
            lang === opt.id
              ? 'bg-foreground text-background shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
