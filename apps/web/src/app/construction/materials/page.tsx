import Link from 'next/link';
import { Suspense } from 'react';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import {
  ConstructionMaterialCard,
  RelatedCalculators,
} from '@/components/construction/construction-material-card';
import { MaterialsHubCard } from '@/components/construction/materials-hub/materials-hub-card';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionSearchAnalytics } from '@/components/construction/construction-search-analytics';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_HUB_QUALIFICATION,
  materialsInCategory,
  type MaterialCategoryId,
} from '@/lib/construction/materials-hub/catalog';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { fetchConstructionCategories, fetchConstructionMaterials } from '@/services/construction';
import { cn, cx } from '@/components/construction/styles';

type Props = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    brandId?: string;
    featured?: string;
    category?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('materials', { searchParams: params });
}

export const revalidate = 60;

const calculatorLinks = [
  { href: '/construction/cost-calculator', label: 'Construction Cost Calculator' },
  { href: '/construction/cement-calculator', label: 'Cement Calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete Calculator' },
  { href: '/construction/brick-calculator', label: 'Brick Calculator' },
  { href: '/construction/steel-calculator', label: 'Steel Calculator' },
  { href: '/construction/paint-calculator', label: 'Paint Calculator' },
  { href: '/construction/tile-calculator', label: 'Tile Calculator' },
  { href: '/construction/flooring-calculator', label: 'Flooring Calculator' },
  { href: '/construction/sand-calculator', label: 'Sand Calculator' },
  { href: '/construction/aggregate-calculator', label: 'Aggregate Calculator' },
  { href: '/construction/plaster-calculator', label: 'Plaster Calculator' },
];

function isMaterialCategory(value: string | undefined): value is MaterialCategoryId {
  return MATERIAL_CATEGORIES.some((c) => c.id === value);
}

export default async function ConstructionMaterialsPage({ searchParams }: Props) {
  const params = await searchParams;
  const hubCategory = isMaterialCategory(params.category) ? params.category : 'all';
  const hubMaterials = materialsInCategory(hubCategory);
  const hasCmsFilters = Boolean(
    params.search || params.categoryId || params.brandId || params.featured === 'true',
  );

  const { data } = await fetchConstructionMaterials({
    limit: 48,
    search: params.search,
    categoryId: params.categoryId,
    brandId: params.brandId,
    featured: params.featured === 'true',
  });
  const { data: categories } = await fetchConstructionCategories();
  const hasSearch = Boolean(params.search?.trim());

  return (
    <ContentLayout
      title="Construction materials"
      description="Educational material guides by category — plus published catalog listings with indicative prices when available."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Materials' },
      ]}
    >
      {hasSearch ? (
        <Suspense fallback={null}>
          <ConstructionSearchAnalytics resultCount={data.length} />
        </Suspense>
      ) : null}
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Materials', path: '/construction/materials' },
        ])}
        itemList={{
          name: 'Construction material guides',
          path: '/construction/materials',
          items: hubMaterials.slice(0, 20).map((m) => ({
            name: m.name,
            path: `/construction/materials/${m.slug}`,
          })),
        }}
      />

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-600">
        {MATERIAL_HUB_QUALIFICATION}
      </p>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0b1f3a]">Material guides</h2>
            <p className="mt-1 text-sm text-slate-600">
              Structural, masonry, finishing, interior, exterior, electrical and plumbing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/construction/material-selector" className={cx.link}>
              Material selector
            </Link>
            <Link href="/construction/compare" className={cx.link}>
              Compare materials
            </Link>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <Link
            href="/construction/materials"
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium',
              hubCategory === 'all'
                ? 'border-[#f97316] text-[#f97316]'
                : 'border-slate-200 text-[#0b1f3a]',
            )}
          >
            All
          </Link>
          {MATERIAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/construction/materials?category=${cat.id}`}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium',
                hubCategory === cat.id
                  ? 'border-[#f97316] text-[#f97316]'
                  : 'border-slate-200 text-[#0b1f3a]',
              )}
              title={cat.description}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {hubMaterials.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubMaterials.map((material) => (
              <MaterialsHubCard key={material.slug} material={material} />
            ))}
          </div>
        ) : (
          <EmptyState title="No guides in this category" message="Try another category filter." />
        )}
      </section>

      <section className="mb-8 border-t border-slate-200 pt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Published catalog</h2>
          <p className="mt-1 text-sm text-slate-600">
            CMS materials with optional indicative prices, brands and affiliate listings.
          </p>
        </div>

        {categories.length ? (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/construction/materials"
              className={`rounded-full border px-3 py-1.5 text-sm ${!params.categoryId ? 'border-[#f97316] text-[#f97316]' : 'border-slate-200 text-[#0b1f3a]'}`}
            >
              All listings
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
                meta={
                  [material.category?.name, material.brand?.name].filter(Boolean).join(' · ') ||
                  null
                }
                featured={material.featured}
                sponsored={material.sponsored}
                price={material.approximatePrice}
                unit={material.unit}
                trackAsSearchResult={hasSearch}
                trackPrice={material.approximatePrice != null}
                materialKey={material.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={hasCmsFilters ? 'No matching listings' : 'No catalog materials yet'}
            message={
              hasCmsFilters
                ? 'Try clearing search or category filters.'
                : 'Published materials will appear here when available. Educational guides above remain available.'
            }
          />
        )}
      </section>

      <RelatedCalculators links={calculatorLinks} />
    </ContentLayout>
  );
}
