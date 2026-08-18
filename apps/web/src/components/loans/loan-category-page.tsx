import Link from 'next/link';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { AdBanner } from '@/components/business/ad-banner';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { LoanDisclaimer } from '@/components/loans/loan-disclaimer';
import { LoanTypeNav } from '@/components/loans/loan-type-nav';
import { LoanHubHero } from '@/components/loans/loan-hub-hero';
import {
  LoanFilters,
  LoanActiveFilterChips,
  type LoanFilterState,
} from '@/components/loans/loan-filters';
import { LoanProductResults } from '@/components/loans/loan-product-results';
import { LoanEmiCalculator } from '@/components/loans/loan-emi-calculator';
import { LoanGuidesSection } from '@/components/loans/loan-guides-section';
import {
  LoanCategoryEducation,
  LoanCategoryRelatedCalculators,
  LoanCategoryStatsBar,
} from '@/components/loans/loan-category-sections';
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
import type { LoanCategorySlug } from '@/lib/loan-hub-categories';
import { loanCategoryCanonicalPath } from '@/lib/loan-path';
import {
  resolveCategoryEducationSections,
  resolveCategoryH1,
  resolveCategoryIntro,
  resolveCategoryBreadcrumbLabel,
  resolveCategoryRelatedCalculators,
  type CategoryContentSections,
} from '@/lib/loan-category-page';
import { computeLoanCategoryStats } from '@/lib/loan-category-stats';
import { pickLoanCategoryFaqs } from '@/lib/loan-category-faqs';
import { buildLoanCategoryGuideCards } from '@/lib/loan-guides';
import { resolveLoanCategoryHeroImage } from '@/lib/loan-visual-assets';
import { LOAN_CATEGORY_HERO_BENEFITS } from '@/components/loans/loan-hub-hero';
import { HomeLoanPage } from '@/components/loans/home-loan-page';
import { CarLoanPage } from '@/components/loans/car-loan-page';
import { PersonalLoanPage } from '@/components/loans/personal-loan-page';
import { EducationLoanPage } from '@/components/loans/education-loan-page';
import { BusinessLoanPage } from '@/components/loans/business-loan-page';
import { GoldLoanPage } from '@/components/loans/gold-loan-page';
import { LoanAgainstPropertyPage } from '@/components/loans/loan-against-property-page';

