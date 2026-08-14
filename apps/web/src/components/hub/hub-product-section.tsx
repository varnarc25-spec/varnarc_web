'use client';

import { useState } from 'react';
import { HubProductLinks, type HubProductLink } from '@/components/hub/hub-product-links';

export function HubProductSection({
  title,
  previewItems,
  allItems,
  previewCount = 7,
  categoriesPageHref = '/finance/loans',
}: {
  title: string;
  previewItems: HubProductLink[];
  allItems: HubProductLink[];
  previewCount?: number;
  categoriesPageHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = allItems.length > previewCount;
  const visibleItems = expanded ? allItems : previewItems;

  return (
    <section aria-labelledby="products-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2
          id="products-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          {title}
        </h2>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="products-grid-panel"
            className="text-sm font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {expanded ? 'Show fewer categories' : 'View all categories →'}
          </button>
        ) : (
          <a
            href={categoriesPageHref}
            className="text-sm font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View all categories →
          </a>
        )}
      </div>

      <div id="products-grid-panel">
        <HubProductLinks
          items={visibleItems}
          layout={expanded ? 'expanded' : 'preview'}
          scrollOnMobile={!expanded}
        />
      </div>

      {expanded && hasMore ? (
        <p className="mt-4 text-center text-sm text-slate-500">
          <a href={categoriesPageHref} className="font-semibold text-blue-600 hover:underline">
            Browse all finance products →
          </a>
        </p>
      ) : null}
    </section>
  );
}
