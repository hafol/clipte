'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import kk from '@/locales/kk.json';
import { setMoneyState, guessCurrency, type Currency } from '@/lib/money';

export type Language = 'en' | 'ru' | 'kk';

const translations: Record<Language, any> = { en, ru, kk };

interface LanguageContextType {
  lang: Language;
  language: Language;
  setLang: (lang: Language) => void;
  t: (keyPath: string) => string;
  tr: <T = any>(keyPath: string) => T | undefined;
  /** display currency for money(); amounts are stored and paid in USD */
  currency: Currency;
  setCurrency: (c: Currency) => void;
  fx: { rate: number | null; date: string | null; source: string | null };
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  language: 'en',
  setLang: () => {},
  t: (keyPath: string) => keyPath,
  tr: () => undefined,
  currency: 'USD',
  setCurrency: () => {},
  fx: { rate: null, date: null, source: null },
});

type Fx = { rate: number | null; date: string | null; source: string | null; country?: string | null; at?: number };
const FX_KEY = 'app_fx';
const CUR_KEY = 'app_currency';
const readJson = <T,>(k: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [fx, setFx] = useState<Fx>({ rate: null, date: null, source: null });

  // tenge rate (cached for 3h) + default currency for viewers who haven't picked one
  useEffect(() => {
    let saved: Currency | null = null;
    try {
      const c = localStorage.getItem(CUR_KEY);
      if (c === 'USD' || c === 'KZT') saved = c;
    } catch {}
    const cached = readJson<Fx>(FX_KEY);
    if (cached?.rate) setFx(cached);
    if (saved) setCurrencyState(saved);
    else if (cached) setCurrencyState(guessCurrency(cached.country));

    if (cached?.at && Date.now() - cached.at < 3 * 3600_000) return;
    fetch('/api/fx')
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) return;
        const next: Fx = { rate: j.rate, date: j.date, source: j.source, country: j.country, at: Date.now() };
        setFx(next);
        if (!saved) setCurrencyState(guessCurrency(j.country));
        try {
          localStorage.setItem(FX_KEY, JSON.stringify(next));
        } catch {}
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CUR_KEY, c);
    } catch {}
  };

  // money() reads this; set during render so the whole re-render uses the new currency
  setMoneyState(fx.rate ? currency : 'USD', fx.rate);

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'kk')) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current = translations[lang] || translations.en;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English if key is missing in current language
        let fallback = translations.en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === 'string' ? fallback : keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  // Raw lookup for arrays / objects (e.g. list rows), with English fallback
  const tr = <T = any,>(keyPath: string): T | undefined => {
    const resolve = (root: any) =>
      keyPath.split('.').reduce((node, k) => (node == null ? undefined : node[k]), root);
    return (resolve(translations[lang]) ?? resolve(translations.en)) as T | undefined;
  };

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, t, tr, currency, setCurrency, fx }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
