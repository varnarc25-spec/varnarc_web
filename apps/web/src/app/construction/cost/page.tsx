import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import {
  CONSTRUCTION_COST_AREA_METHODOLOGY,
  CONSTRUCTION_COST_AREA_QUALIFICATION,
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

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">
          Searchers looking for “1500 sq ft house construction cost” should land on a page with a
          rupee range, quality table, materials sketch and a calculator — not a blank form. Each
          size below uses the same published cost engine.
        </p>
        <p className="text-xs text-slate-500">{CONSTRUCTION_COST_AREA_METHODOLOGY}</p>
      </section>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {landings.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#f97316]"
            >
              <p className="text-lg font-bold text-[#0b1f3a]">{item.label}</p>
              <p className="mt-1 text-sm text-slate-600">House construction cost in India</p>
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
