import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchConstructionBrands } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction Brands',
  description: 'Compare cement, steel, paint, and tile brands.',
  alternates: { canonical: '/construction/brands' },
};

export const revalidate = 60;

export default async function ConstructionBrandsPage() {
  const { data } = await fetchConstructionBrands({ limit: 48 });

  return (
    <ContentLayout
      title="Brands"
      description="Explore trusted construction material brands and their product lines."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Brands' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((brand) => (
            <Link
              key={brand.id}
              href={`/construction/brands/${brand.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h2 className="text-base font-extrabold text-[#0b1f3a]">{brand.name}</h2>
              {brand.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{brand.description}</p>
              ) : null}
              {brand._count?.materials != null ? (
                <p className="mt-2 text-xs font-medium text-slate-500">{brand._count.materials} materials</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No brands yet" message="Published brands will appear here." />
      )}
    </ContentLayout>
  );
}
