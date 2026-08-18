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
import { LapDecisionProvider } from '@/components/loans/loan-against-property-decision-context';
import { LoanAgainstPropertyDecisionHero } from '@/components/loans/loan-against-property-decision-hero';
import { LoanAgainstPropertySnapshot } from '@/components/loans/loan-against-property-snapshot';
import {
  LapCapacity,
  LapLtv,
  LapPropertyType,
  LapOwnership,
  LapFoir,
  LapTenureSimulator,
  LapTotalCost,
  LapPrepayment,
  LapFixedFloating,
  LapValuation,
  LapLegalTechnical,
  LapEligibility,
  LapCoOwner,
  LapNonPayment,
  LapCompareLoans,
  LapDocuments,
  LapApplicationJourney,
} from '@/components/loans/loan-against-property-decision-sections';
import { LapRegulatory } from '@/components/loans/loan-against-property-gov-sections';
import { LoanAgainstPropertyOfferResults } from '@/components/loans/loan-against-property-offer-results';
import { LoanAgainstPropertyRelatedCalculators } from '@/components/loans/loan-against-property-related-calculators';
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
  LAP_DEFAULT_FAQS,
  LAP_DEFAULT_GUIDES,
  LAP_DECISION_HERO_ASSET,
  LAP_ILLUSTRATIVE_RATE,
  LAP_INTRO,
  LAP_RELATED_CALCULATORS,
  LAP_RELATED_SECONDARY,
} from '@/lib/loan-against-property-page';
import { resolveLapGovernmentSchemes } from '@/lib/loan-against-property-schemes';
import { isVarnarcHubAsset } from '@/lib/loan-visual-assets';

export type LoanAgainstPropertyPageProps = {
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

function resolveLapHeroImage(category: FinanceCategory): string {
  const cms = category.heroImage?.trim() || category.featuredImage?.trim();
  if (cms && isVarnarcHubAsset(cms) && cms.includes('/hub/finance/')) {
    return cms;
  }
  return LAP_DECISION_HERO_ASSET;
}

function shouldUseDefaultLapFaqs(cmsFaqs: HubFaqItem[]): boolean {
  if (cmsFaqs.length < 4) return true;
  if (cmsFaqs.some((f) => f.id.startsWith('default-'))) return true;
  return false;
}

export function LoanAgainstPropertyPage({
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
}: LoanAgainstPropertyPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath('loan-against-property');
  const cmsSections = parseContentSections(category.contentSections);
  const h1 = 'Plan and Compare Loans Against Property';
  const intro = category.introduction?.trim() || LAP_INTRO;
  const heroImageUrl = resolveLapHeroImage(category);
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    'Loan against property capacity and secured borrowing planner illustration';

  const cmsFaqs = pickLoanCategoryFaqs(faqs, 'loan-against-property');
  const categoryFaqs: HubFaqItem[] = (() => {
    const all = shouldUseDefaultLapFaqs(cmsFaqs)
      ? LAP_DEFAULT_FAQS.map((f, index) => ({
          id: `lap-faq-${index}`,
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
      categorySlug: 'loan-against-property',
      relatedGuideSlugs,
      articles,
      guides,
      limit: 8,
    });
    return built.length ? built : LAP_DEFAULT_GUIDES.slice(0, 8);
  })();

  const governmentSchemes = resolveLapGovernmentSchemes(
    (cmsSections as Record<string, unknown> | null)?.governmentSchemes,
  );

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: 'Loan Against Property', url: `${siteUrl}${pathname}` },
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
    <main className="lap-page w-full bg-[var(--lap-surface-1,#fff)]">
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

      <LapDecisionProvider initialRate={emiInitialRate ?? LAP_ILLUSTRATIVE_RATE}>
        <div className="full-bleed bg-[var(--lap-surface-1)]">
          <div className="site-container px-4 pt-6 pb-8 sm:pt-8 sm:pb-10">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Finance', href: '/finance' },
                { label: 'Loans', href: '/finance/loans' },
                { label: 'Loan Against Property' },
              ]}
            />
            <LoanTypeNav currentSlug="loan-against-property" categories={categories} />
            <div className="mt-3">
              <LoanAgainstPropertyDecisionHero
                illustrationSrc={heroImageUrl}
                illustrationAlt={heroImageAlt}
              />
            </div>
          </div>
        </div>

        <LoanAgainstPropertySnapshot />

        <LapCapacity />

        <div id="lap-offers" className="full-bleed bg-[var(--lap-surface-4)]">
          <div className="site-container lap-section px-4">
            <LoanSectionHeader
              id="lap-offers-section-heading"
              eyebrow="Product comparison"
              title="Loan Against Property Offers"
              description="Only verified LAP product fields are shown. Missing rates, fees or LTV values are labeled — never invented."
            />
            <div className="mb-5">
              <AdBanner slot="content-top" />
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <Suspense
                fallback={
                  <div className="rounded-[var(--lap-radius-md)] bg-white/70 p-4 text-sm text-slate-500">
                    Loading filters…
                  </div>
                }
              >
                <LoanFilters
                  categories={categories}
                  banks={banks}
                  current={filterState}
                  hideLoanType
                  lockCategorySlug="loan-against-property"
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
                <LoanAgainstPropertyOfferResults
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

        <LapLtv />
        <LapPropertyType />
        <LapOwnership />
        <LapFoir />
        <LapTenureSimulator />
        <LapTotalCost />
        <LapPrepayment />
        <LapFixedFloating />
        <LapValuation />
        <LapLegalTechnical />
        <LapEligibility />
        <LapCoOwner />
        <LapNonPayment />
        <LapCompareLoans />
        <LapDocuments />
        <LapApplicationJourney />
        <LapRegulatory schemes={governmentSchemes} />

        <LoanAgainstPropertyRelatedCalculators
          primary={LAP_RELATED_CALCULATORS}
          secondary={LAP_RELATED_SECONDARY}
        />

        {guideCards.length ? (
          <div className="full-bleed bg-[var(--lap-surface-1)]">
            <div className="site-container lap-section px-4">
              <LoanGuidesSection
                guides={guideCards}
                title="Loan Against Property Guides"
                description="Practical explainers on LTV, valuation, eligibility, documents and comparing LAP with other loans."
                actionLabel="View All Guides →"
              />
            </div>
          </div>
        ) : null}

        <div className="full-bleed bg-[var(--lap-surface-2)]">
          <div className="site-container lap-section px-4">
            <HubFaqSection
              faqs={categoryFaqs}
              viewAllHref="/finance/faqs"
              viewAllLabel="View All Loan Against Property FAQs →"
              title="Loan Against Property FAQs"
            />
          </div>
        </div>

        <div className="site-container px-4 py-8">
          <LoanDisclaimer />
        </div>
      </LapDecisionProvider>
    </main>
  );
}
