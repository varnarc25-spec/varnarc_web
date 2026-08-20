'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import type { CompareCard } from '@/lib/compare-hub';

export function CompareSearch({
  initialQuery = '',
  cards,
}: {
  initialQuery?: string;
  cards: CompareCard[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return cards
      .filter((card) =>
        `${card.title} ${card.optionA} ${card.optionB} ${card.category}`.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [cards, query]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/compare?q=${encodeURIComponent(next)}` : '/compare');
  }

  return (
    <form onSubmit={onSubmit} className="relative" role="search">
      <label htmlFor="compare-search" className="sr-only">
        Search comparisons
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="compare-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cars, loans, cards, solar, construction..."
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 min-w-[7rem] items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
        >
          Search
        </button>
      </div>
      {suggestions.length ? (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:max-w-[calc(100%-8rem)]">
          {suggestions.map((card) => (
            <li key={card.id}>
              <a
                href={card.href}
                className="block px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50 focus-visible:bg-slate-50"
              >
                <span className="font-semibold">{card.optionA}</span>
                <span className="mx-1 text-slate-400">vs</span>
                <span className="font-semibold">{card.optionB}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
