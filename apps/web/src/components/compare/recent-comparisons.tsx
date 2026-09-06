'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, History } from 'lucide-react';
import { COMPARE_CATEGORY_META } from '@/lib/compare-hub';
import {
  parseRecentComparisons,
  RECENT_COMPARISONS_KEY,
  type RecentComparison,
} from '@/lib/recent-comparisons';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export function RecentComparisons() {
  const [items, setItems] = useState<RecentComparison[]>([]);

  useEffect(() => {
    setItems(parseRecentComparisons(localStorage.getItem(RECENT_COMPARISONS_KEY)));
  }, []);

  if (!items.length) return null;

  return (
    <section aria-labelledby="recent-comparisons-heading">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-blue-600" aria-hidden />
        <h2
          id="recent-comparisons-heading"
          className="text-xl font-bold text-slate-950 sm:text-2xl"
        >
          Your recent comparisons
        </h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Continue a comparison you recently started on this device.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() =>
              trackAnalyticsEvent({
                eventType: 'custom',
                entityType: 'comparison',
                path: item.href,
                metadata: {
                  eventName: 'comparison_recent_opened',
                  category: item.category,
                },
              })
            }
            className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">
              {COMPARE_CATEGORY_META[item.category].badge}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-950">
              {item.optionA} <span className="text-slate-400">vs</span> {item.optionB}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
              Continue <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
