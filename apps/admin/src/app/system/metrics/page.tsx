import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';

type Metrics = {
  api_requests_total_24h?: number;
  api_errors_total_24h?: number;
  api_latency_avg_ms?: number;
  api_latency_p50_ms?: number;
  api_latency_p95_ms?: number;
  api_error_rate?: number;
  cache_backend?: string;
  collectedAt?: string;
  targets?: { avgResponseMs?: number; p95ResponseMs?: number; errorRate?: number };
};

export default async function SystemMetricsPage() {
  const result = await apiServerFetch<Metrics>('/metrics');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Metrics"
        description="Operational metrics from GET /api/v1/metrics (RBAC protected)."
      />
      <SystemNav active="/system/metrics" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load metrics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Requests (24h)" value={String(result.data?.api_requests_total_24h ?? 0)} />
          <MetricCard label="Errors (24h)" value={String(result.data?.api_errors_total_24h ?? 0)} />
          <MetricCard label="Avg latency" value={`${result.data?.api_latency_avg_ms ?? 0} ms`} />
          <MetricCard label="P50 latency" value={`${result.data?.api_latency_p50_ms ?? 0} ms`} />
          <MetricCard label="P95 latency" value={`${result.data?.api_latency_p95_ms ?? 0} ms`} />
          <MetricCard
            label="Error rate"
            value={`${((result.data?.api_error_rate ?? 0) * 100).toFixed(2)}%`}
          />
          <MetricCard label="Cache backend" value={result.data?.cache_backend ?? '—'} />
          <MetricCard
            label="Target avg"
            value={`${result.data?.targets?.avgResponseMs ?? 200} ms`}
          />
          <MetricCard
            label="Target P95"
            value={`${result.data?.targets?.p95ResponseMs ?? 500} ms`}
          />
        </div>
      )}

      {result.data?.collectedAt ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">Collected at {result.data.collectedAt}</p>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
