import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  totals?: {
    total: number;
    published: number;
    featured: number;
    sponsored: number;
  };
  topViewed?: Array<{ name: string; slug: string; viewCount: number; bookmarkCount?: number }>;
  topBookmarked?: Array<{ name: string; slug: string; viewCount?: number; bookmarkCount: number }>;
  byCategory?: Array<{
    categoryId: string | null;
    count: number;
    category?: { name: string; slug: string } | null;
  }>;
  byPricing?: Array<{ pricingModel: string; count: number }>;
  events?: Array<{ eventType: string; count: number }>;
};

export default async function AiToolsAnalyticsAdminPage() {
  const result = await apiServerFetch<AnalyticsData>('/ai-tools/analytics');
  const stats = result.data;
  const totals = stats?.totals;

  return (
    <div>
      <PageHeader title="AI Tools analytics" description="Catalog performance and engagement." />

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
              <li>Total: {totals?.total ?? 0}</li>
              <li>Published: {totals?.published ?? 0}</li>
              <li>Featured: {totals?.featured ?? 0}</li>
              <li>Sponsored: {totals?.sponsored ?? 0}</li>
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Events by type</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.events ?? []).map((e) => (
                <li key={e.eventType}>
                  {e.eventType}: {e.count}
                </li>
              ))}
              {!(stats?.events ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No events</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Top viewed</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.topViewed ?? []).map((m) => (
                <li key={m.slug}>
                  {m.name}: {m.viewCount}
                </li>
              ))}
              {!(stats?.topViewed ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No data</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Top bookmarked</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.topBookmarked ?? []).map((m) => (
                <li key={m.slug}>
                  {m.name}: {m.bookmarkCount}
                </li>
              ))}
              {!(stats?.topBookmarked ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No data</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">By category</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.byCategory ?? []).map((c) => (
                <li key={c.categoryId ?? 'none'}>
                  {c.category?.name ?? 'Uncategorized'}: {c.count}
                </li>
              ))}
              {!(stats?.byCategory ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No data</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">By pricing model</h2>
            <ul className="space-y-2 text-sm">
              {(stats?.byPricing ?? []).map((p) => (
                <li key={p.pricingModel}>
                  {p.pricingModel}: {p.count}
                </li>
              ))}
              {!(stats?.byPricing ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">No data</li>
              ) : null}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
