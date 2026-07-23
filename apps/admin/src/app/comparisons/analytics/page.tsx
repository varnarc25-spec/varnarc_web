import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  total: number;
  published: number;
  draft: number;
  templateCount: number;
  affiliateClicks?: number;
  topViewed?: Array<{ id: string; title: string; slug: string; viewCount: number; entityType?: string | null }>;
  topAffiliateComparisons?: Array<{ comparisonId: string; clicks: number; title: string; slug?: string | null }>;
  byEntityType?: Array<{ entityType: string | null; _count: { _all: number } }>;
};

export default async function ComparisonsAnalyticsPage() {
  const result = await apiServerFetch<AnalyticsData>('/comparisons/analytics');
  const stats = result.data;

  return (
    <div>
      <PageHeader title="Comparison analytics" description="Views and category breakdown." />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load analytics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total comparisons', value: stats?.total ?? 0 },
              { label: 'Published', value: stats?.published ?? 0 },
              { label: 'Drafts', value: stats?.draft ?? 0 },
              { label: 'Templates', value: stats?.templateCount ?? 0 },
              { label: 'Affiliate clicks', value: stats?.affiliateClicks ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <p className="text-sm text-[var(--varnarc-subtle)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h3 className="mb-3 font-semibold">Most viewed</h3>
            <ul className="space-y-2 text-sm">
              {(stats?.topViewed ?? []).map((row) => (
                <li key={row.id} className="flex justify-between gap-4">
                  <span>{row.title}</span>
                  <span className="text-[var(--varnarc-subtle)]">{row.viewCount} views</span>
                </li>
              ))}
              {!stats?.topViewed?.length ? (
                <li className="text-[var(--varnarc-subtle)]">No view data yet.</li>
              ) : null}
            </ul>
          </div>

          <div className="mt-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h3 className="mb-3 font-semibold">Top affiliate comparisons</h3>
            <ul className="space-y-2 text-sm">
              {(stats?.topAffiliateComparisons ?? []).map((row) => (
                <li key={row.comparisonId} className="flex justify-between gap-4">
                  <span>{row.title}</span>
                  <span className="text-[var(--varnarc-subtle)]">{row.clicks} clicks</span>
                </li>
              ))}
              {!stats?.topAffiliateComparisons?.length ? (
                <li className="text-[var(--varnarc-subtle)]">No affiliate click data yet.</li>
              ) : null}
            </ul>
          </div>
        </>
      )}

      <p className="mt-4 text-sm text-[var(--varnarc-subtle)]">
        <Link href="/comparisons" className="text-[var(--varnarc-brand)] hover:underline">
          Back to comparisons dashboard
        </Link>
      </p>
    </div>
  );
}
