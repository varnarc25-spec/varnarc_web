import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  featuredCount: number;
  sponsoredCount: number;
  verifiedCount: number;
  leadsByStatus?: Record<string, number>;
  topCities?: Array<{ city: string; count: number }>;
  topCategories?: Array<{ name: string; count: number }>;
  eventsByType?: Record<string, number>;
  mostViewed?: Array<{ name: string; slug: string; viewCount: number }>;
};

export default async function DirectoryAnalyticsAdminPage() {
  const result = await apiServerFetch<AnalyticsData>('/directory/analytics');
  const stats = result.data;

  return (
    <div>
      <PageHeader title="Directory analytics" description="Engagement, leads, and listing performance." />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load analytics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Overview</h2>
            <ul className="space-y-2 text-sm">
              <li>Total: {stats?.totalListings ?? 0}</li>
              <li>Approved: {stats?.approvedListings ?? 0}</li>
              <li>Pending: {stats?.pendingListings ?? 0}</li>
              <li>Featured: {stats?.featuredCount ?? 0}</li>
              <li>Sponsored: {stats?.sponsoredCount ?? 0}</li>
              <li>Verified: {stats?.verifiedCount ?? 0}</li>
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Leads by status</h2>
            <ul className="space-y-2 text-sm">
              {Object.entries(stats?.leadsByStatus ?? {}).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
              {!Object.keys(stats?.leadsByStatus ?? {}).length ? <li className="text-[var(--varnarc-subtle)]">No leads</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Top cities</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.topCities ?? []).map((c) => (
                <li key={c.city}>
                  {c.city}: {c.count}
                </li>
              ))}
              {!(stats?.topCities ?? []).length ? <li className="text-[var(--varnarc-subtle)]">No data</li> : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Most viewed</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.mostViewed ?? []).map((m) => (
                <li key={m.slug}>
                  {m.name}: {m.viewCount}
                </li>
              ))}
              {!(stats?.mostViewed ?? []).length ? <li className="text-[var(--varnarc-subtle)]">No data</li> : null}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
