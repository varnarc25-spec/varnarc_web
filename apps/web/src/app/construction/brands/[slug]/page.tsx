import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { ConstructionMaterialCard } from '@/components/construction/construction-material-card';
import { RelatedArticles } from '@/components/construction/related-articles';
import { fetchConstructionBrandBySlug, fetchConstructionMaterials } from '@/services/construction';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchConstructionBrandBySlug(slug);
    return buildSeoMetadata({
      entityType: 'construction_brand',
      entityId: data.id,
      path: `/construction/brands/${slug}`,
      title: data.name,
      description: data.description || `${data.name} construction materials.`,
      image: data.logoUrl,
    });
  } catch {
    return { title: 'Brand', alternates: { canonical: `/construction/brands/${slug}` } };
  }
}

export default async function ConstructionBrandDetailPage({ params }: Props) {
  const { slug } = await params;
  let brand: Awaited<ReturnType<typeof fetchConstructionBrandBySlug>>['data'];

  try {
    const result = await fetchConstructionBrandBySlug(slug);
    brand = result.data;
  } catch {
    notFound();
  }

  const materialsRes = await fetchConstructionMaterials({ brandId: brand.id, limit: 12 });
  const materials = brand.materials?.length ? brand.materials : materialsRes.data;

  return (
    <PageShell
      title={brand.name}
      description={brand.description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Brands', href: '/construction/brands' },
        { label: brand.name },
      ]}
    >
      {brand.website ? (
        <p className="mb-6">
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#f97316] hover:underline"
          >
            Visit website →
          </a>
        </p>
      ) : null}

      {brand.description ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">About</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{brand.description}</p>
        </section>
      ) : null}

      {materials.length ? (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Materials</h2>
            <Link href={`/construction/materials?brandId=${brand.id}`} className="text-sm text-[#f97316] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <ConstructionMaterialCard
                key={material.id}
                name={material.name}
                href={`/construction/materials/${material.id}`}
                description={material.description}
                price={material.approximatePrice}
                unit={material.unit}
                featured={material.featured}
                sponsored={material.sponsored}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-slate-600">No published materials for this brand yet.</p>
      )}

      <RelatedArticles />
    </PageShell>
  );
}
