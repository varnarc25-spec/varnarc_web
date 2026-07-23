import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchAutomobileComparisons } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Vehicle Comparisons',
  description: 'Curated side-by-side comparisons of popular cars and SUVs.',
  alternates: { canonical: '/automobile/comparisons' },
};

export const revalidate = 60;

export default async function AutomobileComparisonsPage() {
  const { data } = await fetchAutomobileComparisons();

  return (
    <ContentLayout
      title="Saved comparisons"
      description="Editorial vehicle match-ups with full specification tables."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Comparisons' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((item) => (
            <Link
              key={item.id}
              href={`/automobile/comparisons/${item.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h2 className="text-base font-extrabold text-[#0b1f3a]">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {item.vehicleCount ?? item.vehicleIds?.length ?? 0} vehicles compared
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved comparisons yet"
          message="Build a custom comparison or check back for curated match-ups."
          action={
            <Link
              href="/automobile/compare"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Open compare tool
            </Link>
          }
        />
      )}
    </ContentLayout>
  );
}
