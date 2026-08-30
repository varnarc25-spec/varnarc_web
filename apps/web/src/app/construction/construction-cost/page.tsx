import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { fetchIndexableConstructionCostCities } from '@/lib/construction/construction-cost-city/api';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import {
  CONSTRUCTION_COST_CITY_METHODOLOGY,
  CONSTRUCTION_COST_CITY_QUALIFICATION,
} from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

export async function generateMetadata() {
  return buildConstructionPageMetadata('construction-cost');
}

export const revalidate = 300;

export default async function ConstructionCostHubPage() {
  const cities = await fetchIndexableConstructionCostCities();

  return (
    <ContentLayout
      title="Construction cost by city"
      description={CONSTRUCTION_COST_CITY_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Construction cost' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Construction cost', path: '/construction/construction-cost' },
        ])}
        itemList={
          cities.length
            ? {
                name: 'Construction cost city pages',
                path: '/construction/construction-cost',
                items: cities.map((c) => ({ name: c.name, path: c.path })),
              }
            : undefined
        }
        webApplication={{
          name: 'Varnarc Construction Cost Calculator',
          description: 'Indicative house construction cost by city.',
          path: '/construction/cost-calculator',
        }}
      />

      <p className="max-w-3xl text-sm leading-relaxed text-slate-700">
        City pages publish only when Varnarc has a unique editorial profile and enough reliable
        local material price observations. Thin template URLs are not indexed.
      </p>
      <p className="mt-3 max-w-3xl text-xs text-slate-500">{CONSTRUCTION_COST_CITY_METHODOLOGY}</p>

      {cities.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          No city construction-cost pages meet the data gate yet. Check back as local price
          observations grow, or use the{' '}
          <Link href="/construction/cost-calculator" className="font-semibold text-[#f97316]">
            cost calculator
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <li key={c.city}>
              <Link
                href={c.path}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#f97316]/40"
              >
                <p className="font-bold text-[#0b1f3a]">Construction cost in {c.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Indicative ₹/sq ft, scenarios & local materials
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/cost-calculator" className={cx.primaryBtn}>
          Open cost calculator
        </Link>
        <Link href="/construction/prices" className={cx.secondaryBtn}>
          Material prices
        </Link>
      </div>
    </ContentLayout>
  );
}
