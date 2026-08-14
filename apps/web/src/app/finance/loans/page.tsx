import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { LoanCatalogView } from '@/components/loans/loan-catalog-view';
import { LoanHubSections } from '@/components/loans/loan-hub-sections';
import { JsonLd, faqJsonLd } from '@/components/seo/json-ld';
import type { LoanFilterState } from '@/components/loans/loan-filters';
import {
  fetchFinanceBanks,
  fetchFinanceFaqs,
  fetchFinanceGuides,
  fetchFinanceLoans,
  fetchLoanCategories,
  type FinanceCategory,
  type FinanceGuide,
  type LoanListOptions,
} from '@/services/finance';
import { fetchArticles, type ArticleListItem } from '@/services/content';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';
import { pickLoanFaqs } from '@/lib/loan-hub-faqs';
import type { LoanEducationModulesCms } from '@/lib/loan-hub-education';
import {
  buildLegacyCategoryRedirect,
  hasLoanCatalogFilters,
  loansHubCanonicalPath,
  pickLoanCatalogFilters,
} from '@/lib/loan-path';
import { parseCursorMeta, LOAN_PAGINATION_THRESHOLD } from '@/lib/loan-catalog';
import { parseEmiQuery } from '@/lib/emi-query';
import { isLoanHubCategorySlug } from '@/lib/loan-hub-categories';
import { resolveLoanHeroImage } from '@/lib/loan-visual-assets';

type SearchParams = Promise<{
  categorySlug?: string;
  bankId?: string;
  lender?: string;
  rateMin?: string;
  rateMax?: string;
  amountMin?: string;
  amountMax?: string;
  tenureMin?: string;
  tenureMax?: string;
  processingFeeMax?: string;
  creditScoreMaxRequired?: string;
  employmentType?: string;
  sort?: string;
  featured?: string;
  cursor?: string;
  amount?: string;
  rate?: string;
  tenure?: string;
  tenureUnit?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  // Legacy category URLs redirect — metadata for remaining hub (no categorySlug).
  const metadata = await buildFinancePageMetadata('loans');
  const filtered = hasLoanCatalogFilters(params);

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: loansHubCanonicalPath(),
    },
    robots: filtered
      ? { index: false, follow: true }
      : (metadata.robots ?? { index: true, follow: true }),
  };
}

export const revalidate = 60;

function parseNum(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function LoanHubBelowFold({
  categories,
  emiInitialAmount,
  emiInitialRate,
  emiInitialTenure,
  emiInitialTenureUnit,
  educationModules,
}: {
  categories: FinanceCategory[];
  emiInitialAmount?: number;
  emiInitialRate?: number;
  emiInitialTenure?: number;
  emiInitialTenureUnit?: 'months' | 'years';
  educationModules?: LoanEducationModulesCms | null;
}) {
  const [faqsRes, guidesRes, articlesRes] = await Promise.all([
    fetchFinanceFaqs(),
    fetchFinanceGuides(),
    fetchArticles(24),
  ]);

  const faqs = pickLoanFaqs(faqsRes.data ?? [], 8);
  const guides: FinanceGuide[] = guidesRes.data ?? [];
  const articles: ArticleListItem[] = articlesRes.data ?? [];

  return (
    <>
      {faqs.length ? (
        <JsonLd
          data={faqJsonLd(
            faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
            })),
          )}
        />
      ) : null}

      <LoanHubSections
        categories={categories}
        guides={guides}
        articles={articles}
        emiInitialAmount={emiInitialAmount}
        emiInitialRate={emiInitialRate}
        emiInitialTenure={emiInitialTenure}
        emiInitialTenureUnit={emiInitialTenureUnit}
        educationModules={educationModules}
      />

      <section className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]">
        <div className="site-container px-4 py-10 sm:py-12 lg:py-16">
          <HubFaqSection
            faqs={faqs}
            viewAllHref="/finance/faqs"
            viewAllLabel="View all loan FAQs →"
            title="Loan frequently asked questions"
          />
        </div>
      </section>
    </>
  );
}

