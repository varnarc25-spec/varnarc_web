import Link from 'next/link';
import { ConstructionQuickEstimator } from '@/components/construction/landing/quick-estimator-lazy';
import { Suspense } from 'react';
import { HubDisclaimer } from '@/components/hub/hub-disclaimer';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { RelatedGuides } from '@/components/construction/related-guides';
import { RelatedTools } from '@/components/construction/related-tools';
import { MaterialCard } from '@/components/construction/material-card';
import { ConstructionSection } from '@/components/construction/construction-section';
import { ConstructionLandingHero } from '@/components/construction/landing/landing-hero';
import { ConstructionBoqPreview } from '@/components/construction/landing/boq-preview';
import { ConstructionAdvancedCalculatorsSection } from '@/components/construction/landing/advanced-calculators-section';
import type { ConstructionProject } from '@/services/construction';
import { ConstructionIntentNavigator } from '@/components/construction/landing/intent-navigator';
import { ConstructionPricesNearYou } from '@/components/construction/landing/prices-near-you';
import {
  ConstructionLandingCompare,
  ConstructionMaterialQuantityCompact,
  ConstructionNextBestActions,
  ConstructionPlanJourney,
  ConstructionRecentlyUsedTools,
  ConstructionRenovationCostCompact,
  CurrentConstructionProjectSummary,
} from '@/components/construction/landing/landing-islands';
import { ConstructionCostByCity } from '@/components/construction/landing/cost-by-city';
import { ConstructionWhySection } from '@/components/construction/landing/why-section';
import { LoadingState } from '@/components/construction/loading-state';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { cx } from '@/components/construction/styles';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';
import {
  LANDING_FALLBACK_FAQS,
  LANDING_SEO_INTRO,
  PHASE2_HUB_TOOLS,
} from '@/lib/construction/landing';
import { getModuleHubMeta } from '@/lib/module-hub-configs';
import { listHubIndicativePriceCards } from '@varnarc/validation';
import { ConstructionHubPlanningTools } from '@/components/construction/landing/hub-planning-tools';

export type ConstructionLandingProps = {
  calculators: Array<{ label: string; href: string; description?: string | null }>;
  materials: Array<{
    id: string;
    name: string;
    href: string;
    description?: string | null;
    meta?: string | null;
    price?: number | string | null;
    unit?: string | null;
    priceLabel?: string | null;
    categoryName?: string | null;
    categorySlug?: string | null;
  }>;
  guides: Array<{
    href: string;
    label: string;
    description?: string | null;
    category?: string | null;
    readMinutes?: number;
  }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  projects: Array<{ id: string; name: string; href: string; summary?: string | null }>;
  serverProjects?: ConstructionProject[];
  isAuthenticated?: boolean;
  initialIntent?: string | null;
};

