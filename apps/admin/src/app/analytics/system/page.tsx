import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsSystemActions } from '@/components/analytics/analytics-system-actions';

export default async function AnalyticsSystemPage() {
  const result = await apiServerFetch<Record<string, unknown>>('/analytics/system');

  return (
    <div className="space-y-8">
      <PageHeader title="System analytics" description="API health, cache, and recorded metrics." />
      <AnalyticsSystemActions />
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
