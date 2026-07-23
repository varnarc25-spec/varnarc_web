import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileGuides } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Automobile Guides',
  description: 'Buying guides, ownership tips, and how-tos for cars and two-wheelers.',
  alternates: { canonical: '/automobile/guides' },
};

export const revalidate = 60;

export default async function AutomobileGuidesPage() {
  const { data } = await fetchAutomobileGuides();

  return (
    <ContentLayout
      title="Automobile guides"
      description="Step-by-step guides to help you buy and own smarter."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Guides' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((guide) => (
            <Link
              key={guide.slug}
              href={`/automobile/guides/${guide.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h2 className="text-base font-extrabold text-[#0b1f3a]">{guide.title}</h2>
              {guide.summary ? (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{guide.summary}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No guides yet" message="Automobile guides will appear here once published." />
      )}

      <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
    </ContentLayout>
  );
}
