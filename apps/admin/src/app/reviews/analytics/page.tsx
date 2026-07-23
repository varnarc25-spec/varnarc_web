import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  totalReviews: number;
  publishedReviews: number;
  draftReviews: number;
  pendingReviews: number;
  averageExpertScore?: number | string | null;
  topViewed?: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    overallScore?: number | string | null;
  }>;
  userReviewsByStatus?: Array<{ status: string; _count: { _all: number } }>;
};

export default async function ReviewsAnalyticsPage() {
  const result = await apiServerFetch<AnalyticsData>('/reviews/analytics');
  const stats = result.data;

  return (
    <div>
      <PageHeader title="Review analytics" description="Engagement and rating metrics." />

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
              { label: 'Total editorial reviews', value: stats?.totalReviews ?? 0 },
              { label: 'Published', value: stats?.publishedReviews ?? 0 },
              { label: 'Drafts', value: stats?.draftReviews ?? 0 },
              {
                label: 'Avg expert score',
                value:
                  stats?.averageExpertScore != null
                    ? Number(stats.averageExpertScore).toFixed(1)
                    : '—',
              },
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
            <h3 className="mb-3 font-semibold">Most viewed reviews</h3>
            <ul className="space-y-2 text-sm">
              {(stats?.topViewed ?? []).map((row) => (
                <li key={row.id} className="flex justify-between gap-4">
                  <span>{row.title}</span>
                  <span className="text-[var(--varnarc-subtle)]">
                    {row.viewCount} views
                    {row.overallScore != null ? ` · ${Number(row.overallScore).toFixed(1)}` : ''}
                  </span>
                </li>
              ))}
              {!stats?.topViewed?.length ? (
                <li className="text-[var(--varnarc-subtle)]">No view data yet.</li>
              ) : null}
            </ul>
          </div>
        </>
      )}

      <p className="mt-4 text-sm text-[var(--varnarc-subtle)]">
        <Link href="/reviews" className="text-[var(--varnarc-brand)] hover:underline">
          Back to reviews dashboard
        </Link>
      </p>
    </div>
  );
}
