'use client';

import { useI18n } from '@/providers/i18n-provider';
import type { Locale } from '@/i18n';

export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <label className="hidden items-center gap-1 text-xs font-medium text-slate-600 sm:inline-flex">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        aria-label="Select language"
      >
        <option value="en">EN</option>
        <option value="hi">HI</option>
      </select>
    </label>
  );
}
