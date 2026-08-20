'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import type { ReviewListItem } from '@/services/content';

export function ReviewsSearch({
  initialQuery = '',
  reviews,
}: {
  initialQuery?: string;
  reviews: ReviewListItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return reviews
      .filter((review) =>
        `${review.title} ${review.product?.name ?? ''} ${review.product?.category ?? ''}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [query, reviews]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/reviews?q=${encodeURIComponent(next)}` : '/reviews');
  }

  return (
    <form onSubmit={onSubmit} className="relative" role="search">
      <label htmlFor="reviews-search" className="sr-only">
        Search reviews
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="reviews-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews, products, services..."
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
          {suggestions.map((review) => (
            <li key={review.id}>
              <a href={`/reviews/${review.slug}`} className="block px-4 py-2.5 hover:bg-stone-50">
                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">
                  {review.product?.category || 'Review'}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-900">
                  {review.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
