import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';
import {
  AffiliateCta,
  ConstructionDetailSection,
  RelatedCalculators,
} from '@/components/construction/construction-material-card';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { MaterialGuideView } from '@/components/construction/materials-hub/material-guide-view';
import { RelatedArticles } from '@/components/construction/related-articles';
import {
  getMaterialGuide,
  isUuidParam,
  listMaterialSlugs,
} from '@/lib/construction/materials-hub/catalog';
import { fetchConstructionMaterial, parseMaterialGuideSteps } from '@/services/construction';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return listMaterialSlugs().map((slug) => ({ id: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const guide = getMaterialGuide(id);
  if (guide) {
    return {
      title: guide.seoTitle,
      description: guide.seoDescription,
      alternates: { canonical: `/construction/materials/${guide.slug}` },
    };
  }
  try {
    const { data } = await fetchConstructionMaterial(id);
    return buildSeoMetadata({
      entityType: 'construction_material',
      entityId: data.id,
      path: `/construction/materials/${id}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description,
      image: data.imageUrl,
    });
  } catch {
    return { title: 'Material', alternates: { canonical: `/construction/materials/${id}` } };
  }
}

const calculatorLinks = [
  { href: '/construction/cost-calculator', label: 'Construction Cost Calculator' },
  { href: '/construction/cement-calculator', label: 'Cement Calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete Calculator' },
  { href: '/construction/brick-calculator', label: 'Brick Calculator' },
  { href: '/construction/steel-calculator', label: 'Steel Calculator' },
  { href: '/construction/paint-calculator', label: 'Paint Calculator' },
  { href: '/construction/tile-calculator', label: 'Tile Calculator' },
  { href: '/construction/sand-calculator', label: 'Sand Calculator' },
  { href: '/construction/aggregate-calculator', label: 'Aggregate Calculator' },
  { href: '/construction/plaster-calculator', label: 'Plaster Calculator' },
];

export default async function ConstructionMaterialDetailPage({ params }: Props) {
  const { id } = await params;

  const guide = getMaterialGuide(id);
  if (guide) {
    return <MaterialGuideView page={guide} />;
  }

  // Non-guide slugs that aren't UUIDs cannot be CMS entities
  if (!isUuidParam(id)) {
    notFound();
  }

  let material: Awaited<ReturnType<typeof fetchConstructionMaterial>>['data'] | null = null;

  try {
    const result = await fetchConstructionMaterial(id);
    material = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const title = material.seoTitle || material.name;
  const description = material.seoDescription || material.description;
  const guideSteps = parseMaterialGuideSteps(material.specifications);
  const path = `/construction/materials/${id}`;

  return (
    <PageShell
      title={title}
      description={description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Materials', href: '/construction/materials' },
        { label: material.name },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Materials', path: '/construction/materials' },
          { name: material.name, path },
        ])}
        webPage={{
          name: title,
          description: description ?? undefined,
          path,
        }}
        howTo={
          guideSteps?.length
            ? {
                name: `How to use ${material.name}`,
                description: description ?? undefined,
                steps: guideSteps.map((step) => ({ name: step.name, text: step.text })),
              }
            : undefined
        }
      />
      <AdBanner slot="content-top" />

      {material.featured || material.sponsored ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {material.sponsored ? (
            <span className="rounded-full bg-[#f97316] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          ) : null}
          {material.featured ? (
            <span className="rounded-full bg-[#0b1f3a] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Category" value={material.category?.name || '—'} />
        <Stat label="Brand" value={material.brand?.name || '—'} />
        <Stat label="Unit" value={material.unit || '—'} />
        <Stat
          label="Approx. price"
          value={material.approximatePrice != null ? `₹${material.approximatePrice}` : '—'}
        />
      </div>

      {material.description ? (
        <ConstructionDetailSection title="Overview">
          {material.description}
        </ConstructionDetailSection>
      ) : null}
      {material.specifications ? (
        <ConstructionDetailSection title="Specifications">
          {typeof material.specifications === 'string'
            ? material.specifications
            : JSON.stringify(material.specifications, null, 2)}
        </ConstructionDetailSection>
      ) : null}
      {guideSteps?.length ? (
        <ConstructionDetailSection title="How to use">
          <ol className="list-decimal space-y-2 pl-5">
            {guideSteps.map((step) => (
              <li key={step.name}>
                <span className="font-semibold text-[#0b1f3a]">{step.name}</span>
                {step.text ? <span className="text-slate-700"> — {step.text}</span> : null}
              </li>
            ))}
          </ol>
        </ConstructionDetailSection>
      ) : null}
      {material.affiliateUrl ? (
        <div className="mt-8">
          <AffiliateCta url={material.affiliateUrl} />
        </div>
      ) : null}

      <RelatedCalculators links={calculatorLinks} />
      <RelatedArticles />
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-[#0b1f3a]">{value}</div>
    </div>
  );
}