export type LoanCategoryPageProps = {
  slug: LoanCategorySlug;
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

/**
 * Dedicated loan category landing page.
 * Personal Loan and Home Loan use deeper decision layouts; other categories keep this template.
 */
export function LoanCategoryPage(props: LoanCategoryPageProps) {
  if (props.slug === 'home-loan') {
    return (
      <HomeLoanPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        loansFetchFailed={props.loansFetchFailed}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  if (props.slug === 'car-loan') {
    return (
      <CarLoanPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        loansFetchFailed={props.loansFetchFailed}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  if (props.slug === 'education-loan') {
    return (
      <EducationLoanPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        loansFetchFailed={props.loansFetchFailed}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  if (props.slug === 'business-loan') {
    return (
      <BusinessLoanPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        loansFetchFailed={props.loansFetchFailed}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  if (props.slug === 'gold-loan') {
    return (
      <GoldLoanPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        loansFetchFailed={props.loansFetchFailed}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  if (props.slug === 'loan-against-property') {
    return (
      <LoanAgainstPropertyPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        loansFetchFailed={props.loansFetchFailed}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  if (props.slug === 'personal-loan') {
    return (
      <PersonalLoanPage
        category={props.category}
        categories={props.categories}
        banks={props.banks}
        loans={props.loans}
        featuredLoans={props.featuredLoans}
        filterState={props.filterState}
        sort={props.sort}
        cursorMeta={props.cursorMeta}
        nextPageHref={props.nextPageHref}
        faqs={props.faqs}
        guides={props.guides}
        articles={props.articles}
        emiInitialAmount={props.emiInitialAmount}
        emiInitialRate={props.emiInitialRate}
        emiInitialTenure={props.emiInitialTenure}
        emiInitialTenureUnit={props.emiInitialTenureUnit}
      />
    );
  }

  return <LoanCategoryPageGeneric {...props} />;
}

function LoanCategoryPageGeneric({
  slug,
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
}: LoanCategoryPageProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname = loanCategoryCanonicalPath(slug);
  const cmsSections = parseContentSections(category.contentSections);

  const h1 = resolveCategoryH1(slug, category.name);
  const breadcrumbLabel = resolveCategoryBreadcrumbLabel(slug, category.name);
  const intro = resolveCategoryIntro(slug, category);
  const heroImageUrl = resolveLoanCategoryHeroImage({
    categorySlug: slug,
    heroImageUrl: category.heroImage,
    featuredImageUrl: category.featuredImage,
  });
  const heroImageAlt =
    category.heroImageAlt?.trim() ||
    category.featuredImageAlt?.trim() ||
    `${category.name} illustration`;

  const stats = computeLoanCategoryStats(loans);
  const education = resolveCategoryEducationSections(slug, cmsSections);
  const relatedCalculators = resolveCategoryRelatedCalculators(slug, cmsSections);
  const categoryFaqs: HubFaqItem[] = pickLoanCategoryFaqs(faqs, slug, category.id, 8);

  const relatedGuideSlugs = Array.isArray(cmsSections?.relatedGuideSlugs)
    ? cmsSections.relatedGuideSlugs.filter((s): s is string => typeof s === 'string')
    : null;
  const guideCards = buildLoanCategoryGuideCards({
    categorySlug: slug,
    relatedGuideSlugs,
    articles,
    guides,
    limit: 6,
  });

  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Finance', url: `${siteUrl}/finance` },
    { name: 'Loans', url: `${siteUrl}/finance/loans` },
    { name: breadcrumbLabel, url: `${siteUrl}${pathname}` },
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
    <main className="w-full bg-white">
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

      <div className="full-bleed bg-white">
        <div className="site-container px-4 pt-6 pb-4 sm:pt-8 sm:pb-5">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Finance', href: '/finance' },
              { label: 'Loans', href: '/finance/loans' },
              { label: breadcrumbLabel },
            ]}
          />
          <LoanTypeNav currentSlug={slug} categories={categories} />

          <div className="mt-3">
            <LoanHubHero
              title={h1}
              intro={intro}
              categories={categories}
              activeCategorySlug={slug}
              heroImageUrl={heroImageUrl}
              heroImageAlt={heroImageAlt}
              compareCtaLabel={h1}
              eligibilityLabel="Check eligibility"
              benefitPoints={LOAN_CATEGORY_HERO_BENEFITS}
              preferProvidedHeroImage
            />
          </div>

          <LoanCategoryStatsBar stats={stats} />

          <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
            Informational comparison only — not a loan offer or approval. Confirm rates and terms
            with the lender. Summary stats reflect currently listed products with available data.
          </p>
        </div>
      </div>

      <div className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]">
        <div className="site-container px-4 py-6 sm:py-8">
          <div className="mb-5">
            <AdBanner slot="content-top" />
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
            <Suspense
              fallback={
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200/80">
                  Loading filters…
                </div>
              }
            >
              <LoanFilters categories={categories} banks={banks} current={filterState} />
            </Suspense>

            <div className="min-w-0">
              <Suspense fallback={null}>
                <LoanActiveFilterChips
                  current={filterState}
                  categories={categories}
                  banks={banks}
                />
              </Suspense>
              <LoanProductResults
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

      <div className="full-bleed bg-[#e8eef5]/45">
        <div className="site-container px-4 py-8 sm:py-10">
          <Suspense fallback={null}>
            <LoanEmiCalculator
              initialAmount={emiInitialAmount}
              initialRate={emiInitialRate}
              initialTenure={emiInitialTenure}
              initialTenureUnit={emiInitialTenureUnit}
            />
          </Suspense>
          <div className="mt-6">
            <LoanDisclaimer />
          </div>
        </div>
      </div>

      <LoanCategoryEducation categoryName={category.name} sections={education} />

      <section className="full-bleed bg-white">
        <div className="site-container space-y-10 px-4 py-10 sm:py-12 lg:py-16">
          <LoanCategoryRelatedCalculators links={relatedCalculators} categoryName={category.name} />

          {guideCards.length ? <LoanGuidesSection guides={guideCards} /> : null}

          <nav aria-label="More loan categories">
            <p className="text-sm font-bold text-[#0b1f3a]">Explore other loan types</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories
                .filter((c) => c.slug !== slug)
                .slice(0, 8)
                .map((c) => (
                  <li key={c.id}>
                    <LinkChip
                      href={loanCategoryCanonicalPath(c.slug as LoanCategorySlug)}
                      label={c.name}
                    />
                  </li>
                ))}
              <li>
                <LinkChip href="/finance/loans" label="All loans" />
              </li>
            </ul>
          </nav>
        </div>
      </section>

      <section className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]">
        <div className="site-container px-4 py-10 sm:py-12 lg:py-16">
          <HubFaqSection
            faqs={categoryFaqs}
            viewAllHref="/finance/faqs"
            viewAllLabel="View all loan FAQs →"
            title={`${category.name} FAQs`}
          />
        </div>
      </section>
    </main>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center rounded-full bg-[#f8fafc] px-3.5 text-xs font-semibold text-[#0b1f3a] ring-1 ring-slate-200/80 hover:text-[#f97316]"
    >
      {label}
    </Link>
  );
}

// Re-export for callers that need resolved calculator links without rendering the page.
export type { ContextualLink } from '@/lib/loan-contextual-links';
