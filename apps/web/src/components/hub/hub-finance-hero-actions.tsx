'use client';

import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { HubHeroSearch } from '@/components/hub/hub-hero-search';

export function HubFinanceHeroActions({
  searchPlaceholder,
  searchPath = '/search',
  ctaHref = '/calculators/emi',
  ctaLabel = 'Calculate your EMI',
}: {
  searchPlaceholder: string;
  searchPath?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mt-6 max-w-xl space-y-4">
      <Link
        href={ctaHref}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
      >
        <Calculator className="h-4 w-4 shrink-0" aria-hidden />
        {ctaLabel}
      </Link>
      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 sm:p-4">
        <p className="mb-2 text-sm font-medium text-slate-500">Search products & calculators</p>
        <HubHeroSearch
          placeholder={searchPlaceholder}
          searchPath={searchPath}
          variant="secondary"
        />
      </div>
    </div>
  );
}
