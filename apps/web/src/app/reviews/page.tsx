import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { EmptyState } from '@/components/shared/empty-state';
import { ReviewCard } from '@/components/business/review-card';
import { fetchReviews } from '@/services/content';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Product and service reviews from Varnarc.',
  alternates: { canonical: '/reviews' },
};

export const revalidate = 60;

const popularLinks = [
  { label: 'Solar panels', href: '/reviews/solar-panels-home' },
  { label: 'Inverters', href: '/reviews/inverters' },
  { label: 'Credit cards', href: '/reviews' },
];

export default async function ReviewsPage() {
  const { data } = await fetchReviews(24);

  return (
    <ModuleHubShell
      moduleKey="reviews"
      title="Unbiased product & service reviews"
      description="Editorial reviews to help you compare options and choose with confidence."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]}
      popularLinks={popularLinks}
      overviewTitle="Reviews overview"
    >
      <section>
        <HubSectionHeader title="Latest reviews" />
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
      </section>
    </ModuleHubShell>
  );
}
