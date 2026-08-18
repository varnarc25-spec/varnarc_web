import { LoanDisclaimer } from '@/components/loans/loan-disclaimer';
import { LoanTypeNav } from '@/components/loans/loan-type-nav';
import {
  LoanFilters,
  LoanActiveFilterChips,
  type LoanFilterState,
} from '@/components/loans/loan-filters';
import { AdBanner } from '@/components/business/ad-banner';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { Suspense } from 'react';
import { BusinessLoanDecisionProvider } from '@/components/loans/business-loan-decision-context';
import { BusinessLoanDecisionHero } from '@/components/loans/business-loan-decision-hero';
import { BusinessLoanSnapshot } from '@/components/loans/business-loan-snapshot';
import {
  BusinessLoanPurposeCards,
  BusinessLoanWcVsTerm,
  BusinessLoanCashFlow,
  BusinessLoanStressTest,
  BusinessLoanEmiCalculator,
  BusinessLoanTenureCompare,
  BusinessLoanLenderAssessment,
  BusinessLoanTurnover,
  BusinessLoanProfitability,
  BusinessLoanDscr,
  BusinessLoanBreakEven,
  BusinessLoanSecuredUnsecured,
  BusinessLoanEligibility,
  BusinessLoanVintage,
  BusinessLoanExistingDebt,
  BusinessLoanCreditProfile,
  BusinessLoanDocuments,
  BusinessLoanFinancialStatements,
  BusinessLoanFees,
  BusinessLoanTotalCost,
  BusinessLoanPrepayment,
  BusinessLoanApplicationJourney,
  BusinessLoanUseCaseCards,
} from '@/components/loans/business-loan-decision-sections';
import {
  BusinessLoanMsmeSupport,
  BusinessLoanGovernmentFinder,
  BusinessLoanUdyamPanel,
  BusinessLoanCgtmsePanel,
} from '@/components/loans/business-loan-gov-sections';
import { BusinessLoanOfferResults } from '@/components/loans/business-loan-offer-results';
import { BusinessLoanRelatedCalculators } from '@/components/loans/business-loan-related-calculators';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
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
  BUSINESS_LOAN_DEFAULT_FAQS,
  BUSINESS_LOAN_DEFAULT_GUIDES,
  BUSINESS_LOAN_DECISION_HERO_ASSET,
  BUSINESS_LOAN_ILLUSTRATIVE_RATE,
  BUSINESS_LOAN_INTRO,
  BUSINESS_LOAN_RELATED_CALCULATORS,
  BUSINESS_LOAN_RELATED_SECONDARY,
} from '@/lib/business-loan-page';
import { resolveBusinessGovernmentSchemes } from '@/lib/business-loan-schemes';

