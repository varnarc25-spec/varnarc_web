import { apiPublicFetch, ApiError } from '@/services/api-client';

export type FinanceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  introduction?: string | null;
  icon?: string | null;
  iconMediaId?: string | null;
  iconAlt?: string | null;
  featuredImage?: string | null;
  featuredImageMediaId?: string | null;
  featuredImageAlt?: string | null;
  heroImage?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
  loanHubEnabled?: boolean;
  typicalMinAmount?: number | string | null;
  typicalMaxAmount?: number | string | null;
  typicalMinTenure?: number | null;
  typicalMaxTenure?: number | null;
  minInterestRate?: number | string | null;
  maxInterestRate?: number | string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoContent?: string | null;
  contentSections?: Record<string, unknown> | null;
};

export type FinanceDashboard = {
  categories: number;
  banksPublished: number;
  loansPublished: number;
  creditCardsPublished: number;
  insurancePublished: number;
  investmentsPublished: number;
  ratesTracked: number;
  relatedCalculators?: Array<{ slug: string; name: string }>;
};

export type FinanceLoan = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  loanType: string;
  interestRate?: number | string | null;
  interestRateMin?: number | string | null;
  interestRateMax?: number | string | null;
  rateType?: string | null;
  processingFee?: number | string | null;
  processingFeeMin?: number | string | null;
  processingFeeMax?: number | string | null;
  processingFeeText?: string | null;
  tenureMin?: number | null;
  tenureMax?: number | null;
  loanAmountMin?: number | string | null;
  loanAmountMax?: number | string | null;
  maxAmount?: number | string | null;
  minimumCreditScore?: number | null;
  eligibility?: string | null;
  eligibilitySummary?: string | null;
  features?: unknown;
  affiliateUrl?: string | null;
  officialApplicationUrl?: string | null;
  sourceUrl?: string | null;
  rateLastVerifiedAt?: string | null;
  pros?: string | null;
  cons?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  sponsoredDisclosure?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  bank?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    logoAlt?: string | null;
  } | null;
  category?: { id: string; name: string; slug: string } | null;
};

export type FinanceCreditCard = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  annualFee?: number | string | null;
  joiningFee?: number | string | null;
  rewards?: string | null;
  cashback?: string | null;
  loungeAccess?: boolean;
  affiliateUrl?: string | null;
  pros?: string | null;
  cons?: string | null;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  bank?: { id: string; name: string; slug: string } | null;
};

export type FinanceInsurance = {
  id: string;
  name: string;
  slug: string;
  providerName: string;
  coverage?: string | null;
  premium?: number | string | null;
  benefits?: string | null;
  affiliateUrl?: string | null;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  category?: { id: string; name: string; slug: string } | null;
};

export type FinanceInvestment = {
  id: string;
  name: string;
  slug: string;
  providerName: string;
  riskLevel?: string | null;
  expectedReturn?: number | string | null;
  lockInPeriod?: string | null;
  affiliateUrl?: string | null;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  category?: { id: string; name: string; slug: string } | null;
};

export type FinanceInterestRate = {
  id: string;
  productType?: string | null;
  rate: number | string;
  minTenure?: number | null;
  maxTenure?: number | null;
  source?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  bank?: { id: string; name: string; slug: string } | null;
  loan?: { id: string; name: string; slug: string } | null;
};

type ListOptions = {
  limit?: number;
  featured?: boolean;
  categoryId?: string;
  bankId?: string;
  loanType?: string;
};

export type LoanListOptions = {
  limit?: number;
  cursor?: string;
  featured?: boolean;
  sponsored?: boolean;
  categoryId?: string;
  categorySlug?: string;
  bankId?: string;
  loanType?: string;
  rateMin?: number;
  rateMax?: number;
  amountMin?: number;
  amountMax?: number;
  tenureMin?: number;
  tenureMax?: number;
  processingFeeMax?: number;
  creditScoreMaxRequired?: number;
  employmentType?: string;
  sort?:
    | 'recommended'
    | 'lowest_interest'
    | 'highest_amount'
    | 'lowest_processing_fee'
    | 'longest_tenure';
};

function buildQs(options?: ListOptions) {
  const qs = new URLSearchParams({ limit: String(options?.limit ?? 24) });
  if (options?.featured) qs.set('featured', 'true');
  if (options?.categoryId) qs.set('categoryId', options.categoryId);
  if (options?.bankId) qs.set('bankId', options.bankId);
  if (options?.loanType) qs.set('loanType', options.loanType);
  return qs.toString();
}

