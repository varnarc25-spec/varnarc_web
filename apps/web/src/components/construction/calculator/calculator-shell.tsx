import Link from 'next/link';
import type { ReactNode } from 'react';
import { ConstructionBreadcrumbs } from '@/components/construction/construction-breadcrumbs';
import { ConstructionSection } from '@/components/construction/construction-section';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { RelatedTools } from '@/components/construction/related-tools';
import { RelatedGuides } from '@/components/construction/related-guides';
import { StickyMobileCTA } from '@/components/construction/sticky-mobile-cta';
import { CalculatorSaveSlot } from '@/components/construction/calculator/calculator-save-slot';
import { CalculatorShareSlot } from '@/components/construction/calculator/calculator-share-slot';
import { ConstructionWhatNextSlot } from '@/components/construction/calculator/construction-what-next-slot';
import {
  CONSTRUCTION_HERO_POINTS,
  ConstructionCalculatorModules,
  ConstructionHeroActions,
} from '@/components/construction/calculator/construction-calculator-dashboard';
import { HouseIllustration } from '@/components/construction/landing/landing-hero';
import type {
  ConstructionCrumb,
  ConstructionFaqItem,
  ConstructionLinkItem,
} from '@/components/construction/types';
import { cn } from '@/components/construction/styles';

/**
 * Shared layout for Construction calculators.
 * Compose form/result/methodology as slots — keep formula logic outside this shell.
 */
export function CalculatorShell({
  breadcrumbs,
  title,
  description,
  lastUpdated,
  form,
  result,
  workspace,
  workspaceToolbar,
  resultDetail,
  summary,
  extra,
  formula,
  assumptions,
  breakdown,
  relatedTools,
  relatedGuides,
  seoContent,
  faqs,
  methodology,
  stickyCta,
  className,
  areaSqft,
}: {
  breadcrumbs?: ConstructionCrumb[];
  title: string;
  description?: string;
  lastUpdated?: string;
  form: ReactNode;
  result?: ReactNode;
  workspace?: ReactNode;
  workspaceToolbar?: ReactNode;
  resultDetail?: ReactNode;
  summary?: ReactNode;
  extra?: ReactNode;
  formula?: ReactNode;
  assumptions?: ReactNode;
  breakdown?: ReactNode;
  relatedTools?: ConstructionLinkItem[];
  relatedGuides?: Array<ConstructionLinkItem & { category?: string | null; readMinutes?: number }>;
  seoContent?: ReactNode;
  faqs?: ConstructionFaqItem[];
  methodology?: ReactNode;
  stickyCta?: {
    primary: { label: string; href?: string; onClick?: () => void; disabled?: boolean };
    secondary?: { label: string; href?: string; onClick?: () => void };
  };
  className?: string;
  areaSqft?: number;
}) {
  const dashboardGrid = Boolean(workspace);

  return (
    <main
      className={cn('w-full overflow-x-clip bg-white', stickyCta ? 'pb-24 md:pb-0' : '', className)}
    >
      <header className="full-bleed border-b border-slate-200/70 bg-[#f4f7fb]">
        <div className="site-container py-8 sm:py-10">
          {breadcrumbs?.length ? <ConstructionBreadcrumbs items={breadcrumbs} /> : null}
          {dashboardGrid ? (
            <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                  <Link href="/construction" className="hover:text-[#ea580c]">
                    Construction
                  </Link>
                </p>
                <h1 className="mt-1 text-[1.75rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    {description}
                  </p>
                ) : (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    Calculate costs, estimate materials, generate BOQ, compare options and connect
                    with trusted professionals — all in one place.
                  </p>
                )}
                <ConstructionHeroActions areaSqft={areaSqft} />
                {lastUpdated ? (
                  <p className="mt-3 text-xs text-slate-500">Last updated: {lastUpdated}</p>
                ) : null}
              </div>
              <aside className="rounded-xl border border-sky-100 bg-[#e8f2fc] p-5 sm:p-6">
                <HouseIllustration />
                <ul className="mt-4 space-y-2.5">
                  {CONSTRUCTION_HERO_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-[#0b1f3a]">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#f97316]"
                        aria-hidden
                      >
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          ) : (
            <div className="mt-4 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                <Link href="/construction" className="hover:text-[#ea580c]">
                  Construction
                </Link>
              </p>
              <h1 className="mt-1 text-[1.75rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {description}
                </p>
              ) : (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  Calculate costs, estimate materials, generate BOQ, compare options and connect
                  with trusted professionals — all in one place.
                </p>
              )}
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#0b1f3a]">
                {CONSTRUCTION_HERO_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
              <ConstructionHeroActions areaSqft={areaSqft} />
              {lastUpdated ? (
                <p className="mt-3 text-xs text-slate-500">Last updated: {lastUpdated}</p>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <div className="site-container space-y-10 py-8 sm:py-10">
        {summary}

        {workspaceToolbar}

        <div
          className={
            dashboardGrid
              ? 'grid gap-6 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.25fr)_minmax(16rem,0.9fr)] lg:items-start'
              : 'grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start'
          }
        >
          <section aria-label="Project calculator">{form}</section>
          {dashboardGrid ? <section aria-label="Materials">{workspace}</section> : null}
          <section aria-label="Summary" className="space-y-4 lg:sticky lg:top-24">
            {dashboardGrid ? null : result ? <CalculatorSaveSlot /> : null}
            {dashboardGrid ? null : result ? <CalculatorShareSlot /> : null}
            {result ?? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Enter values and calculate to see an indicative result.
              </div>
            )}
            {dashboardGrid ? null : result ? <ConstructionWhatNextSlot /> : null}
            {dashboardGrid ? null : breakdown}
            {dashboardGrid ? null : assumptions}
          </section>
        </div>

        {resultDetail}

        {dashboardGrid && breakdown ? (
          <section aria-label="Construction cost breakdown">{breakdown}</section>
        ) : null}
        {dashboardGrid && assumptions ? (
          <section aria-label="Assumptions">{assumptions}</section>
        ) : null}

        {extra}

        <ConstructionCalculatorModules areaSqft={areaSqft} />

        {formula ? (
          <ConstructionSection id="formula" title="Formula">
            {formula}
          </ConstructionSection>
        ) : null}

        {methodology ? (
          <ConstructionSection id="methodology" title="Methodology">
            {methodology}
          </ConstructionSection>
        ) : null}

        {seoContent ? (
          <ConstructionSection id="about-this-calculator" title="About this calculator">
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">{seoContent}</div>
          </ConstructionSection>
        ) : null}

        {relatedTools?.length ? <RelatedTools items={relatedTools} variant="chips" /> : null}

        {faqs?.length && relatedGuides?.length ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-start">
            <ConstructionFAQ faqs={faqs} columns={1} />
            <RelatedGuides items={relatedGuides} columns={1} />
          </div>
        ) : (
          <>
            {relatedGuides?.length ? <RelatedGuides items={relatedGuides} /> : null}
            {faqs?.length ? <ConstructionFAQ faqs={faqs} /> : null}
          </>
        )}
      </div>

      {stickyCta ? <StickyMobileCTA {...stickyCta} /> : null}
    </main>
  );
}
