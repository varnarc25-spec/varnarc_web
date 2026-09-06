'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CompareCard, CompareCategoryKey } from '@/lib/compare-hub';
import { COMPARE_CATEGORY_META } from '@/lib/compare-hub';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

const tabs: Array<{ key: CompareCategoryKey; label: string }> = [
  { key: 'finance', label: 'Finance' },
  { key: 'cars', label: 'Cars' },
  { key: 'home', label: 'Home' },
  { key: 'solar', label: 'Solar' },
];

export function CompareHeroPreview({ cards }: { cards: CompareCard[] }) {
  const available = tabs.filter((tab) => cards.some((card) => card.category === tab.key));
  const [active, setActive] = useState<CompareCategoryKey>(available[0]?.key ?? 'cars');
  const featured = useMemo(() => cards.find((card) => card.category === active), [active, cards]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/70 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-600">
          Quick comparison
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Quick comparison category"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => {
                setActive(tab.key);
                trackAnalyticsEvent({
                  eventType: 'custom',
                  entityType: 'comparison',
                  metadata: {
                    eventName: 'compare_category_selected',
                    category: tab.key,
                    source: 'hero',
                  },
                });
              }}
              className={`min-h-8 rounded-full px-2.5 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 ${
                active === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-blue-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">
            {featured
              ? `Quick comparison of ${featured.optionA} and ${featured.optionB}`
              : `${COMPARE_CATEGORY_META[active].label} comparison preview`}
          </caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Attribute
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                {featured?.optionA ?? 'Option A'}
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                {featured?.optionB ?? 'Option B'}
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-600">
            {featured?.previewRows?.length
              ? featured.previewRows.slice(0, 5).map((row) => (
                  <tr key={row.label} className="border-t border-slate-100">
                    <th scope="row" className="px-3 py-2.5 font-medium text-slate-800">
                      {row.label}
                    </th>
                    <td className="px-3 py-2.5 text-slate-700">{row.optionA}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.optionB}</td>
                  </tr>
                ))
              : (featured?.dimensions ?? COMPARE_CATEGORY_META[active].dimensions).map((label) => (
                  <tr key={label} className="border-t border-slate-100">
                    <th scope="row" className="px-3 py-2.5 font-medium text-slate-800">
                      {label}
                    </th>
                    <td className="px-3 py-2.5 text-slate-500">Open comparison</td>
                    <td className="px-3 py-2.5 text-slate-500">Open comparison</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Link
        href={featured?.href ?? COMPARE_CATEGORY_META[active].href}
        className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
      >
        {featured
          ? 'View full comparison →'
          : `Start a ${tabs.find((tab) => tab.key === active)?.label} comparison →`}
      </Link>
    </div>
  );
}
