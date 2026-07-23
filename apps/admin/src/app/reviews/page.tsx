import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  totalReviews: number;
  publishedReviews: number;
  draftReviews: number;
  pendingReviews: number;
  averageExpertScore?: number | string | null;
};

const sections = [
  { href: '/reviews/list', label: 'All reviews' },
  { href: '/reviews/moderation', label: 'User review moderation' },
  { href: '/reviews/analytics', label: 'Analytics' },
];

export default async function ReviewsAdminDashboardPage() {
  const result = await apiServerFetch<AnalyticsData>('/reviews/analytics');
  const stats = result.data;

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Editorial reviews, user ratings, moderation, and analytics."
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total reviews', value: stats?.totalReviews ?? 0 },
              { label: 'Published', value: stats?.publishedReviews ?? 0 },
              { label: 'Drafts', value: stats?.draftReviews ?? 0 },
              { label: 'Pending moderation', value: stats?.pendingReviews ?? 0 },
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
              >
                <p className="font-medium">{section.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
