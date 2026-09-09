import type { Metadata } from 'next';
import Link from 'next/link';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionBreadcrumbs } from '@/components/construction/construction-breadcrumbs';
import {
  CONSTRUCTION_COST_AREA_METHODOLOGY,
  CONSTRUCTION_COST_AREA_QUALIFICATION,
  listIndexableConstructionCostAreaLandings,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, buildConstructionPageMetadata } from '@/lib/construction/seo';
import { cx, cn } from '@/components/construction/styles';

export async function generateMetadata(): Promise<Metadata> {
  return buildConstructionPageMetadata('cost-by-area');
}

export const revalidate = 3600;

export default function ConstructionCostByAreaHubPage() {
  const landings = listIndexableConstructionCostAreaLandings();

  return (
    <div className="w-full bg-white pb-16">
      <header className="full-bleed border-b border-slate-200/70 bg-[#f4f7fb]">
        <div className="site-container py-8 sm:py-10">
          <ConstructionBreadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Construction', href: '/construction' },
              { label: 'Cost by area' },
            ]}
          />
          <div className="mt-4 max-w-3xl">
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]">
              House construction cost by area
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Plan, quantify and manage your construction project. Each size page shows an
              indicative rupee range, materials sketch, BOQ-style breakdown and the same engine as
              the interactive calculator.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#0b1f3a]">
              {[
                'Estimate costs',
                'Plan materials',
                'Control budget',
                'Complete with confidence',
              ].map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/construction/cost-calculator" className={cx.accentBtn}>
                Create project
              </Link>
              <Link href="/construction/boq-generator" className={cx.secondaryBtn}>
                Open BOQ
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="site-container py-8 sm:py-10">
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

        <p className="text-sm leading-relaxed text-slate-700">
          Searchers looking for “1500 sq ft house construction cost” land on a dashboard with a
          rupee range, quality table, materials sketch and calculator — not a blank form.
        </p>
        <p className="mt-2 text-xs text-slate-500">{CONSTRUCTION_COST_AREA_QUALIFICATION}</p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {landings.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={cn(cx.card, 'block p-5 transition hover:border-[#f97316]')}
              >
                <p className="text-lg font-bold text-[#0b1f3a]">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">House construction cost in India</p>
                <p className="mt-3 text-sm font-semibold text-[#f97316]">Open estimate →</p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-slate-500">{CONSTRUCTION_COST_AREA_METHODOLOGY}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/construction/cost-calculator" className={cx.accentBtn}>
            Open cost calculator
          </Link>
          <Link href="/construction/construction-cost" className={cx.secondaryBtn}>
            Cost by city
          </Link>
        </div>
      </div>
    </div>
  );
}
