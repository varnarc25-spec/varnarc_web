import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsIntegrationsForm } from '@/components/analytics/analytics-integrations-form';

export default async function AnalyticsIntegrationsPage() {
  const result = await apiServerFetch<Record<string, unknown>>('/analytics/integrations');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics integrations"
        description="Optional third-party analytics hooks (GA, Clarity, Plausible, etc.)."
      />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AnalyticsIntegrationsForm initial={result.data ?? {}} />
      )}
    </div>
  );
}
