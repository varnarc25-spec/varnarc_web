import en from './messages/en.json';
import hi from './messages/hi.json';

export const locales = ['en', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const catalogs: Record<Locale, typeof en> = { en, hi };

export function getMessages(locale: Locale = defaultLocale) {
  return catalogs[locale] ?? catalogs.en;
}

export function t(
  key: string,
  locale: Locale = defaultLocale,
): string {
  const messages = getMessages(locale) as Record<string, Record<string, string>>;
  const [ns, leaf] = key.split('.');
  if (!ns || !leaf) return key;
  return messages[ns]?.[leaf] ?? key;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