export type BusinessLoanPageProps = {
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

function resolveBusinessLoanHeroImage(category: FinanceCategory): string {
  // Prefer admin/CMS Category hero image (or card illustration fallback).
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  if (cms) return cms;
  return BUSINESS_LOAN_DECISION_HERO_ASSET;
}

function shouldUseDefaultBusinessLoanFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

export function BusinessLoanPage({
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
  emiInitialRate,
}: BusinessLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('business-loan');
  const cmsSections = parseContentSections(category.contentSections);
  const h1 = 'Plan and Compare Business Loans';
  const intro = category.introduction?.trim() || BUSINESS_LOAN_INTRO;
  const heroImageUrl = resolveBusinessLoanHeroImage(category);
  const heroImageAlt = category.heroImageAlt?.trim() || 'Business financing planner illustration';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'business-loan');
  const categoryFaqs: HubFaqItem[] = (() => {
    const all = shouldUseDefaultBusinessLoanFaqs(cmsFaqs)
      ? BUSINESS_LOAN_DEFAULT_FAQS.map((f, index) => ({
          id: `bl-faq-${index}`,
          question: f.question,
          answer: f.answer,
        }))
      : cmsFaqs;
    return all.slice(0, 8);
  })();

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = (() => {
    const built = buildLoanCategoryGuideCards({
      categorySlug: 'business-loan',
      relatedGuideSlugs,
      articles,
      guides,
      limit: 8,
    });
    return built.length ? built : BUSINESS_LOAN_DEFAULT_GUIDES.slice(0, 8);
  })();

  const governmentSchemes = resolveBusinessGovernmentSchemes(
    (cmsSections as Record<string, unknown> | null)?.governmentSchemes,
  );

  const calculatorLinks = BUSINESS_LOAN_RELATED_CALCULATORS;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Business Loans', url: `${siteUrl}${pathname}` },
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
    <main className="bl-page w-full bg-[var(--bl-surface-1,#fff)]">
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

      <BusinessLoanDecisionProvider initialRate={emiInitialRate ?? BUSINESS_LOAN_ILLUSTRATIVE_RATE}>
        <div className="full-bleed bg-[var(--bl-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Business Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="business-loan" categories={categories} />
            <div className="mt-3">
              <BusinessLoanDecisionHero
                illustrationSrc={heroImageUrl}
                illustrationAlt={heroImageAlt}
              />
            </div>
          </div>
        </div>

        <BusinessLoanSnapshot />
        <BusinessLoanPurposeCards />
        <BusinessLoanWcVsTerm />
        <BusinessLoanCashFlow />
        <BusinessLoanStressTest />
        <BusinessLoanEmiCalculator />
        <BusinessLoanTenureCompare />

        <div id="bl-offers" className="full-bleed bg-[var(--bl-surface-4)]">
          <div className="site-container bl-section px-4">
            <LoanSectionHeader
              id="bl-offers-section-heading"
              eyebrow="Product comparison"
              title="Compare Business Loan Offers"
              description="Only verified Business Loan fields are shown. Missing secured/unsecured or facility-type data is labeled — never invented."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--bl-radius-lg)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="business-loan"
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
                  />
                </Suspense>
                <BusinessLoanOfferResults
                  loans={loans}
                  featuredLoans={featuredLoans}
                  filterState={filterState}
                  sort={sort}
                  cursorMeta={cursorMeta}
                  nextPageHref={nextPageHref}
                  loansFetchFailed={loansFetchFailed}
                  pathname={pathname}
                />
              </div>
            </div>
          </div>
        </div>

        <BusinessLoanLenderAssessment />
        <BusinessLoanTurnover />
        <BusinessLoanProfitability />
        <BusinessLoanDscr />
        <BusinessLoanBreakEven />
        <BusinessLoanSecuredUnsecured />
        <BusinessLoanEligibility />
        <BusinessLoanVintage />
        <BusinessLoanExistingDebt />
        <BusinessLoanCreditProfile />
        <BusinessLoanMsmeSupport />
        <BusinessLoanGovernmentFinder schemes={governmentSchemes} />
        <BusinessLoanUdyamPanel schemes={governmentSchemes} />
        <BusinessLoanCgtmsePanel schemes={governmentSchemes} />
        <BusinessLoanDocuments />
        <BusinessLoanFinancialStatements />
        <BusinessLoanFees />
        <BusinessLoanTotalCost />
        <BusinessLoanPrepayment />
        <BusinessLoanApplicationJourney />
        <BusinessLoanUseCaseCards />

        {guideCards.length ? (
          <div className="full-bleed bg-[var(--bl-surface-1)]">
            <div className="site-container bl-section px-4">
              <LoanGuidesSection
                guides={guideCards}
                title="Business Loan Guides"
                description="Practical explainers on working capital, DSCR, cash flow and MSME support."
                actionLabel="View All Guides →"
              />
            </div>
          </div>
        ) : null}

        <BusinessLoanRelatedCalculators
          primary={calculatorLinks}
          secondary={BUSINESS_LOAN_RELATED_SECONDARY}
        />

        <div className="full-bleed bg-[var(--bl-surface-2)]">
          <div className="site-container bl-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Business Loan FAQs →"
              title="Business Loan FAQs"
            />
          </div>
        </div>

        <div className="site-container px-4 py-8">
          <LoanDisclaimer />
        </div>
      </BusinessLoanDecisionProvider>
    </main>
  );
}