function buildLoanQs(options?: LoanListOptions) {
  const qs = new URLSearchParams({ limit: String(options?.limit ?? 24) });
  if (options?.cursor) qs.set('cursor', options.cursor);
  if (options?.featured) qs.set('featured', 'true');
  if (options?.sponsored) qs.set('sponsored', 'true');
  if (options?.categoryId) qs.set('categoryId', options.categoryId);
  if (options?.categorySlug) qs.set('categorySlug', options.categorySlug);
  if (options?.bankId) qs.set('bankId', options.bankId);
  if (options?.loanType) qs.set('loanType', options.loanType);
  if (options?.rateMin != null) qs.set('rateMin', String(options.rateMin));
  if (options?.rateMax != null) qs.set('rateMax', String(options.rateMax));
  if (options?.amountMin != null) qs.set('amountMin', String(options.amountMin));
  if (options?.amountMax != null) qs.set('amountMax', String(options.amountMax));
  if (options?.tenureMin != null) qs.set('tenureMin', String(options.tenureMin));
  if (options?.tenureMax != null) qs.set('tenureMax', String(options.tenureMax));
  if (options?.processingFeeMax != null)
    qs.set('processingFeeMax', String(options.processingFeeMax));
  if (options?.creditScoreMaxRequired != null) {
    qs.set('creditScoreMaxRequired', String(options.creditScoreMaxRequired));
  }
  if (options?.employmentType) qs.set('employmentType', options.employmentType);
  if (options?.sort) qs.set('sort', options.sort);
  return qs.toString();
}

export async function fetchFinanceDashboard() {
  try {
    return await apiPublicFetch<FinanceDashboard>('/finance/dashboard', { cache: 'no-store' });
  } catch {
    return { data: null };
  }
}

