'use client';

import { useState } from 'react';
import { HubIconGrid, type HubGridItem } from '@/components/hub/hub-icon-grid';

export function HubCalculatorSection({
  title,
  previewItems,
  allItems,
  previewCount = 8,
  calculatorsPageHref = '/calculators',
}: {
  title: string;
  previewItems: HubGridItem[];
  allItems: HubGridItem[];
  previewCount?: number;
  calculatorsPageHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = allItems.length > previewCount;
  const visibleItems = expanded ? allItems : previewItems;

  return (
    <section aria-labelledby="calc-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2
          id="calc-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          {title}
        </h2>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="calc-grid-panel"
            className="text-sm font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {expanded ? 'Show fewer calculators' : 'View all calculators →'}
          </button>
        ) : (
          <a
            href={calculatorsPageHref}
            className="text-sm font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View all calculators →
          </a>
        )}
      </div>

      <div id="calc-grid-panel">
        <HubIconGrid
          items={visibleItems}
          columns={8}
          variant="calculator"
          scrollOnMobile={!expanded}
          calculatorColumns={expanded ? 4 : 8}
        />
      </div>

      {expanded && hasMore ? (
        <p className="mt-4 text-center text-sm text-slate-500">
          <a href={calculatorsPageHref} className="font-semibold text-blue-600 hover:underline">
            Browse full calculator directory →
          </a>
        </p>
      ) : null}
    </section>
  );
}
