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
import { PersonalLoanDecisionProvider } from '@/components/loans/personal-loan-decision-context';
import { PersonalLoanDecisionHero } from '@/components/loans/personal-loan-decision-hero';
import { PersonalLoanSnapshot } from '@/components/loans/personal-loan-snapshot';
import { PersonalLoanOfferResults } from '@/components/loans/personal-loan-offer-results';
import { PersonalLoanTenureSimulator } from '@/components/loans/personal-loan-tenure-simulator';
import {
  PersonalLoanApplicationJourney,
  PersonalLoanBorrowingOptions,
  PersonalLoanEligibilityProfile,
  PersonalLoanPrepaymentImpact,
  PersonalLoanShouldYouConsider,
  PersonalLoanTrueCost,
} from '@/components/loans/personal-loan-decision-sections';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
import { PersonalLoanRelatedCalculators } from '@/components/loans/personal-loan-related-calculators';
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
  PERSONAL_LOAN_DEFAULT_FAQS,
  PERSONAL_LOAN_DECISION_HERO_ASSET,
  PERSONAL_LOAN_INTRO,
  PERSONAL_LOAN_RELATED_CALCULATORS,
} from '@/lib/personal-loan-page';

export type PersonalLoanPageProps = {
  category: FinanceCategory;
  categories: FinanceCategory[];
  banks: FinanceBank[];
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  filterState: LoanFilterState;
  sort: string;
  cursorMeta?: CursorMeta | null;
  nextPageHref?: string | null;
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

function resolvePersonalLoanHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  // Prefer the Personal Loan decision illustration over generic CMS/category art.
  if (cms && cms.includes('personal-loan-decision')) return cms;
  return PERSONAL_LOAN_DECISION_HERO_ASSET;
}

/**
 * Personal Loan decision tool — distinct IA from the Loans hub discovery page.
 */
export function PersonalLoanPage({
  category,
  categories,
  banks,
  loans,
  featuredLoans,
  filterState,
  sort,
  cursorMeta,
  nextPageHref,
  faqs,
  guides,
  articles,
  emiInitialAmount,
  emiInitialRate,
  emiInitialTenure,
  emiInitialTenureUnit,
}: PersonalLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('personal-loan');
  const cmsSections = parseContentSections(category.contentSections);

  const h1 = 'Compare Personal Loans';
  const intro = category.introduction?.trim() || PERSONAL_LOAN_INTRO;
  const heroImageUrl = resolvePersonalLoanHeroImage(category);
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    category.featuredImageAlt?.trim() ||
    'Personal loan planning illustration showing loan amount, EMI and repayment timeline';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'personal-loan', category.id, 8);
  const categoryFaqs: HubFaqItem[] =
    cmsFaqs.length && !cmsFaqs[0]?.id.startsWith('default-')
      ? cmsFaqs
      : PERSONAL_LOAN_DEFAULT_FAQS.map((f, index) => ({
          id: `pl-faq-${index}`,
          question: f.question,
          answer: f.answer,
        }));

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = buildLoanCategoryGuideCards({
    categorySlug: 'personal-loan',
    relatedGuideSlugs,
    articles,
    guides,
    limit: 4,
  });

  const relatedCalculators =
    Array.isArray(cmsSections?.relatedCalculatorSlugs) && cmsSections.relatedCalculatorSlugs.length
      ? PERSONAL_LOAN_RELATED_CALCULATORS.filter((link) =>
          cmsSections.relatedCalculatorSlugs!.some(
            (slug) => typeof slug === 'string' && link.href.includes(`/calculators/${slug}`),
          ),
        )
      : PERSONAL_LOAN_RELATED_CALCULATORS;
  const calculatorLinks = relatedCalculators.length
    ? relatedCalculators
    : PERSONAL_LOAN_RELATED_CALCULATORS;

  const initialTenureYears =
    emiInitialTenure != null
      ? emiInitialTenureUnit === 'months'
        ? Math.max(1, Math.round(emiInitialTenure / 12))
        : emiInitialTenure
      : 5;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Personal Loans', url: `${siteUrl}${pathname}` },
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
    <main className="pl-page w-full bg-[var(--pl-surface-1,#fff)]">
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

      <PersonalLoanDecisionProvider
        initialAmount={emiInitialAmount ?? 5_00_000}
        initialTenureYears={initialTenureYears}
        initialRate={emiInitialRate ?? 11}
      >
        {/* 1. Hero (white) + 2. Snapshot (warm, nested) */}
        <div className="full-bleed bg-[var(--pl-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Personal Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="personal-loan" categories={categories} />

            <div className="mt-3">
              <PersonalLoanDecisionHero
                illustrationSrc={heroImageUrl}
                illustrationAlt={heroImageAlt}
              />
            </div>

            <PersonalLoanSnapshot />
          </div>
        </div>

        {/* 3. Compare Offers — cool gray */}
        <div id="personal-loan-offers" className="full-bleed bg-[var(--pl-surface-2,#f4f6f9)]">
          <div className="site-container pl-section px-4">
            <LoanSectionHeader
              id="personal-loan-offers-section-heading"
              eyebrow="Product comparison"
              title="Compare Personal Loan Offers"
              description="Analytical comparison of listed personal loans. Select up to 4 to compare side by side."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--pl-radius-lg)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="personal-loan"
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
                    lockCategorySlug="personal-loan"
                  />
                </Suspense>
                <PersonalLoanOfferResults
                  loans={loans}
                  featuredLoans={featuredLoans}
                  currentSort={sort}
                  pathname={pathname}
                  cursorMeta={cursorMeta}
                  nextPageHref={nextPageHref}
                />
              </div>
            </div>
          </div>
        </div>

        <PersonalLoanTenureSimulator />
        <PersonalLoanEligibilityProfile />
        <PersonalLoanTrueCost loans={loans} />
        <PersonalLoanPrepaymentImpact />
        <PersonalLoanShouldYouConsider />
        <PersonalLoanBorrowingOptions />
        <PersonalLoanApplicationJourney />

        <div className="full-bleed bg-[var(--pl-surface-1)]">
          <div className="site-container px-4 py-6">
            <LoanDisclaimer />
          </div>
        </div>

        <section className="full-bleed bg-[var(--pl-surface-1)]">
          <div className="site-container space-y-12 pl-section px-4">
            {guideCards.length ? (
              <LoanGuidesSection
                guides={guideCards}
                title="Personal Loan Guides"
                description="Focused explainers on choosing a personal loan, eligibility, EMI and repayment."
                actionLabel="View all loan guides →"
              />
            ) : null}

            <PersonalLoanRelatedCalculators links={calculatorLinks} />
          </div>
        </section>

        <section className="full-bleed bg-[var(--pl-surface-2,#f4f6f9)]">
          <div className="site-container pl-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Personal Loan FAQs →"
              title="Personal Loan FAQs"
            />
          </div>
        </section>
      </PersonalLoanDecisionProvider>
    </main>
  );
}
