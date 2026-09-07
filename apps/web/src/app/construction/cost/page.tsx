import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import {
  ConstructionDashboardHero,
  ConstructionHeroActions,
} from '@/components/construction/construction-dashboard-chrome';
import {
  CONSTRUCTION_COST_AREA_METHODOLOGY,
  CONSTRUCTION_COST_AREA_QUALIFICATION,
  formatInr,
  listIndexableConstructionCostAreaLandings,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

export async function generateMetadata(): Promise<Metadata> {
  const indexing = resolveConstructionIndexing({ pathname: '/construction/cost' });
  const title = 'House Construction Cost by Area in India | Varnarc';
  const description =
    'Indicative construction cost for 500 to 3,000 sq ft houses in India — ranges, materials and calculators. Same engine as the Varnarc cost calculator. Not a quote.';
  return {
    title,
    description,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
  };
}

export const revalidate = 3600;

export default function ConstructionCostByAreaHubPage() {
  const landings = listIndexableConstructionCostAreaLandings();

  return (
    <ContentLayout
      title="House construction cost by area"
      description={CONSTRUCTION_COST_AREA_QUALIFICATION}
      hideTitle
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost by area' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost by area', path: '/construction/cost' },
        ])}
        itemList={{
          name: 'Construction cost by house size',
          path: '/construction/cost',
          items: landings.map((item) => ({ name: `${item.label} house`, path: item.path })),
        }}
      />

      <ConstructionDashboardHero
        headingAs="h1"
        title="Plan, quantify and manage your construction project"
        description="Pick a house size to see an indicative cost range, material quantities and a BOQ starting point. Same published engine as the full cost calculator."
        points={['Estimate costs', 'Plan materials', 'Control budget', 'Complete with confidence']}
      >
        <ConstructionHeroActions
          primaryHref="/construction/cost-calculator"
          primaryLabel="Open cost calculator"
          secondaryHref="/construction/boq-generator"
        />
      </ConstructionDashboardHero>

      <p className="mt-8 text-sm leading-relaxed text-slate-700">
        Searchers looking for “1500 sq ft house construction cost” land on a size page with a rupee
        range, quality table, materials sketch and calculator — not a blank form.
      </p>
      <p className="mt-2 text-xs text-slate-500">{CONSTRUCTION_COST_AREA_METHODOLOGY}</p>
      <p className="mt-1 text-xs text-slate-500">{CONSTRUCTION_COST_AREA_QUALIFICATION}</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {landings.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#f97316]"
            >
              <p className="text-lg font-bold text-[#0b1f3a]">{item.label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-[#f97316]">
                {formatInr(item.estimatedTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.rangeLabel} · standard quality</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/construction/cost-calculator" className={cx.primaryBtn}>
          Open cost calculator
        </Link>
        <Link href="/construction/construction-cost" className={cx.secondaryBtn}>
          Cost by city
        </Link>
      </div>
    </ContentLayout>
  );
}
