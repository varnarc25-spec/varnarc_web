'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { ComparisonViewTracker } from '@/components/comparison/comparison-view-tracker';
import { DataTable } from '@/components/shared/data-table';
import { SimpleBarChart } from '@/components/shared/simple-chart';
import type { ComparisonDetail } from '@/services/content';

type RelatedContent = {
  reviews: Array<{ id: string; title: string; slug: string; overallScore?: number | string | null }>;
  articles: Array<{ id: string; title: string; slug: string; excerpt?: string | null }>;
  calculators: Array<{ id: string; name: string; slug: string; description?: string | null }>;
  affiliateOffers: Array<{ label: string; url: string; entityType: string; entityId: string; sponsored?: boolean }>;
  sponsoredAds: Array<{ id: string; name: string; targetUrl?: string | null }>;
  domainComparisons: Array<{ module: string; title: string; slug: string; href: string }>;
  products: Array<{ id: string; name: string; slug: string }>;
};

type CompareRow = { feature: string; groupKey?: string | null; [key: string]: string | null | undefined };

const recommendationLabels: Record<string, string> = {
  best_overall: 'Best Overall',
  best_budget: 'Best Budget',
  best_premium: 'Best Premium',
  best_performance: 'Best Performance',
  editors_choice: "Editor's Choice",
  best_value: 'Best Value',
  most_popular: 'Most Popular',
};

type ViewMode = 'table' | 'diff' | 'cards' | 'accordion';

function buildMatrix(detail: ComparisonDetail) {
  const columns = detail.items.map((item, idx) => ({
    key: `p${idx}`,
    header: item.label || item.product.name,
    productId: item.product.id,
  }));

  const rows: CompareRow[] = detail.attributes.map((attr) => {
    const values = Array.isArray(attr.values)
      ? (attr.values as unknown[])
      : typeof attr.values === 'object' && attr.values
        ? Object.values(attr.values as Record<string, unknown>)
        : [String(attr.values ?? '')];
    const row: CompareRow = { feature: attr.label, groupKey: (attr as { groupKey?: string }).groupKey };
    columns.forEach((col, idx) => {
      row[col.key] = String(values[idx] ?? '—');
    });
    return row;
  });

  const chart = detail.attributes.slice(0, 6).map((attr) => {
    const values = Array.isArray(attr.values) ? attr.values : [];
    const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    return {
      name: attr.label,
      score: nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 50,
    };
  });

  const groups = [...new Set(detail.attributes.map((a) => (a as { groupKey?: string }).groupKey).filter(Boolean))] as string[];

  return { columns, rows, chart, groups };
}

function diffOnlyRows(rows: CompareRow[], columnKeys: string[]) {
  return rows.filter((row) => {
    const vals = columnKeys.map((k) => row[k] ?? '');
    return new Set(vals).size > 1;
  });
}

async function trackAffiliateClick(comparisonId: string, url: string) {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/comparisons/${comparisonId}/affiliate/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ affiliateUrl: url, referrer: typeof window !== 'undefined' ? window.location.href : undefined }),
  }).catch(() => undefined);
}

