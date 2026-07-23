import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ApiConsoleNav } from '@/components/api-console/api-console-nav';

type RateLimits = {
  global?: { ttlMs?: number; limit?: number };
  storage?: string;
  notes?: string;
};

export default async function ApiRateLimitsPage() {
  const result = await apiServerFetch<RateLimits>('/platform/rate-limits');

  return (
    <div className="space-y-8">
      <PageHeader title="Rate limits" description="Global throttling configuration for the REST API." />
      <ApiConsoleNav active="/api/rate-limits" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load rate limits</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>Global limit</CardDescription>
            <CardTitle className="text-2xl">
              {result.data?.global?.limit ?? 120} requests / {(result.data?.global?.ttlMs ?? 60_000) / 1000}s
            </CardTitle>
            <CardDescription className="mt-2">
              Storage: {result.data?.storage ?? 'memory'}
              {result.data?.notes ? ` · ${result.data.notes}` : ''}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
