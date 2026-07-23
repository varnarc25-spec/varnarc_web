'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { defaultLocale, getMessages, t as translate, type Locale } from '@/i18n';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  messages: ReturnType<typeof getMessages>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(key, locale),
      messages: getMessages(locale),
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
