'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  COMPARE_CATEGORY_META,
  type CompareCard,
  type CompareCategoryKey,
} from '@/lib/compare-hub';

export function ComparePopular({
  cards,
  initialQuery = '',
  initialCategory,
}: {
  cards: CompareCard[];
  initialQuery?: string;
  initialCategory?: CompareCategoryKey | 'all';
}) {
  const [filter, setFilter] = useState<CompareCategoryKey | 'all'>(initialCategory ?? 'all');
  const [showAll, setShowAll] = useState(false);

  const available = useMemo(() => {
    const keys = new Set(cards.map((card) => card.category));
    return (Object.keys(COMPARE_CATEGORY_META) as CompareCategoryKey[]).filter((key) =>
      keys.has(key),
    );
  }, [cards]);

  const filtered = useMemo(() => {
    const q = initialQuery.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesFilter = filter === 'all' || card.category === filter;
      const matchesQuery =
        !q ||
        `${card.title} ${card.optionA} ${card.optionB} ${card.category}`.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [cards, filter, initialQuery]);

  const visible = showAll ? filtered : filtered.slice(0, 9);

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Popular comparisons</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Explore useful side-by-side comparisons across Varnarc.
      </p>

      {available.length > 1 ? (
        <div
          className="mt-4 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filter comparisons"
        >
          {(['all', ...available] as const).map((key) => {
            const label = key === 'all' ? 'All' : COMPARE_CATEGORY_META[key].label;
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={`h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold ${
                  active
                    ? 'bg-[#0b1f3a] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((card) => {
            const meta = COMPARE_CATEGORY_META[card.category];
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60 transition hover:-translate-y-0.5 hover:border-blue-200"
              >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">
                  {meta.badge}
                </p>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <p className="text-sm font-bold leading-5 text-slate-950">{card.optionA}</p>
                  <span className="text-[11px] font-extrabold text-slate-400">VS</span>
                  <p className="text-right text-sm font-bold leading-5 text-slate-950">
                    {card.optionB}
                  </p>
                </div>
                <p className="mt-3 text-[13px] text-slate-500">{card.dimensions.join(' · ')}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                  Compare{' '}
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No published comparisons match this filter yet. Use Start a comparison above if options
          are available.
        </p>
      )}

      {filtered.length > 9 && !showAll ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-bold text-blue-700 hover:underline"
          >
            View all comparisons →
          </button>
        </div>
      ) : null}
    </section>
  );
}
