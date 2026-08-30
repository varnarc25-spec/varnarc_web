import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PriceMaterialCityLandingView } from '@/components/construction/prices-hub/price-material-city-landing-view';
import { fetchIndexablePriceLandings, fetchPriceLanding } from '@/lib/construction/prices-hub/api';
import {
  PRICE_LANDING_QUALIFICATION,
  isPriceHubCitySlug,
  isPriceHubMaterialKey,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ material: string; city: string }> };

export async function generateStaticParams() {
  const pairs = await fetchIndexablePriceLandings();
  return pairs.map((p) => ({ material: p.material, city: p.city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { material, city } = await params;
  if (!isPriceHubMaterialKey(material) || !isPriceHubCitySlug(city)) {
    return { robots: { index: false, follow: false } };
  }
  const landing = await fetchPriceLanding(material, city);
  if (!landing?.indexable || !landing.seo) {
    return {
      title: 'Price data unavailable',
      robots: { index: false, follow: false },
    };
  }
  const indexing = resolveConstructionIndexing({
    pathname: landing.canonicalPath,
  });
  const title = `${landing.material.label} Prices in ${landing.city.name} | Varnarc`;
  const description = landing.current
    ? `Reference ${landing.material.label.toLowerCase()} price in ${landing.city.name}: ${landing.current.price} ${landing.current.currency}/${landing.current.unit}. Freshness: ${landing.current.freshnessLabel}. Verify locally.`
    : `Construction ${landing.material.label.toLowerCase()} price reference for ${landing.city.name}.`;

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

export default async function PriceLandingPage({ params }: Props) {
  const { material, city } = await params;
  if (!isPriceHubMaterialKey(material) || !isPriceHubCitySlug(city)) notFound();

  const landing = await fetchPriceLanding(material, city);
  if (!landing?.indexable || !landing.seo) notFound();

  const path = landing.canonicalPath;

  return (
    <ContentLayout
      title={`${landing.material.label} prices in ${landing.city.name}`}
      description={landing.seo.qualification || PRICE_LANDING_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Prices', href: '/construction/prices' },
        { label: `${landing.material.label} · ${landing.city.name}` },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Prices', path: '/construction/prices' },
          { name: `${landing.material.label} in ${landing.city.name}`, path },
        ])}
        article={{
          title: `${landing.material.label} prices in ${landing.city.name}`,
          description: landing.seo.editorialIntro.slice(0, 160),
          path,
          dateModified: landing.seo.lastUpdatedIso ?? undefined,
        }}
        faqs={landing.seo.faqs}
        lastUpdated={landing.seo.lastUpdatedIso ?? undefined}
        lastUpdatedLabel="Price observation update"
      />

      <PriceMaterialCityLandingView landing={landing} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/prices" className={cx.secondaryBtn}>
          All prices
        </Link>
        <Link
          href={`/construction/construction-cost/${landing.city.slug}`}
          className={cx.secondaryBtn}
        >
          Construction cost in {landing.city.name}
        </Link>
      </div>
    </ContentLayout>
  );
}
