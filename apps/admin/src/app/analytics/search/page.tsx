import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';

type SearchAnalytics = {
  volume?: number;
  topQueries?: Array<{ query: string; count: number }>;
  zeroResults?: Array<{ query: string }>;
  popular?: Array<{ keyword: string; searchCount: number }>;
  ctr?: number;
};

export default async function AnalyticsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const qs = params.period ? `?period=${params.period}` : '';
  const result = await apiServerFetch<SearchAnalytics>(`/analytics/search${qs}`);
  const data = result.data;

  return (
    <div className="space-y-8">
      <PageHeader title="Search analytics" description="Queries, zero-results, and CTR." />
      <AnalyticsDateFilter />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Overview</h2>
            <ul className="space-y-2 text-sm">
              <li>Volume: {data?.volume ?? 0}</li>
              <li>CTR: {data?.ctr != null ? `${(data.ctr * 100).toFixed(1)}%` : '—'}</li>
            </ul>
          </section>
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Top queries</h2>
            <ul className="space-y-2 text-sm">
              {(data?.topQueries ?? []).map((q) => (
                <li key={q.query}>
                  {q.query}: {q.count}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Zero results</h2>
            <ul className="space-y-2 text-sm">
              {(data?.zeroResults ?? []).map((q) => (
                <li key={q.query}>{q.query}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Popular</h2>
            <ul className="space-y-2 text-sm">
              {(data?.popular ?? []).map((p) => (
                <li key={p.keyword}>
                  {p.keyword}: {p.searchCount}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
