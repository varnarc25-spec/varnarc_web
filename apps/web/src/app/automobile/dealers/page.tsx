import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileDealers } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Automobile Dealers',
  description: 'Find car dealers, showrooms, service centers, and charging stations.',
  alternates: { canonical: '/automobile/dealers' },
};

export default async function AutomobileDealersPage() {
  const { data: dealers } = await fetchAutomobileDealers();

  return (
    <ContentLayout
      title="Dealers & service"
      description="Browse automobile businesses from our directory — dealers, showrooms, and service centers."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Dealers' },
      ]}
    >
      <p className="mb-6 text-sm text-slate-600">
        Listings are sourced from the{' '}
        <Link href="/directory?vertical=automobile" className="font-medium text-[#ea580c] hover:underline">
          business directory
        </Link>
        . Contact dealers directly or view their full profile.
      </p>

      {dealers.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dealers.map((dealer) => (
            <Link
              key={dealer.id}
              href={`/directory/${dealer.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-extrabold text-[#0b1f3a]">{dealer.name}</h2>
                {dealer.sponsored ? (
                  <span className="shrink-0 rounded-full bg-[#ea580c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Sponsored
                  </span>
                ) : null}
              </div>
              {dealer.category ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{dealer.category}</p>
              ) : null}
              {dealer.city ? <p className="mt-2 text-sm text-slate-600">{dealer.city}</p> : null}
              {dealer.phone ? (
                <p className="mt-2 text-sm font-medium text-[#0b1f3a]">{dealer.phone}</p>
              ) : null}
              {dealer.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{dealer.description}</p>
              ) : null}
              <span className="mt-3 inline-block text-sm font-medium text-[#ea580c]">View profile →</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No dealer listings yet"
          message="Dealers will appear here once directory businesses are tagged with automobile categories."
          action={
            <Link
              href="/directory?vertical=automobile"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Browse directory
            </Link>
          }
        />
      )}

      <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
    </ContentLayout>
  );
}
