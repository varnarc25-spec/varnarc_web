'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

type SortKey = 'newest' | 'updated' | 'rating';

export function ReviewsCatalog({
  reviews,
  initialQuery = '',
  initialCategory,
}: {
  reviews: ReviewListItem[];
  initialQuery?: string;
  initialCategory?: ReviewCategoryKey | 'all';
}) {
  const [filter, setFilter] = useState<ReviewCategoryKey | 'all'>(initialCategory ?? 'all');
  const [sort, setSort] = useState<SortKey>('newest');
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
        Date.parse((sort === 'updated' ? a.updatedAt : a.publishedAt) || a.updatedAt || '') || 0;
      const bValue =
        Date.parse((sort === 'updated' ? b.updatedAt : b.publishedAt) || b.updatedAt || '') || 0;
      return bValue - aValue;
    });
  }, [filter, initialQuery, reviews, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Latest reviews</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Recently published or updated Varnarc reviews.
          </p>
        </div>
        <label className="text-[13px] font-semibold text-slate-700">
          Sort
          <select
            className="ml-2 h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="newest">Newest</option>
            <option value="updated">Recently updated</option>
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

      <div aria-live="polite" className="sr-only">
        {filtered.length} reviews shown
      </div>

      {visible.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((review) => (
            <ReviewSummaryCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No published reviews match this filter yet.
        </p>
      )}

      {filtered.length > 12 && !showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-5 text-sm font-bold text-blue-700 hover:underline"
        >
          View all reviews →
        </button>
      ) : null}
    </section>
  );
}

export function ReviewSummaryCard({ review }: { review: ReviewListItem }) {
  const category = classifyReview(review);
  const score = parseEditorialScore(review.overallScore);
  const reviewer = reviewerLabel(review);
  const date = formatDate(reviewDate(review), 'MMM yyyy');
  const criteria = criterionLabels(review);
  const meta = category === 'other' ? null : REVIEW_CATEGORY_META[category];

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60 transition hover:-translate-y-0.5 hover:border-blue-200"
    >
      {meta ? (
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">
          {meta.badge}
        </p>
      ) : null}
      <h3 className="mt-2 text-base font-bold leading-6 text-slate-950">{review.title}</h3>
      {review.summary ? (
        <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-slate-600">{review.summary}</p>
      ) : null}
      {score ? (
        <p className="mt-3 text-sm font-bold text-slate-950">
          {score.value.toFixed(1)} / {score.max}
          <span className="ml-2 text-[12px] font-semibold text-slate-500">{score.label}</span>
        </p>
      ) : null}
      <p className="mt-2 text-[12px] text-slate-500">
        Reviewed by {reviewer.name}
        {date ? ` · ${date}` : ''}
      </p>
      {criteria.length ? (
        <p className="mt-2 text-[12px] text-slate-500">{criteria.join(' · ')}</p>
      ) : null}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
        Read review{' '}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
