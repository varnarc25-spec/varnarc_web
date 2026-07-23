import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ReviewCard } from '@/components/business/review-card';
import { fetchReviews } from '@/services/content';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Product and service reviews from Varnarc.',
  alternates: { canonical: '/reviews' },
};

export const revalidate = 60;

export default async function ReviewsPage() {
  const { data } = await fetchReviews(24);
  return (
    <ContentLayout
      title="Reviews"
      description="Unbiased product and service reviews."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {data.map((r) => (
            <ReviewCard
              key={r.id}
              title={r.title}
              slug={r.slug}
              score={r.overallScore != null ? Number(r.overallScore) : null}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews yet" message="Published reviews will appear here." />
      )}
    </ContentLayout>
  );
}
