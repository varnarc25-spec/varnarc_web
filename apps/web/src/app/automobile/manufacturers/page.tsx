import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchAutomobileManufacturers } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Automobile Manufacturers',
  description: 'Browse car and two-wheeler manufacturers and their vehicle lineups.',
  alternates: { canonical: '/automobile/manufacturers' },
};

export const revalidate = 60;

export default async function AutomobileManufacturersPage() {
  const { data } = await fetchAutomobileManufacturers({ limit: 48 });

  return (
    <ContentLayout
      title="Manufacturers"
      description="Explore automotive brands and their model lineups."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Manufacturers' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((mfr) => (
            <Link
              key={mfr.id}
              href={`/automobile/manufacturers/${mfr.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h2 className="text-base font-extrabold text-[#0b1f3a]">{mfr.name}</h2>
              {mfr.country ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{mfr.country}</p>
              ) : null}
              {mfr.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{mfr.description}</p>
              ) : null}
              {mfr._count?.vehicles != null ? (
                <p className="mt-3 text-sm text-[#ea580c]">{mfr._count.vehicles} vehicles →</p>
              ) : (
                <span className="mt-3 inline-block text-sm font-medium text-[#ea580c]">View lineup →</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No manufacturers yet" message="Published manufacturers will appear here." />
      )}
    </ContentLayout>
  );
}
