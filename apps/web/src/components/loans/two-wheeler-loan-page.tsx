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
import { TwoWheelerDecisionProvider } from '@/components/loans/two-wheeler-loan-decision-context';
import { TwoWheelerLoanDecisionHero } from '@/components/loans/two-wheeler-loan-decision-hero';
import { TwoWheelerLoanSnapshot } from '@/components/loans/two-wheeler-loan-snapshot';
import { TwoWheelerLoanDownPayment } from '@/components/loans/two-wheeler-loan-down-payment';
import { TwoWheelerLoanOfferResults } from '@/components/loans/two-wheeler-loan-offer-results';
import {
  TwTenureSimulator,
  TwFinancingPercent,
  TwNewVsUsed,
  TwAffordability,
  TwInterestOverTime,
  TwDealerVsLender,
  TwEligibility,
  TwFees,
  TwPrepayment,
  TwHypothecation,
  TwClosure,
  TwDocuments,
  TwApplicationJourney,
} from '@/components/loans/two-wheeler-loan-decision-sections';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
import { TwoWheelerLoanRelatedCalculators } from '@/components/loans/two-wheeler-loan-related-calculators';
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
import {
  TW_DEFAULT_DOWN_PAYMENT,
  TW_DEFAULT_FAQS,
  TW_DEFAULT_GUIDES,
  TW_DECISION_HERO_ASSET,
  TW_ILLUSTRATIVE_RATE,
  TW_INTRO,
  TW_RELATED_CALCULATORS,
} from '@/lib/two-wheeler-loan-page';

export type TwoWheelerLoanPageProps = {
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

function resolveTwHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  if (cms && cms.includes('two-wheeler')) return cms;
  return TW_DECISION_HERO_ASSET;
}

function shouldUseDefaultTwFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

export function TwoWheelerLoanPage({
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
}: TwoWheelerLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('two-wheeler-loan');
  const cmsSections = parseContentSections(category.contentSections);

  const h1 = 'Plan and Compare Two-Wheeler Loans';
  const intro = category.introduction?.trim() || TW_INTRO;
  const heroImageUrl = resolveTwHeroImage(category);
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    category.featuredImageAlt?.trim() ||
    'Two-wheeler loan planning illustration showing vehicle price, down payment and EMI';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'two-wheeler-loan', category.id, 8);
  const categoryFaqs: HubFaqItem[] = shouldUseDefaultTwFaqs(cmsFaqs)
    ? TW_DEFAULT_FAQS.map((f, index) => ({
        id: `tw-faq-${index}`,
        question: f.question,
        answer: f.answer,
      }))
    : cmsFaqs;

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = (() => {
    const built = buildLoanCategoryGuideCards({
      categorySlug: 'two-wheeler-loan',
      relatedGuideSlugs,
      articles,
      guides,
      limit: 6,
    });
    return built.length ? built : TW_DEFAULT_GUIDES.slice(0, 6);
  })();

  const calculatorLinks = TW_RELATED_CALCULATORS;

  const initialTenureYears =
    emiInitialTenure != null
      ? emiInitialTenureUnit === 'months'
        ? Math.max(1, Math.round(emiInitialTenure / 12))
        : emiInitialTenure
      : 3;

  const initialVehiclePrice =
    emiInitialAmount != null ? emiInitialAmount + TW_DEFAULT_DOWN_PAYMENT : undefined;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Two-Wheeler Loans', url: `${siteUrl}${pathname}` },
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
    <main className="tw-page w-full bg-[var(--tw-surface-1,#fff)]">
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

      <TwoWheelerDecisionProvider
        initialVehiclePrice={initialVehiclePrice}
        initialDownPayment={TW_DEFAULT_DOWN_PAYMENT}
        initialTenureYears={initialTenureYears}
        initialRate={emiInitialRate ?? TW_ILLUSTRATIVE_RATE}
      >
        {/* 1. Hero */}
        <div className="full-bleed bg-[var(--tw-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Two-Wheeler Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="two-wheeler-loan" categories={categories} />

            <div className="mt-3">
              <TwoWheelerLoanDecisionHero
                illustrationSrc={heroImageUrl}
                illustrationAlt={heroImageAlt}
              />
            </div>
          </div>
        </div>

        {/* 2. Snapshot */}
        <TwoWheelerLoanSnapshot />

        {/* 3. Down Payment */}
        <TwoWheelerLoanDownPayment />

        {/* 4. Offers */}
        <div id="tw-offers" className="full-bleed bg-[var(--tw-surface-2)]">
          <div className="site-container cl-section px-4">
            <LoanSectionHeader
              id="tw-offers-section-heading"
              eyebrow="Product comparison"
              title="Compare Two-Wheeler Loan Offers"
              description="Analytical comparison of listed two-wheeler loans. Select up to 4 to compare side by side."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--tw-radius-md)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="two-wheeler-loan"
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
                    lockCategorySlug="two-wheeler-loan"
                  />
                </Suspense>
                <TwoWheelerLoanOfferResults
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

        {/* 5. Tenure Simulator */}
        <TwTenureSimulator />

        {/* 6. Financing % */}
        <TwFinancingPercent />

        {/* 7. New vs Used */}
        <TwNewVsUsed />

        {/* 8. Affordability */}
        <TwAffordability />

        {/* 9. Interest Over Time */}
        <TwInterestOverTime />

        {/* 10. Dealer vs Lender */}
        <TwDealerVsLender />

        {/* 11. Eligibility */}
        <TwEligibility />

        {/* 12. Fees */}
        <TwFees />

        {/* 13. Prepayment */}
        <TwPrepayment />

        {/* 14. Hypothecation */}
        <TwHypothecation />

        {/* 15. Closure */}
        <TwClosure />

        {/* 16. Documents */}
        <TwDocuments />

        {/* 17. Application Journey */}
        <TwApplicationJourney />

        {/* 18. Related Calculators + Guides */}
        <section className="full-bleed bg-[var(--tw-surface-1)]">
          <div className="site-container space-y-12 cl-section px-4">
            <LoanGuidesSection
              guides={guideCards}
              title="Two-Wheeler Loan Guides"
              description="Focused explainers on two-wheeler loan eligibility, EMI and repayment."
              actionLabel="View all loan guides →"
            />
            <TwoWheelerLoanRelatedCalculators links={calculatorLinks} />
          </div>
        </section>

        {/* 19. FAQs */}
        <section className="full-bleed bg-[var(--tw-surface-2)]">
          <div className="site-container cl-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Two-Wheeler Loan FAQs →"
              title="Two-Wheeler Loan FAQs"
            />
          </div>
        </section>

        {/* 20. Disclaimer */}
        <div className="full-bleed bg-[var(--tw-surface-3)]">
          <div className="site-container px-4 py-6">
            <LoanDisclaimer />
          </div>
        </div>
      </TwoWheelerDecisionProvider>
    </main>
  );
}
