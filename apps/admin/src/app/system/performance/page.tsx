import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';

type Overview = {
  evaluations?: Array<{
    metric: string;
    value: number;
    target: number;
    unit: string;
    status: string;
  }>;
  webVitals24h?: {
    lcp?: number | null;
    inp?: number | null;
    cls?: number | null;
    fcp?: number | null;
    ttfb?: number | null;
    samples?: Record<string, number>;
  };
  latency24h?: {
    total?: number;
    avgDurationMs?: number;
    p95DurationMs?: number;
    errorRate?: number;
  };
  topPaths?: Array<{ path: string; count: number; avgDurationMs: number }>;
  infrastructure?: { cache?: string; database?: string; compression?: boolean };
};

export default async function SystemPerformancePage() {
  const result = await apiServerFetch<Overview>('/performance/overview');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Performance"
        description="API latency vs targets, top routes, and infrastructure health."
      />
      <SystemNav active="/system/performance" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load performance data</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Requests (24h)" value={String(result.data?.latency24h?.total ?? 0)} />
            <Kpi title="Avg latency" value={`${result.data?.latency24h?.avgDurationMs ?? 0} ms`} />
            <Kpi title="P95 latency" value={`${result.data?.latency24h?.p95DurationMs ?? 0} ms`} />
            <Kpi
              title="Error rate"
              value={`${((result.data?.latency24h?.errorRate ?? 0) * 100).toFixed(2)}%`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Target evaluation</CardTitle>
                <CardDescription className="space-y-2">
                  {(result.data?.evaluations ?? []).map((ev) => (
                    <span key={ev.metric} className="block">
                      {ev.metric}: {ev.value}
                      {ev.unit === 'ratio' ? '' : ' ms'} (target {ev.target}
                      {ev.unit === 'ratio' ? '' : ' ms'}) —{' '}
                      <StatusBadge status={ev.status} />
                    </span>
                  ))}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure</CardTitle>
                <CardDescription className="space-y-1">
                  <span className="block">Cache: {result.data?.infrastructure?.cache ?? '—'}</span>
                  <span className="block">Database: {result.data?.infrastructure?.database ?? '—'}</span>
                  <span className="block">
                    Compression: {result.data?.infrastructure?.compression ? 'enabled' : 'off'}
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals (24h RUM)</CardTitle>
              <CardDescription className="space-y-1">
                <span className="block">LCP: {formatVital(result.data?.webVitals24h?.lcp, 'ms')}</span>
                <span className="block">INP: {formatVital(result.data?.webVitals24h?.inp, 'ms')}</span>
                <span className="block">CLS: {formatVital(result.data?.webVitals24h?.cls)}</span>
                <span className="block">FCP: {formatVital(result.data?.webVitals24h?.fcp, 'ms')}</span>
                <span className="block">TTFB: {formatVital(result.data?.webVitals24h?.ttfb, 'ms')}</span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top API paths (24h)</CardTitle>
              <CardDescription className="space-y-1 font-mono text-xs">
                {(result.data?.topPaths ?? []).map((row) => (
                  <span key={row.path} className="block">
                    {row.path} — {row.count} req, avg {row.avgDurationMs} ms
                  </span>
                ))}
                {(result.data?.topPaths ?? []).length === 0 ? (
                  <span className="block">No request logs yet.</span>
                ) : null}
              </CardDescription>
            </CardHeader>
          </Card>
        </>
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

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'ok'
      ? 'text-green-600'
      : status === 'warn'
        ? 'text-amber-600'
        : 'text-red-600';
  return <span className={color}>{status}</span>;
}

function formatVital(value?: number | null, unit?: string) {
  if (value == null) return '—';
  return unit ? `${value} ${unit}` : String(value);
}
