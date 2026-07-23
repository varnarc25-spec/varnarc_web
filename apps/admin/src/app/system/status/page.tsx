import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';
import { DependencyStatusBadge } from '@/components/system/status-badge';

type Status = {
  service?: string;
  status?: string;
  database?: string;
  cache?: string;
  auth0?: string;
  throttler?: { limit?: number; ttlMs?: number };
  docsUrl?: string;
  last24h?: {
    total?: number;
    errors?: number;
    avgDurationMs?: number;
    p95DurationMs?: number;
    errorRate?: number;
  };
};

export default async function SystemStatusPage() {
  const result = await apiServerFetch<Status>('/status');

  return (
    <div className="space-y-8">
      <PageHeader title="System status" description="Runtime status of the Varnarc API and dependencies." />
      <SystemNav active="/system/status" />

      {process.env.GCP_CONSOLE_URL ? (
        <p className="text-sm">
          <a href={process.env.GCP_CONSOLE_URL} className="text-[var(--varnarc-brand)] hover:underline" target="_blank" rel="noreferrer">
            Open Cloud Run in Google Cloud Console
          </a>
        </p>
      ) : null}

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load status</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Service" value={result.data?.service ?? '—'} />
            <Kpi title="Overall" value={result.data?.status ?? '—'} badge />
            <Kpi title="Database" value={result.data?.database ?? '—'} badge />
            <Kpi title="Cache" value={result.data?.cache ?? '—'} badge />
            <Kpi title="Auth0" value={result.data?.auth0 ?? '—'} badge />
            <Kpi title="Requests (24h)" value={String(result.data?.last24h?.total ?? 0)} />
            <Kpi title="Errors (24h)" value={String(result.data?.last24h?.errors ?? 0)} />
            <Kpi
              title="Error rate (24h)"
              value={`${((result.data?.last24h?.errorRate ?? 0) * 100).toFixed(2)}%`}
            />
            <Kpi title="Avg latency" value={`${result.data?.last24h?.avgDurationMs ?? 0} ms`} />
            <Kpi title="P95 latency" value={`${result.data?.last24h?.p95DurationMs ?? 0} ms`} />
          </div>

          {result.data?.throttler ? (
            <Card>
              <CardHeader>
                <CardTitle>Rate limiting</CardTitle>
                <CardDescription>
                  {result.data.throttler.limit} requests per {Math.round((result.data.throttler.ttlMs ?? 60000) / 1000)}s
                  {result.data.docsUrl ? (
                    <>
                      {' '}
                      ·{' '}
                      <a href={result.data.docsUrl} className="text-[var(--varnarc-brand)] hover:underline">
                        API docs
                      </a>
                    </>
                  ) : null}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function Kpi({ title, value, badge }: { title: string; value: string; badge?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">
          {badge ? <DependencyStatusBadge status={value} /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
