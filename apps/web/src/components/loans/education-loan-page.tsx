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
import { EducationLoanDecisionProvider } from '@/components/loans/education-loan-decision-context';
import { EducationLoanDecisionHero } from '@/components/loans/education-loan-decision-hero';
import { EducationLoanSnapshot } from '@/components/loans/education-loan-snapshot';
import {
  EducationLoanCostBreakdown,
  EducationLoanFundingGap,
  EducationLoanIndiaAbroad,
  EducationLoanPayVsCapitalize,
  EducationLoanStudyInterest,
} from '@/components/loans/education-loan-decision-sections';
import {
  EducationLoanApplicationJourney,
  EducationLoanCoapplicant,
  EducationLoanCollateral,
  EducationLoanDisbursement,
  EducationLoanDocuments,
  EducationLoanEligibility,
  EducationLoanEmiAfterStudy,
  EducationLoanGovernmentSupport,
  EducationLoanMoratorium,
  EducationLoanOtherSupport,
  EducationLoanPmUspCsis,
  EducationLoanPmVidyalaxmi,
  EducationLoanPrepayment,
  EducationLoanSecuredUnsecured,
} from '@/components/loans/education-loan-gov-sections';
import { EducationLoanOfferResults } from '@/components/loans/education-loan-offer-results';
import { EducationLoanRelatedCalculators } from '@/components/loans/education-loan-related-calculators';
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
  EDUCATION_LOAN_DEFAULT_FAQS,
  EDUCATION_LOAN_DEFAULT_GUIDES,
  EDUCATION_LOAN_DECISION_HERO_ASSET,
  EDUCATION_LOAN_ILLUSTRATIVE_RATE,
  EDUCATION_LOAN_INTRO,
  EDUCATION_LOAN_RELATED_CALCULATORS,
  EDUCATION_LOAN_RELATED_SECONDARY,
} from '@/lib/education-loan-page';
import { resolveEducationGovernmentSchemes } from '@/lib/education-loan-schemes';

export type EducationLoanPageProps = {
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

function resolveEducationLoanHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  if (cms && cms.includes('education-loan-decision')) return cms;
  return EDUCATION_LOAN_DECISION_HERO_ASSET;
}

function shouldUseDefaultEducationLoanFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

export function EducationLoanPage({
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
}: EducationLoanPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('education-loan');
  const cmsSections = parseContentSections(category.contentSections);
  const h1 = 'Plan and Compare Education Loans';
  const intro = category.introduction?.trim() || EDUCATION_LOAN_INTRO;
  const heroImageUrl = resolveEducationLoanHeroImage(category);
  const heroImageAlt = category.heroImageAlt?.trim() || 'Education financing planner illustration';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'education-loan');
  const categoryFaqs: HubFaqItem[] = (() => {
    const all = shouldUseDefaultEducationLoanFaqs(cmsFaqs)
      ? EDUCATION_LOAN_DEFAULT_FAQS.map((f, index) => ({
          id: `el-faq-${index}`,
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
      categorySlug: 'education-loan',
      relatedGuideSlugs,
      articles,
      guides,
      limit: 6,
    });
    return built.length ? built : EDUCATION_LOAN_DEFAULT_GUIDES.slice(0, 6);
  })();

  const governmentSchemes = resolveEducationGovernmentSchemes(
    (cmsSections as Record<string, unknown> | null)?.governmentSchemes,
  );

  const calculatorLinks = EDUCATION_LOAN_RELATED_CALCULATORS;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Education Loans', url: `${siteUrl}${pathname}` },
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
    <main className="el-page w-full bg-[var(--el-surface-1,#fff)]">
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

      <EducationLoanDecisionProvider
        initialRate={emiInitialRate ?? EDUCATION_LOAN_ILLUSTRATIVE_RATE}
      >
        <div className="full-bleed bg-[var(--el-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Education Loans' },
              ]}
            />
            <LoanTypeNav currentSlug="education-loan" categories={categories} />
            <div className="mt-3">
              <EducationLoanDecisionHero
                illustrationSrc={heroImageUrl}
                illustrationAlt={heroImageAlt}
              />
            </div>
          </div>
        </div>

        <EducationLoanSnapshot />
        <EducationLoanCostBreakdown />
        <EducationLoanIndiaAbroad />
        <EducationLoanFundingGap />

        <div id="el-offers" className="full-bleed bg-[var(--el-surface-4)]">
          <div className="site-container el-section px-4">
            <LoanSectionHeader
              id="el-offers-section-heading"
              eyebrow="Product comparison"
              title="Compare Education Loan Offers"
              description="Only verified Education Loan fields are shown. Missing secured/unsecured or moratorium data is labeled — never invented."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--el-radius-lg)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="education-loan"
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
                <EducationLoanOfferResults
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

        <EducationLoanStudyInterest />
        <EducationLoanMoratorium />
        <EducationLoanPayVsCapitalize />
        <EducationLoanSecuredUnsecured />
        <EducationLoanCollateral />
        <EducationLoanEligibility />
        <EducationLoanCoapplicant />
        <EducationLoanGovernmentSupport schemes={governmentSchemes} />
        <EducationLoanPmVidyalaxmi schemes={governmentSchemes} />
        <EducationLoanPmUspCsis schemes={governmentSchemes} />
        <EducationLoanOtherSupport />
        <EducationLoanEmiAfterStudy />
        <EducationLoanPrepayment />
        <EducationLoanDocuments />
        <EducationLoanDisbursement />
        <EducationLoanApplicationJourney />

        {guideCards.length ? (
          <div className="full-bleed bg-[var(--el-surface-1)]">
            <div className="site-container el-section px-4">
              <LoanGuidesSection
                guides={guideCards}
                title="Education Loan Guides"
                description="Practical explainers on funding gaps, moratorium, co-applicants and government support."
                actionLabel="View All Guides →"
              />
            </div>
          </div>
        ) : null}

        <EducationLoanRelatedCalculators
          primary={calculatorLinks}
          secondary={EDUCATION_LOAN_RELATED_SECONDARY}
        />

        <div className="full-bleed bg-[var(--el-surface-2)]">
          <div className="site-container el-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Education Loan FAQs →"
              title="Education Loan FAQs"
            />
          </div>
        </div>

        <div className="site-container px-4 py-8">
          <LoanDisclaimer />
        </div>
      </EducationLoanDecisionProvider>
    </main>
  );
}
