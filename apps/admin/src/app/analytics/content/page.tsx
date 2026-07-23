import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';

type Report = {
  topPaths?: Array<{ path: string | null; count: number }>;
  eventsByType?: Array<{ eventType: string; count: number }>;
  pageViews?: number;
};

export default async function AnalyticsContentPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const qs = params.period ? `?period=${params.period}&report=content` : '?report=content';
  const result = await apiServerFetch<Report>(`/analytics/reports${qs}`);

  return (
    <div className="space-y-8">
      <PageHeader title="Content analytics" description="Page views, paths, and content events." />
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
            <h2 className="mb-3 font-semibold">Page views</h2>
            <p className="text-2xl font-semibold">{result.data?.pageViews ?? 0}</p>
          </section>
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Top paths</h2>
            <ul className="space-y-2 text-sm">
              {(result.data?.topPaths ?? []).map((p) => (
                <li key={p.path ?? 'x'}>
                  {p.path}: {p.count}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
