import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';

type Dashboard = {
  visitorsToday?: number;
  visitorsMonth?: number;
  activeSessions?: number;
  pageViews?: number;
  topPaths?: Array<{ path: string | null; count: number }>;
  topSearches?: Array<{ keyword: string; count: number }>;
  affiliate?: { clicks?: number | null; conversions?: number | null; revenue?: number | string | null };
  ads?: unknown;
  eventsByType?: Array<{ eventType: string; count: number }>;
  system?: { status?: string; cache?: string };
  range?: { from: string; to: string };
};

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const result = await apiServerFetch<Dashboard>(
    `/analytics/dashboard${qs.toString() ? `?${qs}` : ''}`,
  );
  const data = result.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Platform-wide visitors, engagement, revenue, and system health."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/analytics/content" className="text-[var(--varnarc-brand)] hover:underline">
          Content
        </Link>
        <Link href="/analytics/ads" className="text-[var(--varnarc-brand)] hover:underline">
          Ads
        </Link>
        <Link href="/analytics/search" className="text-[var(--varnarc-brand)] hover:underline">
          Search
        </Link>
        <Link href="/analytics/users" className="text-[var(--varnarc-brand)] hover:underline">
          Users
        </Link>
        <Link href="/analytics/system" className="text-[var(--varnarc-brand)] hover:underline">
          System
        </Link>
        <Link href="/analytics/reports" className="text-[var(--varnarc-brand)] hover:underline">
          Reports
        </Link>
        <Link href="/analytics/revenue" className="text-[var(--varnarc-brand)] hover:underline">
          Revenue
        </Link>
        <Link href="/analytics/executive" className="text-[var(--varnarc-brand)] hover:underline">
          Executive
        </Link>
        <Link href="/analytics/integrations" className="text-[var(--varnarc-brand)] hover:underline">
          Integrations
        </Link>
      </div>

      <AnalyticsDateFilter />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Kpi title="Visitors today" value={data?.visitorsToday ?? 0} />
          <Kpi title="Visitors (period)" value={data?.visitorsMonth ?? data?.pageViews ?? 0} />
          <Kpi title="Active sessions" value={data?.activeSessions ?? 0} />
          <Kpi title="Affiliate clicks" value={data?.affiliate?.clicks ?? 0} />
          <Kpi title="Affiliate conversions" value={data?.affiliate?.conversions ?? 0} />
          <Kpi title="Affiliate revenue" value={String(data?.affiliate?.revenue ?? 0)} />

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:col-span-2">
            <h2 className="mb-3 font-semibold">Top paths</h2>
            <ul className="space-y-2 text-sm">
              {(data?.topPaths ?? []).map((p) => (
                <li key={p.path ?? 'unknown'}>
                  {p.path || '(none)'}: {p.count}
                </li>
              ))}
              {!(data?.topPaths ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No page views yet</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Top searches</h2>
            <ul className="space-y-2 text-sm">
              {(data?.topSearches ?? []).map((s) => (
                <li key={s.keyword}>
                  {s.keyword}: {s.count}
                </li>
              ))}
              {!(data?.topSearches ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No searches yet</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 md:col-span-2">
            <h2 className="mb-3 font-semibold">Events by type</h2>
            <ul className="space-y-2 text-sm">
              {(data?.eventsByType ?? []).map((e) => (
                <li key={e.eventType}>
                  {e.eventType}: {e.count}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">System</h2>
            <ul className="space-y-2 text-sm">
              <li>Status: {data?.system?.status ?? 'ok'}</li>
              <li>Cache: {data?.system?.cache ?? 'memory'}</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <p className="text-sm text-[var(--varnarc-subtle)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </section>
  );
}