export async function fetchFinanceCategories() {
  try {
    return await apiPublicFetch<FinanceCategory[]>('/finance/categories', { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceCategory[] };
  }
}

export async function fetchLoanCategories() {
  try {
    const res = await apiPublicFetch<FinanceCategory[]>('/finance/loan-categories', {
      cache: 'no-store',
    });
    if (Array.isArray(res.data) && res.data.length > 0) return res;
  } catch {
    // Endpoint may not exist on older/production API builds yet.
  }

  try {
    const res = await apiPublicFetch<FinanceCategory[]>('/finance/categories', {
      cache: 'no-store',
    });
    const { LOAN_HUB_SLUGS } = await import('@/lib/loan-hub-categories');
    const filtered = (res.data ?? []).filter((c) => c.loanHubEnabled || LOAN_HUB_SLUGS.has(c.slug));
    if (filtered.length > 0) return { data: filtered };
  } catch {
    // Fall through to static structural list.
  }

  const { LOAN_HUB_CATEGORY_FALLBACK } = await import('@/lib/loan-hub-categories');
  return { data: LOAN_HUB_CATEGORY_FALLBACK };
}

export async function fetchFinanceLoans(options?: LoanListOptions | ListOptions) {
  try {
    const qs =
      options && ('sort' in options || 'categorySlug' in options || 'rateMin' in options)
        ? buildLoanQs(options as LoanListOptions)
        : buildQs(options as ListOptions | undefined);
    return await apiPublicFetch<FinanceLoan[]>(`/finance/loans?${qs}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as FinanceLoan[], meta: undefined, error: true as const };
  }
}

export async function fetchFinanceLoan(id: string) {
  return apiPublicFetch<FinanceLoan>(`/finance/loans/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceCreditCards(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceCreditCard[]>(`/finance/credit-cards?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as FinanceCreditCard[], meta: undefined };
  }
}

export async function fetchFinanceCreditCard(id: string) {
  return apiPublicFetch<FinanceCreditCard>(`/finance/credit-cards/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceInsurance(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceInsurance[]>(`/finance/insurance?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as FinanceInsurance[], meta: undefined };
  }
}

export async function fetchFinanceInsuranceProduct(id: string) {
  return apiPublicFetch<FinanceInsurance>(`/finance/insurance/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceInvestments(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceInvestment[]>(`/finance/investments?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as FinanceInvestment[], meta: undefined };
  }
}

export async function fetchFinanceInvestment(id: string) {
  return apiPublicFetch<FinanceInvestment>(`/finance/investments/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceRates(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceInterestRate[]>(
      `/finance/interest-rates?${buildQs(options)}`,
      { cache: 'no-store' },
    );
  } catch {
    return { data: [] as FinanceInterestRate[], meta: undefined };
  }
}

export async function fetchFinanceCompare(type: string, ids: string[]) {
  const qs = new URLSearchParams({ type, ids: ids.join(',') });
  return apiPublicFetch<unknown[]>(`/finance/compare?${qs.toString()}`, { cache: 'no-store' });
}

export type FinanceBank = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  loans?: FinanceLoan[];
  creditCards?: FinanceCreditCard[];
  _count?: { loans?: number; creditCards?: number };
};

export type FinanceGuide = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  category?: string | { name?: string | null; slug?: string | null } | null;
  content?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type FinanceFaq = {
  id: string;
  question: string;
  answer: string;
  category?: string | { name?: string | null; slug?: string | null } | null;
  entityType?: string | null;
  entityId?: string | null;
  sortOrder?: number | null;
};

export type FinanceGlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  slug?: string | null;
};

export type FinanceProductReview = {
  id: string;
  title: string;
  slug: string;
  overallScore?: number | string | null;
};

export type FinanceEligibilityResult = {
  eligible: boolean;
  message?: string;
  maxAmount?: number | string | null;
  suggestedProducts?: Array<{ id: string; name: string; href?: string }>;
};

export type FinanceCreditScoreResult = {
  score?: number | null;
  band?: string | null;
  message?: string;
};

export type FinancePortfolioItem = {
  id: string;
  name: string;
  type: string;
  value?: number | string | null;
  allocation?: number | string | null;
};

export type FinanceGoal = {
  id: string;
  name: string;
  targetAmount?: number | string | null;
  targetDate?: string | null;
  currentAmount?: number | string | null;
  category?: string | null;
};

export type FinancePageSeo = {
  pageKey: string;
  entityId: string;
  path: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  heroImageUrl?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  educationModules?: Record<
    string,
    { title?: string; summary?: string; guideHref?: string | null }
  > | null;
};

export async function fetchFinancePageSeo(pageKey: string) {
  return apiPublicFetch<FinancePageSeo>(`/finance/pages/${pageKey}`, {
    next: { revalidate: 120 },
  });
}

export async function fetchFinanceCategoryBySlug(slug: string) {
  return apiPublicFetch<FinanceCategory>(`/finance/categories/${slug}`, { cache: 'no-store' });
}

export async function fetchFinanceBanks(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceBank[]>(`/finance/banks?${buildQs(options)}`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as FinanceBank[], meta: undefined };
  }
}

export async function fetchFinanceBankBySlug(slug: string) {
  try {
    return await apiPublicFetch<FinanceBank>(`/finance/banks/slug/${slug}`, { cache: 'no-store' });
  } catch {
    try {
      return await apiPublicFetch<FinanceBank>(`/finance/banks/${slug}`, { cache: 'no-store' });
    } catch {
      throw new Error('Bank not found');
    }
  }
}

export async function fetchFinanceGuides() {
  try {
    return await apiPublicFetch<FinanceGuide[]>('/finance/guides', { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceGuide[] };
  }
}

export async function fetchFinanceGuide(slug: string) {
  return apiPublicFetch<FinanceGuide>(`/finance/guides/${slug}`, { cache: 'no-store' });
}

export async function fetchFinanceFaqs() {
  try {
    return await apiPublicFetch<FinanceFaq[]>('/finance/faqs', { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceFaq[] };
  }
}

export async function fetchFinanceGlossary() {
  try {
    return await apiPublicFetch<FinanceGlossaryTerm[]>('/finance/glossary', { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceGlossaryTerm[] };
  }
}

export async function fetchFinanceEntityReviews(
  entity: 'loans' | 'credit-cards' | 'insurance' | 'investments',
  id: string,
) {
  try {
    return await apiPublicFetch<FinanceProductReview[]>(`/finance/${entity}/${id}/reviews`, {
      cache: 'no-store',
    });
  } catch {
    return { data: [] as FinanceProductReview[] };
  }
}

export async function checkFinanceEligibility(body: {
  loanType: string;
  income: number;
  amount: number;
}) {
  return apiPublicFetch<FinanceEligibilityResult>('/finance/eligibility/check', {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function checkFinanceCreditScore(body: { pan?: string; name?: string; dob?: string }) {
  return apiPublicFetch<FinanceCreditScoreResult>('/finance/credit-score/check', {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

export async function fetchFinancePortfolio(): Promise<{
  data: FinancePortfolioItem[] | null;
  unauthorized?: boolean;
}> {
  try {
    const result = await apiPublicFetch<FinancePortfolioItem[]>('/finance/portfolio', {
      cache: 'no-store',
    });
    return { data: result.data };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return { data: null, unauthorized: true };
    }
    return { data: [] };
  }
}

export async function fetchFinanceGoals() {
  try {
    return await apiPublicFetch<FinanceGoal[]>('/finance/goals', { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceGoal[] };
  }
}

export async function createFinanceGoal(body: {
  name: string;
  targetAmount?: number;
  targetDate?: string;
  category?: string;
}) {
  return apiPublicFetch<FinanceGoal>('/finance/goals', {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}
