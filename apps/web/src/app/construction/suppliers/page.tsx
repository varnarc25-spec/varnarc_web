import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchConstructionSuppliers } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction Suppliers',
  description: 'Find building material suppliers, contractors, and professionals.',
  alternates: { canonical: '/construction/suppliers' },
};

export default async function ConstructionSuppliersPage() {
  const { data: suppliers } = await fetchConstructionSuppliers();

  return (
    <ContentLayout
      title="Suppliers & professionals"
      description="Browse construction businesses from our directory — dealers, contractors, and home-building experts."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Suppliers' },
      ]}
    >
      <p className="mb-6 text-sm text-slate-600">
        Listings are sourced from the{' '}
        <Link href="/directory?vertical=construction" className="font-medium text-[#f97316] hover:underline">
          business directory
        </Link>
        . Contact suppliers directly or view their full profile for services and reviews.
      </p>

      {suppliers.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/directory/${supplier.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-extrabold text-[#0b1f3a]">{supplier.name}</h2>
                {supplier.sponsored ? (
                  <span className="shrink-0 rounded-full bg-[#f97316] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Sponsored
                  </span>
                ) : null}
              </div>
              {supplier.category ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{supplier.category}</p>
              ) : null}
              {supplier.city ? <p className="mt-2 text-sm text-slate-600">{supplier.city}</p> : null}
              {supplier.phone ? (
                <p className="mt-2 text-sm font-medium text-[#0b1f3a]">{supplier.phone}</p>
              ) : null}
              {supplier.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{supplier.description}</p>
              ) : null}
              <span className="mt-3 inline-block text-sm font-medium text-[#f97316]">View profile →</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No supplier listings yet"
          message="Construction suppliers will appear here once directory businesses are tagged with construction categories."
          action={
            <Link
              href="/directory?vertical=construction"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Browse directory
            </Link>
          }
        />
      )}
    </ContentLayout>
  );
}
