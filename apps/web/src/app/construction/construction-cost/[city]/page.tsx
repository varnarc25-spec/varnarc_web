import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionCostCityView } from '@/components/construction/construction-cost-city/construction-cost-city-view';
import {
  fetchConstructionCostCityLanding,
  fetchIndexableConstructionCostCities,
} from '@/lib/construction/construction-cost-city/api';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { isConstructionCostCitySlug } from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  const cities = await fetchIndexableConstructionCostCities();
  return cities.map((c) => ({ city: c.city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  if (!isConstructionCostCitySlug(city)) {
    return { robots: { index: false, follow: false } };
  }
  const landing = await fetchConstructionCostCityLanding(city);
  if (!landing?.indexable) {
    return {
      title: 'Construction cost data unavailable',
      robots: { index: false, follow: false },
    };
  }
  const indexing = resolveConstructionIndexing({
    pathname: landing.canonicalPath,
  });
  const title = `Construction Cost in ${landing.city.name} — ₹/sq ft & Ranges | Varnarc`;
  const description = `Indicative construction cost in ${landing.city.name}: about ${Math.round(landing.costPerSqft)} ₹/sq ft (standard), range for a ${landing.referenceAreaSqft} sq ft home, local rate update ${landing.localRateUpdatedAt}. Not a quote.`;

  return {
    title,
    description,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
    openGraph: {
      title,
      description,
      url: indexing.canonicalUrl,
      type: 'article',
    },
  };
}

export const revalidate = 300;
export const dynamicParams = true;

export default async function ConstructionCostCityPage({ params }: Props) {
  const { city } = await params;
  if (!isConstructionCostCitySlug(city)) notFound();

  const landing = await fetchConstructionCostCityLanding(city);
  if (!landing?.indexable) notFound();

  const path = landing.canonicalPath;

  return (
    <ContentLayout
      title={`Construction cost in ${landing.city.name}`}
      description={landing.qualification}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Construction cost', href: '/construction/construction-cost' },
        { label: landing.city.name },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Construction cost', path: '/construction/construction-cost' },
          { name: landing.city.name, path },
        ])}
        article={{
          title: `Construction cost in ${landing.city.name}`,
          description: landing.editorialIntro.slice(0, 160),
          path,
          dateModified: landing.localRateUpdatedAt,
        }}
        faqs={landing.faqs}
        webApplication={{
          name: `Construction cost calculator — ${landing.city.name}`,
          description: `Interactive estimate prefilled for ${landing.city.name}.`,
          path: landing.calculatorHref.split('?')[0]!,
        }}
        lastUpdated={landing.localRateUpdatedAt}
        lastUpdatedLabel="Local rate update"
      />

      <ConstructionCostCityView landing={landing} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/construction-cost" className={cx.secondaryBtn}>
          All city cost pages
        </Link>
        <Link href="/construction/prices" className={cx.secondaryBtn}>
          Prices hub
        </Link>
      </div>
    </ContentLayout>
  );
}
