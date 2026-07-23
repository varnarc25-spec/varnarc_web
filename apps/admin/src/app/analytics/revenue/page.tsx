import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AnalyticsDateFilter } from '@/components/analytics/analytics-date-filter';
import { AdsenseImportForm } from '@/components/analytics/adsense-import-form';
import { AdsenseSyncButton } from '@/components/analytics/adsense-sync-button';

type RevenueReport = {
  currency?: string;
  totals?: {
    affiliateRevenue?: number;
    adsenseRevenue?: number;
    estimatedDirectAdRevenue?: number;
    premiumRevenue?: number;
    combined?: number;
  };
  ads?: { impressions?: number; clicks?: number; ctr?: number };
  adsense?: { lastImportedAt?: string | null; source?: string | null };
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

export default async function AnalyticsRevenuePage() {
  const [result, statusResult] = await Promise.all([
    apiServerFetch<RevenueReport>('/analytics/revenue'),
    apiServerFetch<{ configured?: boolean; syncEnabled?: boolean }>('/analytics/adsense/status'),
  ]);
  const data = result.data;
  const currency = data?.currency ?? 'INR';
  const adsenseConfigured = statusResult.data?.configured ?? false;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revenue"
        description="Unified view of affiliate commissions, AdSense, and internal ad performance."
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/analytics" className="text-[var(--varnarc-brand)] hover:underline">
          Dashboard
        </Link>
        <Link href="/analytics/executive" className="text-[var(--varnarc-brand)] hover:underline">
          Executive report
        </Link>
        <Link href="/analytics/reports?report=revenue" className="text-[var(--varnarc-brand)] hover:underline">
          Export
        </Link>
      </div>

      <AnalyticsDateFilter />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load revenue</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi
              title="Combined revenue"
              value={`${currency} ${(data?.totals?.combined ?? 0).toLocaleString()}`}
            />
            <Kpi
              title="Affiliate revenue"
              value={`${currency} ${(data?.totals?.affiliateRevenue ?? 0).toLocaleString()}`}
            />
            <Kpi
              title="AdSense (30d)"
              value={`${currency} ${(data?.totals?.adsenseRevenue ?? 0).toLocaleString()}`}
            />
            <Kpi title="Ad clicks" value={String(data?.ads?.clicks ?? 0)} />
          </div>

          {data?.adsense?.lastImportedAt ? (
            <p className="text-sm text-[var(--varnarc-subtle)]">
              AdSense last imported: {new Date(data.adsense.lastImportedAt).toLocaleString()}
              {data.adsense.source ? ` (${data.adsense.source})` : ''}
            </p>
          ) : (
            <p className="text-sm text-[var(--varnarc-subtle)]">
              No AdSense snapshot yet — sync from Google API or import totals below.
            </p>
          )}

          <AdsenseSyncButton configured={adsenseConfigured} />
          <AdsenseImportForm />
        </>
      )}
    </div>
  );
}
