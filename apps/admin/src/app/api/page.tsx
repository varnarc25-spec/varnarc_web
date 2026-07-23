import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ApiConsoleNav } from '@/components/api-console/api-console-nav';

type Overview = {
  version?: { version?: string; environment?: string };
  status?: { database?: string; cache?: string; docsUrl?: string };
  counts?: { apiKeys?: number; webhooks?: number };
  last24h?: { total?: number; errors?: number; avgDurationMs?: number };
};

export default async function ApiConsolePage() {
  const result = await apiServerFetch<Overview>('/platform/overview');

  return (
    <div className="space-y-8">
      <PageHeader title="API console" description="Monitor platform API health, logs, keys, and webhooks." />
      <ApiConsoleNav active="/api" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load overview</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Kpi title="API version" value={result.data?.version?.version ?? '—'} />
          <Kpi title="Requests (24h)" value={String(result.data?.last24h?.total ?? 0)} />
          <Kpi title="Errors (24h)" value={String(result.data?.last24h?.errors ?? 0)} />
          <Kpi title="Avg duration" value={`${result.data?.last24h?.avgDurationMs ?? 0}ms`} />
          <Kpi title="API keys" value={String(result.data?.counts?.apiKeys ?? 0)} />
          <Kpi title="Webhooks" value={String(result.data?.counts?.webhooks ?? 0)} />
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
