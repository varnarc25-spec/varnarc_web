import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { AdBanner } from '@/components/business/ad-banner';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { LoanDisclaimer } from '@/components/loans/loan-disclaimer';
import { LoanTypeNav } from '@/components/loans/loan-type-nav';
import {
  LoanFilters,
  LoanActiveFilterChips,
  type LoanFilterState,
} from '@/components/loans/loan-filters';
import { CarLoanDecisionProvider } from '@/components/loans/car-loan-decision-context';
import { CarLoanDecisionHero } from '@/components/loans/car-loan-decision-hero';
import { CarLoanSnapshot } from '@/components/loans/car-loan-snapshot';
import { CarLoanDownPayment } from '@/components/loans/car-loan-down-payment';
import { CarLoanOfferResults } from '@/components/loans/car-loan-offer-results';
import { CarLoanTenureSimulator } from '@/components/loans/car-loan-tenure-simulator';
import {
  CarLoanApplicationJourney,
  CarLoanBankVsDealer,
  CarLoanClosure,
  CarLoanEligibility,
  CarLoanFeesAndCharges,
  CarLoanFinancingPercent,
  CarLoanHypothecation,
  CarLoanInterestOverTime,
  CarLoanNewVsUsed,
  CarLoanPrepayment,
} from '@/components/loans/car-loan-decision-sections';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
import { CarLoanRelatedCalculators } from '@/components/loans/car-loan-related-calculators';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from '@/components/seo/json-ld';
import type {
  FinanceBank,
  FinanceCategory,
  FinanceFaq,
  FinanceGuide,
  FinanceLoan,
} from '@/services/finance';
import type { ArticleListItem } from '@/services/content';
import type { CursorMeta } from '@/services/api-client';
import type { HubFaqItem } from '@/components/hub/hub-faq-section';
import { loanCategoryCanonicalPath } from '@/lib/loan-path';
import type { CategoryContentSections } from '@/lib/loan-category-page';
import { pickLoanCategoryFaqs } from '@/lib/loan-category-faqs';
import { buildLoanCategoryGuideCards } from '@/lib/loan-guides';
import { CarLoanAffordability } from '@/components/loans/car-loan-affordability';
import {
  CAR_LOAN_DEFAULT_DOWN_PAYMENT,
  CAR_LOAN_DEFAULT_FAQS,
  CAR_LOAN_DEFAULT_GUIDES,
  CAR_LOAN_DECISION_HERO_ASSET,
  CAR_LOAN_ILLUSTRATIVE_RATE,
  CAR_LOAN_INTRO,
  CAR_LOAN_RELATED_CALCULATORS,
} from '@/lib/car-loan-page';

export type CarLoanPageProps = {
  category: FinanceCategory;
  categories: FinanceCategory[];
  banks: FinanceBank[];
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  filterState: LoanFilterState;
  sort: string;
  cursorMeta?: CursorMeta | null;
  nextPageHref?: string | null;
  loansFetchFailed?: boolean;
  faqs: FinanceFaq[];
  guides: FinanceGuide[];
  articles: ArticleListItem[];
  emiInitialAmount?: number;
  emiInitialRate?: number;
  emiInitialTenure?: number;
  emiInitialTenureUnit?: 'months' | 'years';
};

function parseContentSections(
  raw: FinanceCategory['contentSections'],
): CategoryContentSections | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as CategoryContentSections;
}

function resolveCarLoanHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  if (cms && cms.includes('car-loan-decision')) return cms;
  return CAR_LOAN_DECISION_HERO_ASSET;
}

function shouldUseDefaultCarLoanFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

