'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import kk from '@/locales/kk.json';

export type Language = 'en' | 'ru' | 'kk';

const translations: Record<Language, any> = { en, ru, kk };

interface LanguageContextType {
  lang: Language;
  language: Language;
  setLang: (lang: Language) => void;
  t: (keyPath: string) => string;
  tr: <T = any>(keyPath: string) => T | undefined;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  language: 'en',
  setLang: () => {},
  t: (keyPath: string) => keyPath,
  tr: () => undefined,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

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
    <LanguageContext.Provider value={{ lang, language: lang, setLang, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
