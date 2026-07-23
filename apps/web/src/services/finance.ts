import { apiPublicFetch, ApiError } from '@/services/api-client';

export type FinanceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
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
  description?: string | null;
  loanType: string;
  interestRate?: number | string | null;
  processingFee?: number | string | null;
  tenureMin?: number | null;
  tenureMax?: number | null;
  maxAmount?: number | string | null;
  eligibility?: string | null;
  affiliateUrl?: string | null;
  pros?: string | null;
  cons?: string | null;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  bank?: { id: string; name: string; slug: string } | null;
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

function buildQs(options?: ListOptions) {
  const qs = new URLSearchParams({ limit: String(options?.limit ?? 24) });
  if (options?.featured) qs.set('featured', 'true');
  if (options?.categoryId) qs.set('categoryId', options.categoryId);
  if (options?.bankId) qs.set('bankId', options.bankId);
  if (options?.loanType) qs.set('loanType', options.loanType);
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

export async function fetchFinanceLoans(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceLoan[]>(`/finance/loans?${buildQs(options)}`, { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceLoan[], meta: undefined };
  }
}

export async function fetchFinanceLoan(id: string) {
  return apiPublicFetch<FinanceLoan>(`/finance/loans/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceCreditCards(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceCreditCard[]>(`/finance/credit-cards?${buildQs(options)}`, { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceCreditCard[], meta: undefined };
  }
}

export async function fetchFinanceCreditCard(id: string) {
  return apiPublicFetch<FinanceCreditCard>(`/finance/credit-cards/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceInsurance(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceInsurance[]>(`/finance/insurance?${buildQs(options)}`, { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceInsurance[], meta: undefined };
  }
}

export async function fetchFinanceInsuranceProduct(id: string) {
  return apiPublicFetch<FinanceInsurance>(`/finance/insurance/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceInvestments(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceInvestment[]>(`/finance/investments?${buildQs(options)}`, { cache: 'no-store' });
  } catch {
    return { data: [] as FinanceInvestment[], meta: undefined };
  }
}

export async function fetchFinanceInvestment(id: string) {
  return apiPublicFetch<FinanceInvestment>(`/finance/investments/${id}`, { cache: 'no-store' });
}

export async function fetchFinanceRates(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceInterestRate[]>(`/finance/interest-rates?${buildQs(options)}`, { cache: 'no-store' });
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
  featured?: boolean;
  loans?: FinanceLoan[];
  creditCards?: FinanceCreditCard[];
  _count?: { loans?: number; creditCards?: number };
};

export type FinanceGuide = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  content?: string | null;
};

export type FinanceFaq = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
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

export async function fetchFinanceBanks(options?: ListOptions) {
  try {
    return await apiPublicFetch<FinanceBank[]>(`/finance/banks?${buildQs(options)}`, { cache: 'no-store' });
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
    const result = await apiPublicFetch<FinancePortfolioItem[]>('/finance/portfolio', { cache: 'no-store' });
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
