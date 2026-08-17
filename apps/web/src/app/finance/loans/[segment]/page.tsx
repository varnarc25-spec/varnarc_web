import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoanCategoryPage } from '@/components/loans/loan-category-page';
import { LoanDetailView, loanDetailMetadata } from '@/components/loans/loan-detail-view';
import type { LoanFilterState } from '@/components/loans/loan-filters';
import {
  fetchFinanceBanks,
  fetchFinanceFaqs,
  fetchFinanceGuides,
  fetchFinanceLoan,
  fetchFinanceLoans,
  fetchLoanCategories,
  type LoanListOptions,
} from '@/services/finance';
import { fetchArticles } from '@/services/content';
import { ApiError } from '@/services/api-client';
import {
  classifyLoanPathSegment,
  hasLoanCatalogFilters,
  loanCategoryCanonicalPath,
  pickLoanCatalogFilters,
} from '@/lib/loan-path';
import {
  loanCategoryDisplayName,
  type LoanCategorySlug,
  isLoanHubCategorySlug,
} from '@/lib/loan-hub-categories';
import { parseCursorMeta, LOAN_PAGINATION_THRESHOLD } from '@/lib/loan-catalog';
import { parseEmiQuery } from '@/lib/emi-query';
import { resolveCategorySeo } from '@/lib/loan-category-page';
import { LOAN_HUB_CATEGORY_FALLBACK } from '@/lib/loan-hub-categories';

type Props = {
  params: Promise<{ segment: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { segment } = await params;
  const classification = classifyLoanPathSegment(segment);

  if (classification.kind === 'loan-detail') {
    return loanDetailMetadata(classification.id);
  }

  if (classification.kind === 'category') {
    const sp = await searchParams;
    const flat = flattenSearchParams(sp);
    const filtered = hasLoanCatalogFilters(flat);
    const categoriesRes = await fetchLoanCategories();
    const category = (categoriesRes.data ?? []).find((c) => c.slug === classification.slug) ?? null;
    const seo = resolveCategorySeo(classification.slug, category);
    const canonical = loanCategoryCanonicalPath(classification.slug);
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

    return {
      title: seo.title,
      description: seo.description,
      alternates: { canonical },
      openGraph: {
        title: seo.title,
        description: seo.description,
        url: `${siteUrl}${canonical}`,
        type: 'website',
      },
      robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    };
  }

  return { title: 'Not found' };
}

export const revalidate = 60;

function flattenSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(sp)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

function parseNum(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function renderCategoryPage(
  slug: LoanCategorySlug,
  rawParams: Record<string, string | string[] | undefined>,
) {
  const params = flattenSearchParams(rawParams);
  const sort = (params.sort as LoanListOptions['sort']) || 'recommended';
  const bankId = params.bankId || params.lender;

  const listOptions: LoanListOptions = {
    limit: LOAN_PAGINATION_THRESHOLD,
    cursor: params.cursor,
    categorySlug: slug,
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
    vehicleCondition: params.vehicleCondition,
    financingPercentMin: parseNum(params.financingPercentMin),
    sort,
  };

  const [categoriesRes, banksRes, loansRes, featuredRes, faqsRes, guidesRes, articlesRes] =
    await Promise.all([
      fetchLoanCategories(),
      fetchFinanceBanks({ limit: 100 }),
      fetchFinanceLoans(listOptions),
      fetchFinanceLoans({
        limit: 4,
        featured: true,
        categorySlug: slug,
        sort: 'recommended',
      }),
      fetchFinanceFaqs(),
      fetchFinanceGuides(),
      fetchArticles(24),
    ]);

  const categories = categoriesRes.data ?? [];
  const fromApi = categories.find((c) => c.slug === slug) ?? null;
  const fallback = LOAN_HUB_CATEGORY_FALLBACK.find((c) => c.slug === slug);
  const category = fromApi ?? {
    id: fallback?.id ?? `hub-${slug}`,
    name: fallback?.name ?? loanCategoryDisplayName(slug),
    slug,
    introduction: fallback?.introduction,
    shortDescription: fallback?.shortDescription,
    typicalMinTenure: fallback?.typicalMinTenure,
    typicalMaxTenure: fallback?.typicalMaxTenure,
  };

  const banks = banksRes.data ?? [];
  const loans = loansRes.data ?? [];
  const loansFetchFailed = 'error' in loansRes && loansRes.error === true;
  const featuredLoans = (featuredRes.data ?? []).filter((l) => l.featured);
  const cursorMeta = parseCursorMeta(loansRes.meta);

  const filterState: LoanFilterState = {
    categorySlug: slug,
    bankId,
    rateMax: params.rateMax,
    amountMin: params.amountMin,
    tenureMin: params.tenureMin,
    processingFeeMax: params.processingFeeMax,
    creditScoreMaxRequired: params.creditScoreMaxRequired,
    employmentType: params.employmentType,
    vehicleCondition: params.vehicleCondition,
    financingPercentMin: params.financingPercentMin,
    sort,
  };

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
    const base = loanCategoryCanonicalPath(slug);
    nextPageHref = q ? `${base}?${q}` : null;
  }

  return (
    <LoanCategoryPage
      slug={slug}
      category={category}
      categories={categories.length ? categories : LOAN_HUB_CATEGORY_FALLBACK}
      banks={banks}
      loans={loans}
      featuredLoans={featuredLoans}
      filterState={filterState}
      sort={sort}
      cursorMeta={cursorMeta}
      nextPageHref={nextPageHref}
      loansFetchFailed={loansFetchFailed}
      faqs={faqsRes.data ?? []}
      guides={guidesRes.data ?? []}
      articles={articlesRes.data ?? []}
      emiInitialAmount={!emi.usedDefaults.amount ? emi.amount : undefined}
      emiInitialRate={!emi.usedDefaults.rate ? emi.rate : undefined}
      emiInitialTenure={!emi.usedDefaults.tenure ? emi.tenure : undefined}
      emiInitialTenureUnit={!emi.usedDefaults.tenure ? emi.tenureUnit : undefined}
    />
  );
}

export default async function FinanceLoansSegmentPage({ params, searchParams }: Props) {
  const { segment } = await params;
  const classification = classifyLoanPathSegment(segment);

  if (classification.kind === 'unknown') {
    notFound();
  }

  if (classification.kind === 'category') {
    if (!isLoanHubCategorySlug(classification.slug)) notFound();
    const sp = await searchParams;
    return renderCategoryPage(classification.slug, sp);
  }

  const id = classification.id;
  let loan: Awaited<ReturnType<typeof fetchFinanceLoan>>['data'] | null = null;

  try {
    const result = await fetchFinanceLoan(id);
    loan = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return <LoanDetailView loan={loan} id={id} />;
}
