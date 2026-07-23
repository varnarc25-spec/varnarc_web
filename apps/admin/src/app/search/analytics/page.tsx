import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Analytics = {
  volume30d?: number;
  avgLatencyMs?: number | null;
  ctr?: number;
  totalSearches?: number;
  clickedSearches?: number;
  indexTotal?: number;
  indexByType?: Array<{ entityType: string; count: number }>;
  topQueries?: Array<{ query: string; count: number }>;
  failedQueries?: Array<{ id: string; query: string; createdAt: string; results: number | null }>;
  mostClicked?: Array<{
    entityType: string;
    entityId: string;
    title?: string | null;
    url?: string | null;
    count: number;
  }>;
};

export default async function SearchAnalyticsAdminPage() {
  const result = await apiServerFetch<Analytics>('/search/analytics');
  const data = result.data;

  return (
    <div className="space-y-8">
      <PageHeader title="Search analytics" description="Query volume, failures, CTR, and latency." />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load analytics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Overview</h2>
            <ul className="space-y-2 text-sm">
              <li>Volume (30d): {data?.volume30d ?? 0}</li>
              <li>Total searches: {data?.totalSearches ?? 0}</li>
              <li>Clicked: {data?.clickedSearches ?? 0}</li>
              <li>CTR: {data?.ctr != null ? `${(data.ctr * 100).toFixed(1)}%` : '—'}</li>
              <li>
                Avg latency:{' '}
                {data?.avgLatencyMs != null ? `${Math.round(data.avgLatencyMs)} ms` : '—'}
              </li>
              <li>Index size: {data?.indexTotal ?? 0}</li>
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
              {!(data?.topQueries ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No queries yet</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Zero-result queries</h2>
            <ul className="space-y-2 text-sm">
              {(data?.failedQueries ?? []).map((q) => (
                <li key={q.id}>{q.query}</li>
              ))}
              {!(data?.failedQueries ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">None</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Most clicked results</h2>
            <ul className="space-y-2 text-sm">
              {(data?.mostClicked ?? []).map((row, i) => (
                <li key={`${row.entityType}-${row.entityId}-${i}`}>
                  {row.title || row.url || row.entityId}{' '}
                  <span className="text-[var(--varnarc-subtle)]">
                    ({row.entityType}: {row.count ?? 0})
                  </span>
                </li>
              ))}
              {!(data?.mostClicked ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No clicks yet</li>
              ) : null}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
