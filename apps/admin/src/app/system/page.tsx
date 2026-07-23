import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SystemNav } from '@/components/system/system-nav';
import { DependencyStatusBadge } from '@/components/system/status-badge';

type Overview = {
  timestamp?: string;
  version?: {
    version?: string;
    environment?: string;
    node?: string;
    appVersion?: string;
  };
  health?: {
    overall?: string;
    readiness?: { database?: string; redis?: string; auth0?: string };
  };
  infrastructure?: {
    database?: string;
    cache?: string;
    auth0?: string;
    prometheus?: boolean;
    openTelemetry?: boolean;
  };
  api?: {
    last24h?: {
      total?: number;
      errors?: number;
      avgDurationMs?: number;
      p95DurationMs?: number;
      errorRate?: number;
    };
    docsUrl?: string;
  };
  queues?: {
    aiJobs?: {
      total?: number;
      failed?: number;
      last24h?: number;
      byStatus?: Array<{ status: string; count: number }>;
    };
    webhooks?: {
      total?: number;
      failed?: number;
      successRate?: number;
    };
  };
  modules?: Array<{ key: string; label: string; status: string; meta?: string }>;
};

export default async function SystemOverviewPage() {
  const result = await apiServerFetch<Overview>('/monitoring/overview');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitoring"
        description="Unified view of API health, version, performance, and job queues."
      />
      <SystemNav active="/system" />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load monitoring overview</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Overall" value={result.data?.health?.overall ?? '—'} badge />
            <Kpi title="API version" value={result.data?.version?.version ?? '—'} />
            <Kpi title="Requests (24h)" value={String(result.data?.api?.last24h?.total ?? 0)} />
            <Kpi
              title="Error rate (24h)"
              value={`${((result.data?.api?.last24h?.errorRate ?? 0) * 100).toFixed(2)}%`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure</CardTitle>
                <CardDescription className="space-y-2">
                  <Row label="Database" status={result.data?.infrastructure?.database} />
                  <Row label="Cache" status={result.data?.infrastructure?.cache} />
                  <Row label="Auth0" status={result.data?.infrastructure?.auth0} />
                  <span className="block pt-2 text-xs text-[var(--varnarc-subtle)]">
                    Prometheus: {result.data?.infrastructure?.prometheus ? 'enabled' : 'off'} · OTel:{' '}
                    {result.data?.infrastructure?.openTelemetry ? 'enabled' : 'off'}
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Runtime</CardTitle>
                <CardDescription className="space-y-1">
                  <span className="block">Environment: {result.data?.version?.environment ?? '—'}</span>
                  <span className="block">Node: {result.data?.version?.node ?? '—'}</span>
                  <span className="block">App: {result.data?.version?.appVersion ?? '—'}</span>
                  <span className="block text-xs text-[var(--varnarc-subtle)]">
                    Updated {result.data?.timestamp ? new Date(result.data.timestamp).toLocaleString() : '—'}
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Modules</CardTitle>
              <CardDescription>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(result.data?.modules ?? []).map((mod) => (
                    <div
                      key={mod.key}
                      className="flex items-center justify-between rounded-md border border-[var(--varnarc-border)] px-3 py-2"
                    >
                      <span className="text-sm">{mod.label}</span>
                      <div className="text-right">
                        <DependencyStatusBadge status={mod.status} />
                        {mod.meta ? (
                          <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">{mod.meta}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI jobs</CardTitle>
                <CardDescription className="space-y-1">
                  <span className="block">Total: {result.data?.queues?.aiJobs?.total ?? 0}</span>
                  <span className="block">Last 24h: {result.data?.queues?.aiJobs?.last24h ?? 0}</span>
                  <span className="block">Failed: {result.data?.queues?.aiJobs?.failed ?? 0}</span>
                  <Link href="/system/queues" className="mt-2 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
                    View queues →
                  </Link>
                  <Link href="/ai-ops/jobs" className="ml-4 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
                    AI ops jobs →
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhooks (24h)</CardTitle>
                <CardDescription className="space-y-1">
                  <span className="block">Deliveries: {result.data?.queues?.webhooks?.total ?? 0}</span>
                  <span className="block">Failed: {result.data?.queues?.webhooks?.failed ?? 0}</span>
                  <span className="block">
                    Success rate:{' '}
                    {((result.data?.queues?.webhooks?.successRate ?? 1) * 100).toFixed(1)}%
                  </span>
                  <Link href="/system/queues" className="mt-2 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
                    View deliveries →
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <QuickLink href="/system/status" label="Status" desc="Detailed runtime status" />
            <QuickLink href="/system/health" label="Health probes" desc="Liveness & readiness" />
            <QuickLink href="/system/performance" label="Performance" desc="Latency & web vitals" />
          </div>
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

function Row({ label, status }: { label: string; status?: string }) {
  return (
    <span className="flex items-center justify-between">
      {label}
      <DependencyStatusBadge status={status ?? 'unknown'} />
    </span>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-[var(--varnarc-border)] p-4 hover:border-[var(--varnarc-brand)]">
      <p className="font-medium text-[var(--varnarc-brand)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">{desc}</p>
    </Link>
  );
}
