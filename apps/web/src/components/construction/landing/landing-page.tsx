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
import { ConstructionIntentNavigator } from '@/components/construction/landing/intent-navigator';
import { ConstructionContinueProject } from '@/components/construction/landing/continue-project';
import { ConstructionRecentlyUsedTools } from '@/components/construction/landing/recently-used-tools';
import { ConstructionPricesNearYou } from '@/components/construction/landing/prices-near-you';
import { ConstructionPlanJourney } from '@/components/construction/landing/plan-journey';
import { ConstructionLandingCompare } from '@/components/construction/landing/landing-compare';
import { ConstructionCostByCity } from '@/components/construction/landing/cost-by-city';
import { ConstructionWhySection } from '@/components/construction/landing/why-section';
import { LoadingState } from '@/components/construction/loading-state';
import { cx } from '@/components/construction/styles';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';
import { LANDING_FALLBACK_FAQS, LANDING_SEO_INTRO } from '@/lib/construction/landing';
import { getModuleHubMeta } from '@/lib/module-hub-configs';

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
  initialIntent?: string | null;
};

export function ConstructionLandingPage({
  calculators,
  materials,
  guides,
  faqs,
  projects,
  initialIntent = null,
}: ConstructionLandingProps) {
  const meta = getModuleHubMeta('construction');
  const hubSeo = CONSTRUCTION_PAGE_DEFAULTS.hub;
  const faqItems: Array<{ id: string; question: string; answer: string }> =
    faqs.length >= 2 ? faqs : [...LANDING_FALLBACK_FAQS];
  const priced = materials.filter((m) => m.priceLabel).slice(0, 6);
  const priceCards =
    priced.length > 0
      ? priced
      : materials.slice(0, 6).map((m) => ({
          ...m,
          priceLabel: m.priceLabel ?? null,
        }));

  return (
    <main className="w-full bg-white pb-20 md:pb-0">
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs()}
        webPage={{
          name: hubSeo.title,
          description: hubSeo.description,
          path: '/construction',
        }}
        faqs={faqItems.map((f) => ({ question: f.question, answer: f.answer }))}
        itemList={
          calculators.length
            ? {
                name: 'Popular construction calculators',
                path: '/construction',
                items: calculators.map((c) => ({ name: c.label, path: c.href })),
              }
            : undefined
        }
      />

      <ConstructionLandingHero />

      <div className="site-container space-y-12 py-8 sm:space-y-14 sm:py-10">
        <Suspense fallback={<LoadingState label="Loading planner" variant="cards" />}>
          <ConstructionIntentNavigator initialIntent={initialIntent} />
        </Suspense>

        <ConstructionQuickEstimator />

        <ConstructionContinueProject projects={projects} />

        <ConstructionRecentlyUsedTools />

        <RelatedTools
          title="Popular calculators"
          description="Quantity and cost tools for everyday construction decisions."
          viewAllHref="/calculators"
          viewAllLabel="All calculators →"
          items={calculators}
        />

        <ConstructionPricesNearYou
          materials={priceCards.map((m) => ({
            id: m.id,
            name: m.name,
            href: m.href,
            priceLabel: m.priceLabel,
            meta: m.meta,
          }))}
        />

        <ConstructionPlanJourney />

        <ConstructionSection
          id="popular-materials"
          title="Popular materials"
          description="Browse commonly specified materials with indicative pricing cues."
          action={{ href: '/construction/materials', label: 'All materials →' }}
        >
          {materials.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {materials.slice(0, 6).map((m) => (
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
          materials={materials.slice(0, 2).map((m) => ({ id: m.id, name: m.name }))}
        />

        <ConstructionCostByCity />

        <RelatedGuides
          title="Construction guides"
          description="Practical reading for estimates, materials and site phases."
          viewAllHref="/construction/guides"
          items={guides}
        />

        <ConstructionFAQ
          title="Frequently asked questions"
          faqs={faqItems}
          viewAllHref="/construction/faqs"
        />

        <ConstructionWhySection />

        {/* Crawlable SEO body beneath interactive modules */}
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
            Popular starting points include the{' '}
            <Link href="/construction/estimate" className={cx.link}>
              construction cost estimator
            </Link>
            ,{' '}
            <Link href="/construction/cement-calculator" className={cx.link}>
              cement calculator
            </Link>
            ,{' '}
            <Link href="/construction/compare" className={cx.link}>
              material comparisons
            </Link>
            , and{' '}
            <Link href="/construction/checklists" className={cx.link}>
              phase checklists
            </Link>
            . Estimates are planning aids — confirm quantities and rates with local professionals
            before purchase or contract.
          </p>
        </section>
      </div>

      <HubDisclaimer text={meta.disclaimer} />
    </main>
  );
}
