import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import {
  ConstructionMaterialCard,
  RelatedCalculators,
} from '@/components/construction/construction-material-card';
import { fetchConstructionCategories, fetchConstructionMaterials } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction Materials',
  description: 'Browse cement, steel, tiles, paint, and other building materials.',
  alternates: { canonical: '/construction/materials' },
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ search?: string; categoryId?: string; brandId?: string; featured?: string }>;
};

const calculatorLinks = [
  { href: '/calculators/construction-cost', label: 'Construction Cost Calculator' },
  { href: '/calculators/cement', label: 'Cement Calculator' },
  { href: '/calculators/concrete', label: 'Concrete Calculator' },
  { href: '/calculators/brick', label: 'Brick Calculator' },
  { href: '/calculators/steel', label: 'Steel Calculator' },
  { href: '/calculators/paint', label: 'Paint Calculator' },
  { href: '/calculators/tile', label: 'Tile Calculator' },
  { href: '/calculators/flooring', label: 'Flooring Calculator' },
  { href: '/calculators/sand', label: 'Sand Calculator' },
  { href: '/calculators/aggregate', label: 'Aggregate Calculator' },
  { href: '/calculators/plaster', label: 'Plaster Calculator' },
];

export default async function ConstructionMaterialsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { data } = await fetchConstructionMaterials({
    limit: 48,
    search: params.search,
    categoryId: params.categoryId,
    brandId: params.brandId,
    featured: params.featured === 'true',
  });
  const { data: categories } = await fetchConstructionCategories();

  return (
    <ContentLayout
      title="Materials"
      description="Compare specifications, prices, and brands for construction materials."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Materials' },
      ]}
    >
      {categories.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/construction/materials"
            className={`rounded-full border px-3 py-1.5 text-sm ${!params.categoryId ? 'border-[#f97316] text-[#f97316]' : 'border-slate-200 text-[#0b1f3a]'}`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/construction/materials?categoryId=${cat.id}`}
              className={`rounded-full border px-3 py-1.5 text-sm ${params.categoryId === cat.id ? 'border-[#f97316] text-[#f97316]' : 'border-slate-200 text-[#0b1f3a]'}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      ) : null}

      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((material) => (
            <ConstructionMaterialCard
              key={material.id}
              name={material.name}
              href={`/construction/materials/${material.id}`}
              description={material.description}
              meta={[material.category?.name, material.brand?.name].filter(Boolean).join(' · ') || null}
              featured={material.featured}
              sponsored={material.sponsored}
              price={material.approximatePrice}
              unit={material.unit}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No materials yet" message="Published materials will appear here." />
      )}

      <RelatedCalculators links={calculatorLinks} />
    </ContentLayout>
  );
}
