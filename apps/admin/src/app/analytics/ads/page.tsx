import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';

export default async function AnalyticsAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const qs = params.period ? `?period=${params.period}` : '';
  const result = await apiServerFetch<Record<string, unknown>>(`/analytics/ads${qs}`);

  return (
    <div className="space-y-8">
      <PageHeader title="Advertisement analytics" description="Impressions, clicks, CTR, and revenue." />
      <AnalyticsDateFilter />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <pre className="overflow-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 text-sm">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
