import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type SummaryData = {
  manufacturersPublished?: number;
  vehiclesPublished?: number;
  maintenanceSchedules?: number;
  faqs?: number;
  guides?: number;
  comparisons?: number;
  dealersLinked?: number;
  affiliateClicks?: number;
  affiliateLeads?: number;
};

type AffiliateStats = {
  totalVehicleClicks?: number;
  totalVehicleLeads?: number;
  totalClicks?: number;
  totalLeads?: number;
  conversionRate?: number;
  vehicles?: Array<{ id: string; name: string; clicks: number; leads: number; ctr: number; affiliateUrl?: string | null }>;
};

const exportEntities = ['manufacturers', 'vehicles'] as const;

export default async function AutomobileReportsAdminPage() {
  const [result, affiliateResult] = await Promise.all([
    apiServerFetch<SummaryData>('/automobile/admin/reports/summary'),
    apiServerFetch<AffiliateStats>('/automobile/admin/affiliate-stats'),
  ]);
  const stats = result.data;
  const affiliate = affiliateResult.data;

  return (
    <div>
      <PageHeader
        title="Automobile reports"
        description="Module summary stats, affiliate CTR, and CSV export links."
        actions={<Badge>Summary</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load summary</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Published manufacturers', value: stats?.manufacturersPublished ?? 0 },
              { label: 'Published vehicles', value: stats?.vehiclesPublished ?? 0 },
              { label: 'Maintenance schedules', value: stats?.maintenanceSchedules ?? 0 },
              { label: 'Guides', value: stats?.guides ?? 0 },
              { label: 'FAQs', value: stats?.faqs ?? 0 },
              { label: 'Saved comparisons', value: stats?.comparisons ?? 0 },
              { label: 'Linked dealers', value: stats?.dealersLinked ?? 0 },
              { label: 'Affiliate clicks', value: stats?.affiliateClicks ?? affiliate?.totalClicks ?? 0 },
              { label: 'Affiliate leads', value: stats?.affiliateLeads ?? affiliate?.totalLeads ?? 0 },
              { label: 'Lead conversion %', value: affiliate?.conversionRate ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <div className="text-xs text-[var(--varnarc-subtle)]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          {affiliate?.vehicles?.length ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-[var(--varnarc-brand)]">Affiliate click leaders</h2>
              <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Vehicle</th>
                      <th className="px-4 py-3 font-medium">Clicks</th>
                      <th className="px-4 py-3 font-medium">Leads</th>
                      <th className="px-4 py-3 font-medium">Conv. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliate.vehicles
                      .slice()
                      .sort((a, b) => b.clicks - a.clicks)
                      .slice(0, 10)
                      .map((row) => (
                        <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                          <td className="px-4 py-3">{row.name}</td>
                          <td className="px-4 py-3">{row.clicks}</td>
                          <td className="px-4 py-3">{row.leads}</td>
                          <td className="px-4 py-3">{row.ctr}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--varnarc-brand)]">CSV exports</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {exportEntities.map((entity) => (
                <Link
                  key={entity}
                  href={`/api/admin/automobile/export/${entity}`}
                  className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
                >
                  <div className="font-medium capitalize">{entity}</div>
                  <div className="mt-1 text-xs text-[var(--varnarc-subtle)]">Download CSV</div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
