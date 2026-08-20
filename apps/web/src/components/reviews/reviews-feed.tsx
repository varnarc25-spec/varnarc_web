'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import {
  REVIEW_CATEGORY_META,
  classifyReview,
  criterionLabels,
  parseEditorialScore,
  reviewDate,
  reviewerLabel,
  type ReviewCategoryKey,
} from '@/lib/reviews-hub';
import type { ReviewListItem } from '@/services/content';

type SortKey = 'updated' | 'newest' | 'rating';

export function ReviewsFeed({
  reviews,
  initialQuery = '',
  initialCategory,
}: {
  reviews: ReviewListItem[];
  initialQuery?: string;
  initialCategory?: ReviewCategoryKey | 'all';
}) {
  const [filter, setFilter] = useState<ReviewCategoryKey | 'all'>(initialCategory ?? 'all');
  const [sort, setSort] = useState<SortKey>('updated');
  const [showAll, setShowAll] = useState(false);

  const available = useMemo(() => {
    const keys = new Set(
      reviews.map(classifyReview).filter((key): key is ReviewCategoryKey => key !== 'other'),
    );
    return (Object.keys(REVIEW_CATEGORY_META) as ReviewCategoryKey[]).filter((key) =>
      keys.has(key),
    );
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = initialQuery.trim().toLowerCase();
    const rows = reviews.filter((review) => {
      const category = classifyReview(review);
      const matchesFilter = filter === 'all' || category === filter;
      const hay =
        `${review.title} ${review.summary ?? ''} ${review.product?.name ?? ''} ${review.product?.category ?? ''}`.toLowerCase();
      return matchesFilter && (!q || hay.includes(q));
    });

    return [...rows].sort((a, b) => {
      if (sort === 'rating') return Number(b.overallScore ?? -1) - Number(a.overallScore ?? -1);
      const aValue =
        Date.parse((sort === 'newest' ? a.publishedAt : a.updatedAt) || a.publishedAt || '') || 0;
      const bValue =
        Date.parse((sort === 'newest' ? b.publishedAt : b.updatedAt) || b.publishedAt || '') || 0;
      return bValue - aValue;
    });
  }, [filter, initialQuery, reviews, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 8);
  const recent = [...reviews]
    .sort(
      (a, b) =>
        Date.parse(b.updatedAt || b.publishedAt || '') -
        Date.parse(a.updatedAt || a.publishedAt || ''),
    )
    .slice(0, 4);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(15rem,0.8fr)]">
      <section>
        <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Latest reviews</h2>
            <p className="mt-1 text-sm text-slate-600">
              Recently published or updated editorial assessments.
            </p>
          </div>
          <label className="text-[13px] font-medium text-slate-600">
            Sort
            <select
              className="ml-2 h-11 rounded-md border border-stone-200 bg-white px-2 text-sm text-slate-800"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="updated">Recently updated</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest editorial rating</option>
            </select>
          </label>
        </div>

        {available.length ? (
          <div
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Filter reviews"
          >
            {(['all', ...available] as const).map((key) => {
              const label = key === 'all' ? 'All' : REVIEW_CATEGORY_META[key].label;
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(key)}
                  className={`h-11 shrink-0 px-3 text-[13px] font-semibold ${
                    active
                      ? 'border-b-2 border-amber-700 text-slate-950'
                      : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div aria-live="polite" className="sr-only">
          {filtered.length} reviews shown
        </div>

        {visible.length ? (
          <ul className="mt-2 divide-y divide-stone-200">
            {visible.map((review) => (
              <li key={review.id} className="py-7">
                <ReviewFeedRow review={review} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-slate-600">No published reviews match this filter yet.</p>
        )}

        {filtered.length > 8 && !showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-4 h-11 text-sm font-semibold text-blue-700 hover:underline"
          >
            View all reviews
          </button>
        ) : null}
      </section>

      <aside className="space-y-8 border-t border-stone-200 pt-8 lg:border-t-0 lg:pt-0">
        {available.length ? (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-stone-500">Browse</h2>
            <ul className="mt-3 space-y-2">
              {available.map((key) => (
                <li key={key}>
                  <Link
                    href={`/reviews?category=${key}`}
                    className="text-sm font-semibold text-slate-800 hover:text-blue-700"
                  >
                    {REVIEW_CATEGORY_META[key].label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {recent.length ? (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-stone-500">
              Recently updated
            </h2>
            <ul className="mt-3 space-y-3">
              {recent.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/reviews/${review.slug}`}
                    className="text-sm font-semibold leading-5 text-slate-900 hover:text-blue-700"
                  >
                    {review.title}
                  </Link>
                  {formatDate(reviewDate(review), 'd MMM yyyy') ? (
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {formatDate(reviewDate(review), 'd MMM yyyy')}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-stone-500">
            Review standards
          </h2>
          <Link
            href="#how-we-review"
            className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
          >
            How we evaluate products
          </Link>
        </div>
      </aside>
    </div>
  );
}

function ReviewFeedRow({ review }: { review: ReviewListItem }) {
  const category = classifyReview(review);
  const score = parseEditorialScore(review.overallScore);
  const reviewer = reviewerLabel(review);
  const date = formatDate(reviewDate(review), 'd MMM yyyy');
  const criteria = criterionLabels(review);
  const meta = category === 'other' ? null : REVIEW_CATEGORY_META[category];

  return (
    <article>
      <div className="flex items-start justify-between gap-4">
        {meta ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
            {meta.badge}
          </p>
        ) : (
          <span />
        )}
        {score ? (
          <p className="text-right">
            <span className="text-lg font-bold text-slate-950">{score.value.toFixed(1)}</span>
            <span className="text-sm text-slate-500"> / {score.max}</span>
            <span className="mt-0.5 block text-[11px] font-medium text-stone-500">
              {score.label}
            </span>
          </p>
        ) : null}
      </div>
      <h3 className="mt-2 max-w-3xl text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
        <Link href={`/reviews/${review.slug}`} className="hover:text-blue-800">
          {review.title}
        </Link>
      </h3>
      {review.summary ? (
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-600">{review.summary}</p>
      ) : null}
      {criteria.length ? (
        <p className="mt-3 text-[13px] font-medium text-stone-600">{criteria.join(' · ')}</p>
      ) : null}
      <p className="mt-3 text-[13px] text-slate-500">
        Reviewed by{' '}
        <Link href={reviewer.href} className="font-medium text-slate-700 hover:underline">
          {reviewer.name}
        </Link>
        {date ? ` · Updated ${date}` : ''}
      </p>
      <Link
        href={`/reviews/${review.slug}`}
        className="mt-3 inline-flex h-11 items-center text-sm font-semibold text-blue-700 hover:underline"
      >
        Read review
      </Link>
    </article>
  );
}
