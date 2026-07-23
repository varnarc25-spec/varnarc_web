import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsExportForm } from '@/components/analytics/analytics-export-form';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';

export default async function AnalyticsReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; report?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  qs.set('report', params.report || 'overview');
  const result = await apiServerFetch<Record<string, unknown>>(`/analytics/reports?${qs}`);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Generate and export analytics reports." />
      <AnalyticsDateFilter />
      <AnalyticsExportForm />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load report</CardTitle>
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