export default async function FinanceLoansPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Legacy: /finance/loans?categorySlug=personal-loan → /finance/loans/personal-loan
  if (params.categorySlug && isLoanHubCategorySlug(params.categorySlug)) {
    const target = buildLegacyCategoryRedirect(params.categorySlug, params);
    if (target) permanentRedirect(target);
  }

  const sort = (params.sort as LoanListOptions['sort']) || 'recommended';
  const bankId = params.bankId || params.lender;
  const featuredOnly = params.featured === '1' || params.featured === 'true';

  const listOptions: LoanListOptions = {
    limit: LOAN_PAGINATION_THRESHOLD,
    cursor: params.cursor,
    bankId,
    rateMin: parseNum(params.rateMin),
    rateMax: parseNum(params.rateMax),
    amountMin: parseNum(params.amountMin),
    amountMax: parseNum(params.amountMax),
    tenureMin: parseNum(params.tenureMin),
    tenureMax: parseNum(params.tenureMax),
    processingFeeMax: parseNum(params.processingFeeMax),
    creditScoreMaxRequired: parseNum(params.creditScoreMaxRequired),
    employmentType: params.employmentType,
    sort,
    featured: featuredOnly || undefined,
  };

  const [page, categoriesRes, banksRes, loansRes, featuredRes] = await Promise.all([
    getFinancePageContent('loans'),
    fetchLoanCategories(),
    fetchFinanceBanks({ limit: 100 }),
    fetchFinanceLoans(listOptions),
    fetchFinanceLoans({ limit: 8, featured: true, sort: 'recommended' }),
  ]);

  const categories = categoriesRes.data ?? [];
  const banks = banksRes.data ?? [];
  const loans = loansRes.data ?? [];
  const featuredLoans = featuredOnly ? [] : (featuredRes.data ?? []).filter((l) => l.featured);
  const cursorMeta = parseCursorMeta(loansRes.meta);

  const filterState: LoanFilterState = {
    bankId,
    rateMax: params.rateMax,
    amountMin: params.amountMin,
    tenureMin: params.tenureMin,
    processingFeeMax: params.processingFeeMax,
    creditScoreMaxRequired: params.creditScoreMaxRequired,
    employmentType: params.employmentType,
    sort,
  };

  const legacyH1 = !page.h1?.trim() || page.h1.trim() === 'Loans';
  const legacyIntro =
    !page.intro?.trim() ||
    page.intro.trim() === 'Browse and compare loan products from partner banks.';
  const h1 = legacyH1 ? 'Compare Loans' : page.h1;
  const intro = legacyIntro
    ? 'Compare interest rates, fees, loan amounts and repayment terms from multiple lenders.'
    : page.intro;

  const emi = parseEmiQuery({
    amount: params.amount,
    rate: params.rate,
    tenure: params.tenure,
    tenureUnit: params.tenureUnit,
  });

  let nextPageHref: string | null = null;
  if (cursorMeta?.hasMore && cursorMeta.nextCursor) {
    const qs = pickLoanCatalogFilters({ ...params, cursor: cursorMeta.nextCursor });
    const q = qs.toString();
    nextPageHref = q ? `/finance/loans?${q}` : null;
  }

  return (
    <LoanCatalogView
      mode="hub"
      h1={h1}
      intro={intro}
      heroImageUrl={resolveLoanHeroImage({ heroImageUrl: page.heroImageUrl })}
      heroImageAlt={page.heroImageAlt}
      categories={categories}
      banks={banks}
      loans={loans}
      featuredLoans={featuredLoans}
      filterState={filterState}
      sort={sort}
      cursorMeta={cursorMeta}
      nextPageHref={nextPageHref}
      belowFold={
        <LoanHubBelowFold
          categories={categories}
          emiInitialAmount={!emi.usedDefaults.amount ? emi.amount : undefined}
          emiInitialRate={!emi.usedDefaults.rate ? emi.rate : undefined}
          emiInitialTenure={!emi.usedDefaults.tenure ? emi.tenure : undefined}
          emiInitialTenureUnit={!emi.usedDefaults.tenure ? emi.tenureUnit : undefined}
          educationModules={page.educationModules}
        />
      }
    />
  );
}
