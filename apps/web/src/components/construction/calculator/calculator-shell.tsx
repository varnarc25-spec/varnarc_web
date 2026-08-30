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
}: {
  breadcrumbs?: ConstructionCrumb[];
  title: string;
  description?: string;
  lastUpdated?: string;
  form: ReactNode;
  result?: ReactNode;
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
}) {
  return (
    <main className={cn('w-full bg-white', stickyCta ? 'pb-24 md:pb-0' : '', className)}>
      <div className="site-container py-8 sm:py-10">
        {breadcrumbs?.length ? <ConstructionBreadcrumbs items={breadcrumbs} /> : null}

        <header className="max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
          {lastUpdated ? (
            <p className="mt-2 text-xs text-slate-500">Last updated: {lastUpdated}</p>
          ) : null}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <section aria-label="Calculator inputs">{form}</section>
          <section aria-label="Calculator results" className="space-y-4 lg:sticky lg:top-24">
            {result ? <CalculatorSaveSlot /> : null}
            {result ? <CalculatorShareSlot /> : null}
            {result ?? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Enter values and calculate to see an indicative result.
              </div>
            )}
            {result ? <ConstructionWhatNextSlot /> : null}
            {breakdown}
            {assumptions}
          </section>
        </div>

        {formula ? (
          <ConstructionSection id="formula" title="Formula" className="mt-12">
            {formula}
          </ConstructionSection>
        ) : null}

        {methodology ? (
          <ConstructionSection id="methodology" title="Methodology" className="mt-12">
            {methodology}
          </ConstructionSection>
        ) : null}

        {seoContent ? (
          <ConstructionSection
            id="about-this-calculator"
            title="About this calculator"
            className="mt-12"
          >
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">{seoContent}</div>
          </ConstructionSection>
        ) : null}

        {relatedTools?.length ? (
          <div className="mt-12">
            <RelatedTools items={relatedTools} variant="chips" />
          </div>
        ) : null}

        {relatedGuides?.length ? (
          <div className="mt-12">
            <RelatedGuides items={relatedGuides} />
          </div>
        ) : null}

        {faqs?.length ? (
          <div className="mt-12">
            <ConstructionFAQ faqs={faqs} />
          </div>
        ) : null}
      </div>

      {stickyCta ? <StickyMobileCTA {...stickyCta} /> : null}
    </main>
  );
}
