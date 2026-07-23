import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';

type ExecutiveReport = {
  kpis?: {
    visitorsToday?: number;
    visitorsMonth?: number;
    activeSessions?: number;
    affiliateClicks?: number;
    affiliateRevenue?: number;
    combinedRevenue?: number;
  };
  topPaths?: Array<{ path: string; count: number }>;
  topSearches?: Array<{ keyword: string; searchCount?: number }>;
  systemHealth?: { status?: string; queueBackend?: string };
};

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

export default async function AnalyticsExecutivePage() {
  const result = await apiServerFetch<ExecutiveReport>('/analytics/reports?report=executive');
  const data = result.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Executive report"
        description="Cross-module rollup for leadership — traffic, revenue, and vertical engagement."
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/analytics" className="text-[var(--varnarc-brand)] hover:underline">
          Dashboard
        </Link>
        <Link href="/analytics/revenue" className="text-[var(--varnarc-brand)] hover:underline">
          Revenue
        </Link>
        <Link href="/analytics/reports?report=executive" className="text-[var(--varnarc-brand)] hover:underline">
          Export JSON
        </Link>
      </div>

      <AnalyticsDateFilter />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load executive report</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Kpi title="Visitors today" value={String(data?.kpis?.visitorsToday ?? 0)} />
            <Kpi title="Visitors (period)" value={String(data?.kpis?.visitorsMonth ?? 0)} />
            <Kpi title="Active sessions" value={String(data?.kpis?.activeSessions ?? 0)} />
            <Kpi title="Affiliate clicks" value={String(data?.kpis?.affiliateClicks ?? 0)} />
            <Kpi
              title="Affiliate revenue"
              value={`INR ${(data?.kpis?.affiliateRevenue ?? 0).toLocaleString()}`}
            />
            <Kpi
              title="Combined revenue"
              value={`INR ${(data?.kpis?.combinedRevenue ?? 0).toLocaleString()}`}
            />
          </div>

          {data?.topPaths?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Top paths</CardTitle>
              </CardHeader>
              <ul className="space-y-1 px-6 pb-6 text-sm">
                {data.topPaths.slice(0, 10).map((row) => (
                  <li key={row.path} className="flex justify-between gap-4">
                    <span className="truncate">{row.path}</span>
                    <span className="font-medium">{row.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {data?.topSearches?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Top searches</CardTitle>
              </CardHeader>
              <ul className="space-y-1 px-6 pb-6 text-sm">
                {data.topSearches.slice(0, 10).map((row) => (
                  <li key={row.keyword} className="flex justify-between gap-4">
                    <span>{row.keyword}</span>
                    <span className="font-medium">{row.searchCount ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
