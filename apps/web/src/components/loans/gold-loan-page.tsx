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
import { GoldLoanDecisionProvider } from '@/components/loans/gold-loan-decision-context';
import { GoldLoanDecisionHero } from '@/components/loans/gold-loan-decision-hero';
import { GoldLoanSnapshot } from '@/components/loans/gold-loan-snapshot';
import {
  GoldLoanValuation,
  GoldLoanPurityVisualizer,
  GoldLoanCapacity,
  GoldLoanRequired,
  GoldLoanRepaymentCalculator,
  GoldLoanRepaymentCompare,
  GoldLoanTotalCost,
  GoldLoanRiskExplorer,
  GoldLoanPledgeLifecycle,
  GoldLoanMissedPayments,
  GoldLoanAuctionAwareness,
  GoldLoanRelease,
  GoldLoanEligibility,
  GoldLoanDocuments,
  GoldLoanVsPersonal,
  GoldLoanApplicationJourney,
} from '@/components/loans/gold-loan-decision-sections';
import { GoldLoanRegulatory } from '@/components/loans/gold-loan-gov-sections';
import { GoldLoanOfferResults } from '@/components/loans/gold-loan-offer-results';
import { GoldLoanRelatedCalculators } from '@/components/loans/gold-loan-related-calculators';
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
  GOLD_LOAN_DEFAULT_FAQS,
  GOLD_LOAN_DEFAULT_GUIDES,
  GOLD_LOAN_DECISION_HERO_ASSET,
  GOLD_LOAN_ILLUSTRATIVE_RATE,
  GOLD_LOAN_INTRO,
  GOLD_LOAN_RELATED_CALCULATORS,
  GOLD_LOAN_RELATED_SECONDARY,
} from '@/lib/gold-loan-page';
import { resolveGoldGovernmentSchemes } from '@/lib/gold-loan-schemes';
import { isVarnarcHubAsset } from '@/lib/loan-visual-assets';

export type GoldLoanPageProps = {
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

function resolveGoldLoanHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  // Prefer CMS hub assets when set; otherwise use the first-party Gold Loan decision hero.
  if (cms && isVarnarcHubAsset(cms) && cms.includes('/hub/finance/')) {
    return cms;
  }
  return GOLD_LOAN_DECISION_HERO_ASSET;
}

function shouldUseDefaultGoldLoanFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

export function GoldLoanPage({
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
}: GoldLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('gold-loan');
  const cmsSections = parseContentSections(category.contentSections);
  const h1 = 'Plan & Compare Gold Loans';
  const intro = category.introduction?.trim() || GOLD_LOAN_INTRO;
  const heroImageUrl = resolveGoldLoanHeroImage(category);
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    'Gold loan valuation and secured borrowing planner illustration';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'gold-loan');
  const categoryFaqs: HubFaqItem[] = (() => {
    const all = shouldUseDefaultGoldLoanFaqs(cmsFaqs)
      ? GOLD_LOAN_DEFAULT_FAQS.map((f, index) => ({
          id: `gl-faq-${index}`,
          question: f.question,
          answer: f.answer,
        }))
      : cmsFaqs;
    return all.slice(0, 14);
  })();

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = (() => {
    const built = buildLoanCategoryGuideCards({
      categorySlug: 'gold-loan',
      relatedGuideSlugs,
      articles,
      guides,
      limit: 8,
    });
    return built.length ? built : GOLD_LOAN_DEFAULT_GUIDES.slice(0, 8);
  })();

  const governmentSchemes = resolveGoldGovernmentSchemes(
    (cmsSections as Record<string, unknown> | null)?.governmentSchemes,
  );

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Gold Loans', url: `${siteUrl}${pathname}` },
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
    <main className="gl-page w-full bg-[var(--gl-surface-1,#fff)]">
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

      <GoldLoanDecisionProvider initialRate={emiInitialRate ?? GOLD_LOAN_ILLUSTRATIVE_RATE}>
        <div className="full-bleed bg-[var(--gl-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Gold Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="gold-loan" categories={categories} />
            <div className="mt-3">
              <GoldLoanDecisionHero illustrationSrc={heroImageUrl} illustrationAlt={heroImageAlt} />
            </div>
          </div>
        </div>

        <GoldLoanSnapshot />

        <div id="gl-offers" className="full-bleed bg-[var(--gl-surface-4)]">
          <div className="site-container gl-section px-4">
            <LoanSectionHeader
              id="gl-offers-section-heading"
              eyebrow="Product comparison"
              title="Gold Loan Offers"
              description="Only verified Gold Loan product fields are shown. Missing rates, fees or repayment types are labeled — never invented."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--gl-radius-lg)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="gold-loan"
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
                <GoldLoanOfferResults
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

        <GoldLoanValuation />
        <GoldLoanPurityVisualizer />
        <GoldLoanCapacity />
        <GoldLoanRequired />
        <GoldLoanRepaymentCalculator />
        <GoldLoanRepaymentCompare />
        <GoldLoanTotalCost />
        <GoldLoanRiskExplorer />
        <GoldLoanPledgeLifecycle />
        <GoldLoanMissedPayments />
        <GoldLoanAuctionAwareness />
        <GoldLoanRelease />
        <GoldLoanEligibility />
        <GoldLoanDocuments />
        <GoldLoanVsPersonal />
        <GoldLoanApplicationJourney />
        <GoldLoanRegulatory schemes={governmentSchemes} />

        <GoldLoanRelatedCalculators
          primary={GOLD_LOAN_RELATED_CALCULATORS}
          secondary={GOLD_LOAN_RELATED_SECONDARY}
        />

        {guideCards.length ? (
          <div className="full-bleed bg-[var(--gl-surface-1)]">
            <div className="site-container gl-section px-4">
              <LoanGuidesSection
                guides={guideCards}
                title="Gold Loan Guides"
                description="Practical explainers on valuation, purity, LTV, repayment, auction awareness and gold release."
                actionLabel="View All Guides →"
              />
            </div>
          </div>
        ) : null}

        <div className="full-bleed bg-[var(--gl-surface-2)]">
          <div className="site-container gl-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Gold Loan FAQs →"
              title="Gold Loan FAQs"
            />
          </div>
        </div>

        <div className="site-container px-4 py-8">
          <LoanDisclaimer />
        </div>
      </GoldLoanDecisionProvider>
    </main>
  );
}