export function ConstructionLandingPage({
  calculators: _calculators,
  materials,
  guides,
  faqs: _faqs,
  serverProjects = [],
  isAuthenticated = false,
  initialIntent = null,
}: ConstructionLandingProps) {
  const meta = getModuleHubMeta('construction');
  const hubSeo = CONSTRUCTION_PAGE_DEFAULTS.hub;
  const faqItems: Array<{ id: string; question: string; answer: string }> = [
    ...LANDING_FALLBACK_FAQS,
  ];
  const popularTools = PHASE2_HUB_TOOLS.slice(0, 8).map((t) => ({
    label: t.label,
    href: t.href,
    description: t.note,
  }));
  const priced = materials.filter((m) => m.priceLabel).slice(0, 4);
  const catalogFallback = listHubIndicativePriceCards();
  const priceCards =
    priced.length > 0
      ? priced
      : catalogFallback.map((m) => ({
          id: m.id,
          name: m.name,
          href: m.href,
          priceLabel: m.priceLabel,
          meta: m.meta,
        }));

  return (
    <main className="w-full overflow-x-clip bg-white pb-20 md:pb-0">
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs()}
        webPage={{
          name: hubSeo.title,
          description: hubSeo.description,
          path: '/construction',
        }}
        faqs={faqItems.map((f) => ({ question: f.question, answer: f.answer }))}
        itemList={{
          name: 'Home construction planning tools',
          path: '/construction',
          items: PHASE2_HUB_TOOLS.map((c) => ({ name: c.label, path: c.href })),
        }}
      />

      <div className="site-container pt-6 sm:pt-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Construction' }]} />
      </div>

      <ConstructionLandingHero />

      <CurrentConstructionProjectSummary
        serverProjects={serverProjects}
        isAuthenticated={isAuthenticated}
      />

      <div className="site-container space-y-14 py-10 sm:space-y-16 sm:py-12">
        <Suspense fallback={<LoadingState label="Loading planner" variant="cards" />}>
          <ConstructionIntentNavigator initialIntent={initialIntent} />
        </Suspense>

        <ConstructionQuickEstimator />

        <ConstructionHubPlanningTools />

        <ConstructionRecentlyUsedTools />

        <RelatedTools
          title="Popular calculators"
          description="Start with cost, then cement, steel, brick and a planning BOQ."
          viewAllHref="/construction/calc"
          viewAllLabel="All construction calculations →"
          variant="chips"
          items={popularTools}
        />

        <ConstructionMaterialQuantityCompact serverProjects={serverProjects} />

        <ConstructionBoqPreview />

        <ConstructionRenovationCostCompact />

        <ConstructionAdvancedCalculatorsSection />

        <ConstructionPricesNearYou
          materials={priceCards.map((m) => ({
            id: m.id,
            name: m.name,
            href: m.href,
            priceLabel: m.priceLabel,
            meta: m.meta,
          }))}
        />

        <ConstructionSection
          id="popular-materials"
          title="Popular materials"
          description="Browse commonly specified materials with indicative pricing cues."
          action={{ href: '/construction/materials', label: 'All materials →' }}
        >
          {materials.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {materials.slice(0, 4).map((m) => (
                <MaterialCard
                  key={m.id}
                  name={m.name}
                  href={m.href}
                  description={m.description}
                  meta={m.meta}
                  price={m.price}
                  unit={m.unit}
                  trackPrice={m.price != null}
                  materialKey={m.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Materials will appear as the catalogue grows.{' '}
              <Link href="/construction/brands" className={cx.link}>
                Explore brands
              </Link>
              .
            </p>
          )}
        </ConstructionSection>

        <ConstructionLandingCompare
          materials={materials.slice(0, 12).map((m) => ({
            id: m.id,
            name: m.name,
            category: { name: m.categoryName ?? undefined, slug: m.categorySlug ?? undefined },
          }))}
        />

        <ConstructionCostByCity />

        <ConstructionPlanJourney serverProjects={serverProjects} />

        <ConstructionNextBestActions
          serverProjects={serverProjects}
          isAuthenticated={isAuthenticated}
        />

        <RelatedGuides
          title="Construction guides"
          description="Practical reading for estimates, materials and site phases."
          viewAllHref="/construction/guides"
          items={guides.slice(0, 4)}
        />

        <ConstructionFAQ
          title="Frequently asked questions"
          faqs={faqItems}
          viewAllHref="/construction/faqs"
        />

        <ConstructionWhySection />

        <section
          id="construction-overview"
          className="max-w-3xl border-t border-slate-100 pt-8"
          aria-labelledby="construction-overview-heading"
        >
          <h2 id="construction-overview-heading" className="text-lg font-extrabold text-[#0b1f3a]">
            Construction planning on Varnarc
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{LANDING_SEO_INTRO}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Open the{' '}
            <Link href="/construction/cost-calculator" className={cx.link}>
              construction cost calculator
            </Link>
            , then the{' '}
            <Link href="/construction/material-calculator" className={cx.link}>
              material calculator
            </Link>
            , refine with{' '}
            <Link href="/construction/cement-calculator" className={cx.link}>
              cement
            </Link>{' '}
            and{' '}
            <Link href="/construction/steel-calculator" className={cx.link}>
              steel
            </Link>
            , build a{' '}
            <Link href="/construction/boq" className={cx.link}>
              planning BOQ
            </Link>
            , check{' '}
            <Link href="/construction/construction-cost" className={cx.link}>
              construction cost by city
            </Link>
            , and find{' '}
            <Link href="/construction/professionals" className={cx.link}>
              professionals
            </Link>
            . Confirm quantities and rates locally before purchase or contract.
          </p>
        </section>
      </div>

      <HubDisclaimer text={meta.disclaimer} />
    </main>
  );
}
