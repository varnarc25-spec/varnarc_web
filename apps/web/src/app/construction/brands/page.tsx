import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchConstructionBrands } from '@/services/construction';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';

export async function generateMetadata() {
  return buildConstructionPageMetadata('brands');
}

export const revalidate = 60;

export default async function ConstructionBrandsPage() {
  const { data } = await fetchConstructionBrands({ limit: 48 });
  const defaults = CONSTRUCTION_PAGE_DEFAULTS.brands;

  return (
    <ContentLayout
      title={defaults.h1}
      description={defaults.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Brands' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: 'Brands', path: '/construction/brands' }])}
        webPage={{
          name: defaults.title,
          description: defaults.description,
          path: '/construction/brands',
        }}
        itemList={
          data.length
            ? {
                name: 'Construction material brands',
                path: '/construction/brands',
                items: data.map((b) => ({
                  name: b.name,
                  path: `/construction/brands/${b.slug}`,
                })),
              }
            : undefined
        }
      />
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
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {brand._count.materials} materials
                </p>
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
