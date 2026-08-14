/**
 * Central path builders for finance / loans / calculators.
 * Prefer these over string literals so hub links stay consistent.
 */

import { isLoanHubCategorySlug, type LoanCategorySlug } from '@/lib/loan-hub-categories';
import { loanCategoryCanonicalPath, pickLoanCatalogFilters } from '@/lib/loan-path';
import { serializeCalculatorParams, type CalculatorQueryState } from '@/lib/calculator-query';

export type { LoanCategorySlug };

/** Calculator slugs known to be seeded / live — never invent unknown slugs. */
export const KNOWN_CALCULATOR_SLUGS = [
  'emi',
  'personal-loan-emi',
  'home-loan-emi',
  'car-loan',
  'bike-loan-emi',
  'education-loan-emi',
  'business-loan-emi',
  'gold-loan-emi',
  'loan-against-property-emi',
  'credit-card-emi',
  'loan-eligibility',
  'loan-prepayment',
  'emi-tenure-calculator',
  'emi-rate-compare',
  'fixed-vs-floating-emi',
  'debt-planner',
] as const;

export type KnownCalculatorSlug = (typeof KNOWN_CALCULATOR_SLUGS)[number];

const KNOWN_CALC_SET = new Set<string>(KNOWN_CALCULATOR_SLUGS);

export function isKnownCalculatorSlug(slug: string): slug is KnownCalculatorSlug {
  return KNOWN_CALC_SET.has(slug);
}

export function financeHubPath(): string {
  return '/finance';
}

/**
 * Loans hub / category path builder.
 * Category destinations use clean `/finance/loans/{slug}` routes (not ?categorySlug=).
 */
export function loansHubPath(params?: {
  categorySlug?: string;
  sort?: string;
  hash?: string;
  filters?: Record<string, string | undefined>;
}): string {
  const categorySlug = params?.categorySlug?.trim();
  const filterParams: Record<string, string | undefined> = {
    ...(params?.filters ?? {}),
  };
  if (params?.sort) filterParams.sort = params.sort;

  const qs = pickLoanCatalogFilters(filterParams);
  // sort may not be in pick list when empty — ensure explicit sort when provided
  if (params?.sort && params.sort !== 'recommended') {
    qs.set('sort', params.sort);
  } else if (params?.sort === 'recommended') {
    // omit default sort from URL
  }

  const query = qs.toString();

  let base: string;
  if (categorySlug && isLoanHubCategorySlug(categorySlug)) {
    base = loanCategoryCanonicalPath(categorySlug);
  } else {
    base = '/finance/loans';
  }

  const withQuery = query ? `${base}?${query}` : base;
  return params?.hash ? `${withQuery}#${params.hash}` : withQuery;
}

export function loanCategoryPath(slug: string): string {
  return `/finance/categories/${encodeURIComponent(slug)}`;
}

export function loanDetailPath(id: string): string {
  return `/finance/loans/${encodeURIComponent(id)}`;
}

export function financeGuidesPath(slug?: string): string {
  return slug ? `/finance/guides/${encodeURIComponent(slug)}` : '/finance/guides';
}

export function financeEligibilityPath(params?: { loanType?: string }): string {
  if (!params?.loanType) return '/finance/eligibility';
  const qs = new URLSearchParams({ loanType: params.loanType });
  return `/finance/eligibility?${qs.toString()}`;
}

export function financeCreditScorePath(): string {
  return '/finance/credit-score';
}

export function financeRatesPath(): string {
  return '/finance/rates';
}

export function financeCompareLoansPath(ids?: string[]): string {
  const qs = new URLSearchParams({ type: 'loans' });
  if (ids?.length) qs.set('ids', ids.join(','));
  return `/finance/compare?${qs.toString()}`;
}

export function financeMethodologyPath(): string {
  return '/finance/loans/methodology';
}

export function articlePath(slug: string): string {
  return `/articles/${encodeURIComponent(slug)}`;
}

export function comparePath(slug: string): string {
  return `/compare/${encodeURIComponent(slug)}`;
}

export function calculatorPath(
  slug: KnownCalculatorSlug | string,
  query?: Record<string, string | number | undefined | null> | CalculatorQueryState,
): string | null {
  if (!isKnownCalculatorSlug(slug)) return null;

  const asRecord = (query ?? {}) as Record<string, unknown>;
  const looksLikeCalculatorQuery =
    'amount' in asRecord ||
    'rate' in asRecord ||
    'tenure' in asRecord ||
    'tenureUnit' in asRecord ||
    'product' in asRecord ||
    'lender' in asRecord ||
    'category' in asRecord;

  if (looksLikeCalculatorQuery) {
    const qs = serializeCalculatorParams(asRecord as CalculatorQueryState).toString();
    return qs ? `/calculators/${slug}?${qs}` : `/calculators/${slug}`;
  }

  const qs = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(
      query as Record<string, string | number | undefined | null>,
    )) {
      if (value == null || value === '') continue;
      // Never leak disallowed private/filter keys through generic query passthrough.
      if (
        key === 'income' ||
        key === 'creditScore' ||
        key === 'employment' ||
        key === 'employmentType' ||
        key === 'productName' ||
        key === 'productId'
      ) {
        continue;
      }
      qs.set(key, String(value));
    }
  }
  const q = qs.toString();
  return q ? `/calculators/${slug}?${q}` : `/calculators/${slug}`;
}

/** Safe wrapper that returns href only for known calculator slugs. */
export function calculatorHref(
  slug: KnownCalculatorSlug,
  query?: Record<string, string | number | undefined | null> | CalculatorQueryState,
): string {
  return calculatorPath(slug, query) ?? `/calculators/${slug}`;
}
