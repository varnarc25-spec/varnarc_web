import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileReviews } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Automobile Reviews',
  description: 'Vehicle reviews and ratings for cars, SUVs, and two-wheelers.',
  alternates: { canonical: '/automobile/reviews' },
};

export const revalidate = 60;

export default async function AutomobileReviewsPage() {
  const { data } = await fetchAutomobileReviews();

  return (
    <ContentLayout
      title="Vehicle reviews"
      description="Expert and community reviews linked to automobile products."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Reviews' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((review) => {
            const href = review.slug ? `/reviews/${review.slug}` : '/reviews';
            return (
              <Link
                key={review.id}
                href={href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-extrabold text-[#0b1f3a]">
                    {review.title || review.product?.name || 'Review'}
                  </h2>
                  {review.rating != null ? (
                    <span className="shrink-0 text-sm font-semibold text-[#ea580c]">{review.rating}/5</span>
                  ) : review.overallScore != null ? (
                    <span className="shrink-0 text-sm font-semibold text-[#ea580c]">{review.overallScore}/5</span>
                  ) : null}
                </div>
                {review.vehicle?.name ? (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#ea580c]">
                    {review.vehicle.name}
                  </p>
                ) : review.product?.name ? (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {review.product.name}
                  </p>
                ) : null}
                {review.summary || review.excerpt || review.body ? (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {review.summary || review.excerpt || review.body}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No reviews yet"
          message="Approved automobile reviews will appear here."
          action={
            <Link
              href="/reviews"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Browse all reviews
            </Link>
          }
        />
      )}

      <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
    </ContentLayout>
  );
}