export function CarLoanPage({
  category,
  categories,
  banks,
  loans,
  featuredLoans,
  filterState,
  sort,
  cursorMeta,
  nextPageHref,
  loansFetchFailed = false,
  faqs,
  guides,
  articles,
  emiInitialAmount,
  emiInitialRate,
  emiInitialTenure,
  emiInitialTenureUnit,
}: CarLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('car-loan');
  const cmsSections = parseContentSections(category.contentSections);

  const h1 = 'Plan and Compare Car Loans';
  const intro = category.introduction?.trim() || CAR_LOAN_INTRO;
  const heroImageUrl = resolveCarLoanHeroImage(category);
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    category.featuredImageAlt?.trim() ||
    'Car loan planning illustration showing vehicle price, down payment and EMI';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'car-loan', category.id, 8);
  const categoryFaqs: HubFaqItem[] = shouldUseDefaultCarLoanFaqs(cmsFaqs)
    ? CAR_LOAN_DEFAULT_FAQS.map((f, index) => ({
        id: `cl-faq-${index}`,
        question: f.question,
        answer: f.answer,
      }))
    : cmsFaqs;

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = (() => {
    const built = buildLoanCategoryGuideCards({
      categorySlug: 'car-loan',
      relatedGuideSlugs,
      articles,
      guides,
      limit: 6,
    });
    return built.length ? built : CAR_LOAN_DEFAULT_GUIDES.slice(0, 6);
  })();

  const relatedCalculators =
    Array.isArray(cmsSections?.relatedCalculatorSlugs) && cmsSections.relatedCalculatorSlugs.length
      ? (() => {
          const filtered = CAR_LOAN_RELATED_CALCULATORS.filter((link) =>
            cmsSections.relatedCalculatorSlugs!.some((slug) => {
              if (typeof slug !== 'string') return false;
              const haystack = `${link.href} ${link.label}`.toLowerCase();
              return (
                link.href.includes(`/calculators/${slug}`) ||
                haystack.includes(slug.toLowerCase()) ||
                haystack.includes(slug.replace(/-/g, ' ').toLowerCase())
              );
            }),
          );
          return filtered.length >= 2 ? filtered : CAR_LOAN_RELATED_CALCULATORS;
        })()
      : CAR_LOAN_RELATED_CALCULATORS;
  const calculatorLinks = relatedCalculators.length
    ? relatedCalculators
    : CAR_LOAN_RELATED_CALCULATORS;

  const initialTenureYears =
    emiInitialTenure != null
      ? emiInitialTenureUnit === 'months'
        ? Math.max(1, Math.round(emiInitialTenure / 12))
        : emiInitialTenure
      : 5;

  const initialVehiclePrice =
    emiInitialAmount != null ? emiInitialAmount + CAR_LOAN_DEFAULT_DOWN_PAYMENT : undefined;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Car Loans', url: `${siteUrl}${pathname}` },
  ]);

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: h1,
    description: intro,
    url: `${siteUrl}${pathname}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Varnarc',
      url: siteUrl,
    },
  };

  return (
    <main className="cl-page w-full bg-[var(--cl-surface-1,#fff)]">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={webPageLd} />
      {categoryFaqs.length ? (
        <JsonLd
          data={faqJsonLd(
            categoryFaqs.map((f) => ({
              question: f.question,
              answer: f.answer,
            })),
          )}
        />
      ) : null}

      <CarLoanDecisionProvider
        initialVehiclePrice={initialVehiclePrice}
        initialDownPayment={CAR_LOAN_DEFAULT_DOWN_PAYMENT}
        initialTenureYears={initialTenureYears}
        initialRate={emiInitialRate ?? CAR_LOAN_ILLUSTRATIVE_RATE}
      >
        {/* 1. Hero (white) */}
        <div className="full-bleed bg-[var(--cl-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Car Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="car-loan" categories={categories} />

            <div className="mt-3">
              <CarLoanDecisionHero illustrationSrc={heroImageUrl} illustrationAlt={heroImageAlt} />
            </div>
          </div>
        </div>

        {/* 2. Snapshot (cream) */}
        <CarLoanSnapshot />

        {/* 2b. Affordability (cream) */}
        <CarLoanAffordability />

        {/* 3. Down Payment (white) */}
        <CarLoanDownPayment />

        {/* 4. Compare Offers (blue-gray) */}
        <div id="car-loan-offers" className="full-bleed bg-[var(--cl-surface-2,#f4f6f9)]">
          <div className="site-container cl-section px-4">
            <LoanSectionHeader
              id="car-loan-offers-section-heading"
              eyebrow="Product comparison"
              title="Compare Car Loan Offers"
              description="Analytical comparison of listed car loans. Select up to 4 to compare side by side."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--cl-radius-lg)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="car-loan"
                  quiet
                />
              </Suspense>

              <div className="min-w-0">
                <Suspense fallback={null}>
                  <LoanActiveFilterChips
                    current={filterState}
                    categories={categories}
                    banks={banks}
                    hideCategoryChip
                    lockCategorySlug="car-loan"
                  />
                </Suspense>
                <CarLoanOfferResults
                  loans={loans}
                  featuredLoans={featuredLoans}
                  currentSort={sort}
                  pathname={pathname}
                  cursorMeta={cursorMeta}
                  nextPageHref={nextPageHref}
                  filterState={filterState}
                  loansFetchFailed={loansFetchFailed}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Tenure simulator (white) */}
        <CarLoanTenureSimulator />

        {/* 6. NewVsUsed (surface-4) */}
        <CarLoanNewVsUsed />

        {/* 7. Financing % (white) */}
        <CarLoanFinancingPercent />

        {/* 8. Interest over time (surface-2) */}
        <CarLoanInterestOverTime />

        {/* 9. BankVsDealer (cream) */}
        <CarLoanBankVsDealer />

        {/* 10. Eligibility (white) */}
        <CarLoanEligibility />

        {/* 11. Prepayment (surface-2) */}
        <CarLoanPrepayment />

        {/* 12. Fees (white) */}
        <CarLoanFeesAndCharges />

        {/* 13. Hypothecation (surface-4) */}
        <CarLoanHypothecation />

        {/* 14. Closure (white) */}
        <CarLoanClosure />

        {/* 15. Journey (surface-2) */}
        <CarLoanApplicationJourney />

        {/* Disclaimer */}
        <div className="full-bleed bg-[var(--cl-surface-3)]">
          <div className="site-container px-4 py-6">
            <LoanDisclaimer />
          </div>
        </div>

        {/* 16. Guides + 17. Related calculators (white) */}
        <section className="full-bleed bg-[var(--cl-surface-1)]">
          <div className="site-container space-y-12 cl-section px-4">
            <LoanGuidesSection
              guides={guideCards}
              title="Car Loan Guides"
              description="Focused explainers on choosing a car loan, eligibility, EMI and repayment."
              actionLabel="View all loan guides →"
            />

            <CarLoanRelatedCalculators links={calculatorLinks} />
          </div>
        </section>

        {/* 18. FAQs (surface-2) */}
        <section className="full-bleed bg-[var(--cl-surface-2,#f4f6f9)]">
          <div className="site-container cl-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Car Loan FAQs →"
              title="Car Loan FAQs"
            />
          </div>
        </section>
      </CarLoanDecisionProvider>
    </main>
  );
}
