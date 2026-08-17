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
import { HomeLoanDecisionProvider } from '@/components/loans/home-loan-decision-context';
import { HomeLoanDecisionHero } from '@/components/loans/home-loan-decision-hero';
import { HomeLoanSnapshot } from '@/components/loans/home-loan-snapshot';
import { HomeLoanDownPayment } from '@/components/loans/home-loan-down-payment';
import { HomeLoanAffordability } from '@/components/loans/home-loan-affordability';
import { HomeLoanOfferResults } from '@/components/loans/home-loan-offer-results';
import { HomeLoanTenureSimulator } from '@/components/loans/home-loan-tenure-simulator';
import {
  HomeLoanApplicationJourney,
  HomeLoanBalanceTransfer,
  HomeLoanDocuments,
  HomeLoanEligibilityProfile,
  HomeLoanFeesAndCharges,
  HomeLoanFixedVsFloating,
  HomeLoanInterestOverTime,
  HomeLoanLtvSection,
  HomeLoanPrepaymentImpact,
} from '@/components/loans/home-loan-decision-sections';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
import { HomeLoanRelatedCalculators } from '@/components/loans/home-loan-related-calculators';
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
  HOME_LOAN_DEFAULT_DOWN_PAYMENT,
  HOME_LOAN_DEFAULT_FAQS,
  HOME_LOAN_DECISION_HERO_ASSET,
  HOME_LOAN_ILLUSTRATIVE_RATE,
  HOME_LOAN_INTRO,
  HOME_LOAN_RELATED_CALCULATORS,
} from '@/lib/home-loan-page';

export type HomeLoanPageProps = {
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

function resolveHomeLoanHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  if (cms && cms.includes('home-loan-decision')) return cms;
  return HOME_LOAN_DECISION_HERO_ASSET;
}

function shouldUseDefaultHomeLoanFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

/**
 * Home Loan planning page — property / LTV / long-tenure journey (distinct from Personal Loan).
 */
export function HomeLoanPage({
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
}: HomeLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('home-loan');
  const cmsSections = parseContentSections(category.contentSections);

  const h1 = 'Plan and Compare Home Loans';
  const intro = category.introduction?.trim() || HOME_LOAN_INTRO;
  const heroImageUrl = resolveHomeLoanHeroImage(category);
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    category.featuredImageAlt?.trim() ||
    'Home loan planning illustration showing property value, down payment and EMI';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'home-loan', category.id, 8);
  const categoryFaqs: HubFaqItem[] = shouldUseDefaultHomeLoanFaqs(cmsFaqs)
    ? HOME_LOAN_DEFAULT_FAQS.map((f, index) => ({
        id: `hl-faq-${index}`,
        question: f.question,
        answer: f.answer,
      }))
    : cmsFaqs;

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = buildLoanCategoryGuideCards({
    categorySlug: 'home-loan',
    relatedGuideSlugs,
    articles,
    guides,
    limit: 4,
  });

  const relatedCalculators =
    Array.isArray(cmsSections?.relatedCalculatorSlugs) && cmsSections.relatedCalculatorSlugs.length
      ? (() => {
          const filtered = HOME_LOAN_RELATED_CALCULATORS.filter((link) =>
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
          return filtered.length >= 2 ? filtered : HOME_LOAN_RELATED_CALCULATORS;
        })()
      : HOME_LOAN_RELATED_CALCULATORS;
  const calculatorLinks = relatedCalculators.length
    ? relatedCalculators
    : HOME_LOAN_RELATED_CALCULATORS;

  const initialTenureYears =
    emiInitialTenure != null
      ? emiInitialTenureUnit === 'months'
        ? Math.max(1, Math.round(emiInitialTenure / 12))
        : emiInitialTenure
      : 20;

  const initialPropertyValue =
    emiInitialAmount != null ? emiInitialAmount + HOME_LOAN_DEFAULT_DOWN_PAYMENT : undefined;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Home Loans', url: `${siteUrl}${pathname}` },
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
    <main className="hl-page w-full bg-[var(--hl-surface-1,#fff)]">
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

      <HomeLoanDecisionProvider
        initialPropertyValue={initialPropertyValue}
        initialDownPayment={HOME_LOAN_DEFAULT_DOWN_PAYMENT}
        initialTenureYears={initialTenureYears}
        initialRate={emiInitialRate ?? HOME_LOAN_ILLUSTRATIVE_RATE}
      >
        {/* 1. Hero (white) */}
        <div className="full-bleed bg-[var(--hl-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Home Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="home-loan" categories={categories} />

            <div className="mt-3">
              <HomeLoanDecisionHero illustrationSrc={heroImageUrl} illustrationAlt={heroImageAlt} />
            </div>
          </div>
        </div>

        {/* 2. Snapshot (cream) */}
        <HomeLoanSnapshot />

        {/* 3. Down Payment (white) */}
        <HomeLoanDownPayment />

        {/* 4. Compare Offers (blue-gray) */}
        <div id="home-loan-offers" className="full-bleed bg-[var(--hl-surface-2,#f4f6f9)]">
          <div className="site-container hl-section px-4">
            <LoanSectionHeader
              id="home-loan-offers-section-heading"
              eyebrow="Product comparison"
              title="Compare Home Loan Offers"
              description="Analytical comparison of listed home loans. Select up to 4 to compare side by side."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--hl-radius-lg)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="home-loan"
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
                    lockCategorySlug="home-loan"
                  />
                </Suspense>
                <HomeLoanOfferResults
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
        <HomeLoanTenureSimulator />

        {/* 6. LTV (navy-tint) */}
        <HomeLoanLtvSection />

        {/* 7. Fixed vs Floating (white) */}
        <HomeLoanFixedVsFloating />

        {/* 8. Interest over time (blue-gray) */}
        <HomeLoanInterestOverTime />

        {/* 9. Affordability (cream) */}
        <HomeLoanAffordability />

        {/* 10. Prepayment (white) */}
        <HomeLoanPrepaymentImpact />

        {/* 11. Balance Transfer (blue-gray) */}
        <HomeLoanBalanceTransfer />

        {/* 12. Eligibility (white) */}
        <HomeLoanEligibilityProfile />

        {/* 13. Fees (cream) */}
        <HomeLoanFeesAndCharges loans={loans} />

        {/* 14. Documents (light gray) */}
        <HomeLoanDocuments />

        {/* 15. Application journey (navy-tint) */}
        <HomeLoanApplicationJourney />

        {/* 16. Disclaimer */}
        <div className="full-bleed bg-[var(--hl-surface-3)]">
          <div className="site-container px-4 py-6">
            <LoanDisclaimer />
          </div>
        </div>

        {/* 17. Guides + 18. Related calculators (white) */}
        <section className="full-bleed bg-[var(--hl-surface-1)]">
          <div className="site-container space-y-12 hl-section px-4">
            {guideCards.length ? (
              <LoanGuidesSection
                guides={guideCards}
                title="Home Loan Guides"
                description="Focused explainers on choosing a home loan, eligibility, EMI and repayment."
                actionLabel="View all loan guides →"
              />
            ) : null}

            <HomeLoanRelatedCalculators links={calculatorLinks} />
          </div>
        </section>

        {/* 19. FAQs (surface-2) */}
        <section className="full-bleed bg-[var(--hl-surface-2,#f4f6f9)]">
          <div className="site-container hl-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Home Loan FAQs →"
              title="Home Loan FAQs"
            />
          </div>
        </section>
      </HomeLoanDecisionProvider>
    </main>
  );
}
