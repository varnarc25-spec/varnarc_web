import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';
import {
  AffiliateCta,
  ConstructionDetailSection,
  RelatedCalculators,
} from '@/components/construction/construction-material-card';
import { RelatedArticles } from '@/components/construction/related-articles';
import { fetchConstructionMaterial, parseMaterialGuideSteps } from '@/services/construction';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
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
  { href: '/calculators/construction-cost', label: 'Construction Cost Calculator' },
  { href: '/calculators/cement', label: 'Cement Calculator' },
  { href: '/calculators/concrete', label: 'Concrete Calculator' },
  { href: '/calculators/brick', label: 'Brick Calculator' },
  { href: '/calculators/steel', label: 'Steel Calculator' },
  { href: '/calculators/paint', label: 'Paint Calculator' },
  { href: '/calculators/tile', label: 'Tile Calculator' },
  { href: '/calculators/sand', label: 'Sand Calculator' },
  { href: '/calculators/aggregate', label: 'Aggregate Calculator' },
  { href: '/calculators/plaster', label: 'Plaster Calculator' },
];

export default async function ConstructionMaterialDetailPage({ params }: Props) {
  const { id } = await params;
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
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const jsonLdGraph: Array<Record<string, unknown>> = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Construction', item: `${siteUrl}/construction` },
        { '@type': 'ListItem', position: 3, name: 'Materials', item: `${siteUrl}/construction/materials` },
        { '@type': 'ListItem', position: 4, name: material.name, item: `${siteUrl}/construction/materials/${id}` },
      ],
    },
    {
      '@type': 'Product',
      name: material.name,
      description: description || undefined,
      brand: material.brand?.name ? { '@type': 'Brand', name: material.brand.name } : undefined,
      category: material.category?.name,
      ...(material.approximatePrice != null
        ? {
            offers: {
              '@type': 'Offer',
              price: Number(material.approximatePrice),
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
            },
          }
        : {}),
      ...(material.rating != null ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(material.rating) } } : {}),
    },
  ];

  if (guideSteps?.length) {
    jsonLdGraph.push({
      '@type': 'HowTo',
      name: `How to use ${material.name}`,
      description: description || undefined,
      step: guideSteps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': jsonLdGraph,
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AdBanner slot="content-top" />

      {(material.featured || material.sponsored) ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {material.sponsored ? (
            <span className="rounded-full bg-[#f97316] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          ) : null}
          {material.featured ? (
            <span className="rounded-full bg-[#0b1f3a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
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
        <ConstructionDetailSection title="Overview">{material.description}</ConstructionDetailSection>
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
