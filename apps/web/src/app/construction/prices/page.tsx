import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PricesHubClient } from '@/components/construction/prices-hub/prices-hub-client';
import { PriceHistoryPanel } from '@/components/construction/prices-hub/price-history-panel';
import { fetchPricePairHistory, fetchPricesHub } from '@/lib/construction/prices-hub/api';
import {
  PRICE_HISTORY_DISCLAIMER,
  PRICE_HUB_CITIES,
  PRICE_HUB_MATERIALS,
  PRICE_HUB_QUALIFICATION,
  isPriceHubCitySlug,
  isPriceHubMaterialKey,
} from '@varnarc/validation';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<{ material?: string; location?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('prices', { searchParams: params });
}

export const revalidate = 60;

export default async function ConstructionPricesPage({ searchParams }: Props) {
  const params = await searchParams;
  const material = isPriceHubMaterialKey(params.material ?? '') ? params.material : undefined;
  const location = isPriceHubCitySlug(params.location ?? '') ? params.location : undefined;

  const [hub, pairHistory] = await Promise.all([
    fetchPricesHub({ material, location }),
    material && location ? fetchPricePairHistory(material, location) : Promise.resolve(null),
  ]);

  const fallback: NonNullable<typeof hub> = {
    materials: PRICE_HUB_MATERIALS.map((m) => ({
      key: m.key,
      label: m.label,
      unitHint: m.unitHint,
      calculatorHref: m.calculatorHref,
      hasData: false,
    })),
    locations: PRICE_HUB_CITIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      hasData: false,
    })),
    latest: [],
    observationCount: 0,
    currentCount: 0,
    olderCount: 0,
  };
  const data = hub ?? fallback;

  return (
    <ContentLayout
      title="Construction prices"
      description="Location and material reference prices with freshness labels — stale values are never shown as current."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Prices' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: 'Prices', path: '/construction/prices' }])}
        webPage={{
          name: 'Construction material prices',
          description:
            'Location and material reference prices with freshness labels — stale values are never shown as current.',
          path: '/construction/prices',
        }}
        itemList={{
          name: 'Construction materials with price context',
          path: '/construction/prices',
          items: data.materials.map((m) => ({
            name: m.label,
          })),
        }}
      />
      <PricesHubClient initial={data} material={material} location={location} />

      {pairHistory ? (
        <div className="mt-10 border-t border-slate-200 pt-8">
          <PriceHistoryPanel
            current={pairHistory.current}
            history={pairHistory.history}
            changes={pairHistory.changes ?? []}
            materialLabel={pairHistory.material.label}
            cityName={pairHistory.city.name}
          />
        </div>
      ) : material && location ? (
        <p className="mt-8 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          Price history for this pair appears when enough reliable observations exist. Select a
          material and city with published data, or open an indexed city page when available.
        </p>
      ) : (
        <p className="mt-8 text-sm text-slate-600">
          Select both a material and a city to view period changes and the observation chart.
        </p>
      )}

      <p className="mt-8 text-sm text-slate-600">
        {PRICE_HUB_QUALIFICATION} {PRICE_HISTORY_DISCLAIMER}{' '}
        <Link href="/construction/materials" className="font-semibold text-[#f97316]">
          Materials hub
        </Link>
        {' · '}
        <Link href="/construction/price-alerts" className="font-semibold text-[#f97316]">
          Price alerts
        </Link>
        {' · '}
        <Link href="/construction/fair-price-checker" className="font-semibold text-[#f97316]">
          Fair Price Checker
        </Link>
        {' · '}
        <Link href="/construction/price-position" className="font-semibold text-[#f97316]">
          Price position
        </Link>
        {' · '}
        <Link href="/construction/community-prices" className="font-semibold text-[#f97316]">
          Community prices
        </Link>
        {' · '}
        <Link href="/construction/suppliers" className="font-semibold text-[#f97316]">
          Suppliers
        </Link>
      </p>
    </ContentLayout>
  );
}