export function ComparisonDetailClient({
  detail,
  related,
}: {
  detail: ComparisonDetail;
  related: RelatedContent | null;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const matrix = useMemo(() => buildMatrix(detail), [detail]);
  const columnKeys = matrix.columns.map((c) => c.key);

  const filteredRows = useMemo(() => {
    let rows = matrix.rows;
    if (groupFilter !== 'all') {
      rows = rows.filter((r) => r.groupKey === groupFilter);
    }
    if (viewMode === 'diff') {
      rows = diffOnlyRows(rows, columnKeys);
    }
    return rows;
  }, [matrix.rows, groupFilter, viewMode, columnKeys]);

  const tableColumns = useMemo<ColumnDef<CompareRow>[]>(
    () => [
      { accessorKey: 'feature', header: 'Feature' },
      ...matrix.columns.map((col) => ({ accessorKey: col.key, header: col.header })),
    ],
    [matrix.columns],
  );

  const faqs = filteredRows.slice(0, 5).map((row) => ({
    question: `How does ${row.feature} compare?`,
    answer: matrix.columns.map((col) => `${col.header}: ${row[col.key] ?? '—'}`).join(' · '),
  }));

  return (
    <>
      <ComparisonViewTracker comparisonId={detail.id} />
      <PageShell
        title={detail.title}
        description={detail.description ?? 'Side-by-side comparison from Varnarc.'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Compare', href: '/compare' },
          { label: detail.title },
        ]}
      >
        {detail.recommendation ? (
          <span className="mb-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {recommendationLabels[detail.recommendation] ?? detail.recommendation}
          </span>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-2">
          {(['table', 'diff', 'cards', 'accordion'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                viewMode === mode ? 'bg-[#0b1f3a] text-white' : 'border border-slate-200 text-slate-600'
              }`}
            >
              {mode === 'table' ? 'Side-by-side' : mode === 'diff' ? 'Differences only' : mode === 'cards' ? 'Summary cards' : 'Mobile accordion'}
            </button>
          ))}
          {matrix.groups.length ? (
            <select
              className="ml-auto rounded-md border border-slate-200 px-3 py-1 text-xs"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">All groups</option>
              {matrix.groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {viewMode === 'table' || viewMode === 'diff' ? (
          <DataTable columns={tableColumns} data={filteredRows} />
        ) : null}

        {viewMode === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matrix.columns.map((col) => (
              <div key={col.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#0b1f3a]">{col.header}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {filteredRows.map((row) => (
                    <li key={`${col.key}-${row.feature}`}>
                      <span className="font-medium text-slate-800">{row.feature}:</span> {row[col.key]}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {viewMode === 'accordion' ? (
          <div className="space-y-2">
            {filteredRows.map((row) => (
              <details key={row.feature} className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#0b1f3a]">{row.feature}</summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {matrix.columns.map((col) => (
                    <div key={col.key} className="text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{col.header}:</span> {row[col.key]}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-extrabold text-[#0b1f3a]">Score snapshot</h2>
          <SimpleBarChart data={matrix.chart} xKey="name" yKey="score" />
        </div>

        {related?.affiliateOffers?.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Affiliate offers</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.affiliateOffers.map((offer) => (
                <a
                  key={`${offer.entityType}-${offer.entityId}`}
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => void trackAffiliateClick(detail.id, offer.url)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-[#0b1f3a] hover:bg-slate-100"
                >
                  {offer.label}
                  {offer.sponsored ? <span className="ml-2 text-xs text-amber-700">Sponsored</span> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {related?.sponsoredAds?.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Sponsored</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.sponsoredAds.map((ad) => (
                <a
                  key={ad.id}
                  href={ad.targetUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-[#0b1f3a] hover:bg-amber-100"
                >
                  {ad.name}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {related?.reviews?.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Related reviews</h2>
            <ul className="space-y-2">
              {related.reviews.map((review) => (
                <li key={review.id}>
                  <Link href={`/reviews/${review.slug}`} className="text-sm font-medium text-[#0b1f3a] hover:underline">
                    {review.title}
                    {review.overallScore != null ? ` · ${Number(review.overallScore).toFixed(1)}` : ''}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related?.articles?.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Related articles</h2>
            <ul className="space-y-2">
              {related.articles.map((article) => (
                <li key={article.id}>
                  <Link href={`/articles/${article.slug}`} className="text-sm font-medium text-[#0b1f3a] hover:underline">
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related?.calculators?.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Related calculators</h2>
            <ul className="space-y-2">
              {related.calculators.map((calc) => (
                <li key={calc.id}>
                  <Link href={`/calculators/${calc.slug}`} className="text-sm font-medium text-[#0b1f3a] hover:underline">
                    {calc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related?.domainComparisons?.length ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">More comparisons</h2>
            <ul className="space-y-2">
              {related.domainComparisons.map((item) => (
                <li key={`${item.module}-${item.slug}`}>
                  <Link href={item.href} className="text-sm font-medium text-[#0b1f3a] hover:underline">
                    [{item.module}] {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {faqs.length ? (
          <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick answers</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {faqs.map((faq) => (
                <li key={faq.question}>
                  <p className="font-medium text-slate-900">{faq.question}</p>
                  <p className="mt-1">{faq.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageShell>
    </>
  );
}
