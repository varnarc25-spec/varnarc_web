import type { FinanceLoan } from '@/services/finance';
import type { CursorMeta } from '@/services/api-client';
import { toNumber, formatPercent } from '@/components/loans/loan-format';
import { buildCalculatorHref } from '@/lib/calculator-query';
import { isLoanHubCategorySlug } from '@/lib/loan-hub-categories';

export const LOAN_COMPARE_MAX = 4;
export const LOAN_FEATURED_MAX = 3;
export const LOAN_FEATURED_MIN_TO_SHOW = 2;
/** Show load-more UI only at/above this total first-page count. */
export const LOAN_PAGINATION_THRESHOLD = 48;

export type PreparedLoanCatalog = {
  featured: FinanceLoan[];
  catalog: FinanceLoan[];
  showFeatured: boolean;
  featuredTotal: number;
};

/** Featured section + dedupe from the main catalog list. */
export function prepareLoanCatalog(
  loans: FinanceLoan[],
  featuredLoans: FinanceLoan[],
): PreparedLoanCatalog {
  const allFeatured = featuredLoans.filter((loan) => loan.featured);
  const featured = allFeatured.slice(0, LOAN_FEATURED_MAX);
  const showFeatured = featured.length >= LOAN_FEATURED_MIN_TO_SHOW;
  const featuredIds = new Set(featured.map((l) => l.id));
  const catalog = showFeatured ? loans.filter((loan) => !featuredIds.has(loan.id)) : loans;
  return { featured, catalog, showFeatured, featuredTotal: allFeatured.length };
}

export function canAddToCompare(
  selected: string[],
  loanId: string,
  max = LOAN_COMPARE_MAX,
): boolean {
  if (selected.includes(loanId)) return true;
  return selected.length < max;
}

export function toggleCompareSelection(
  selected: string[],
  loanId: string,
  max = LOAN_COMPARE_MAX,
): string[] {
  if (selected.includes(loanId)) return selected.filter((id) => id !== loanId);
  if (selected.length >= max) return selected;
  return [...selected, loanId];
}

export function parseCursorMeta(meta?: Record<string, unknown>): CursorMeta | null {
  if (!meta) return null;
  const nextCursor =
    typeof meta.nextCursor === 'string' ? meta.nextCursor : meta.nextCursor === null ? null : null;
  const hasMore = Boolean(meta.hasMore);
  const limit = typeof meta.limit === 'number' ? meta.limit : LOAN_PAGINATION_THRESHOLD;
  return { nextCursor, hasMore, limit };
}

export function shouldExposePaginationUi(
  pageSize: number,
  meta: CursorMeta | null,
  threshold = LOAN_PAGINATION_THRESHOLD,
): boolean {
  if (!meta?.hasMore || !meta.nextCursor) return false;
  return pageSize >= threshold || meta.hasMore;
}

/** Display label for processing fee — never invents 0% from null. */
export function processingFeeDisplay(loan: FinanceLoan): string {
  if (loan.processingFeeText?.trim()) return loan.processingFeeText.trim();
  const min = toNumber(loan.processingFeeMin) ?? toNumber(loan.processingFee);
  const max = toNumber(loan.processingFeeMax) ?? toNumber(loan.processingFee);
  if (min == null && max == null) return 'Not currently available';
  if (min != null && max != null && min !== max) {
    return `${formatPercent(min)} – ${formatPercent(max)}`;
  }
  return formatPercent(min ?? max) ?? 'Not currently available';
}

/** Prefer category-specific EMI calculator when known; otherwise base EMI. */
function emiCalculatorSlugForLoan(loan: FinanceLoan): string {
  switch (loan.category?.slug) {
    case 'personal-loan':
      return 'personal-loan-emi';
    case 'home-loan':
      return 'home-loan-emi';
    case 'car-loan':
      return 'car-loan';
    case 'education-loan':
      return 'education-loan-emi';
    case 'business-loan':
      return 'business-loan-emi';
    case 'gold-loan':
      return 'gold-loan-emi';
    case 'two-wheeler-loan':
      return 'bike-loan-emi';
    case 'loan-against-property':
      return 'loan-against-property-emi';
    default:
      return 'emi';
  }
}

/** Product → EMI calculator link. Never uses max loan amount as principal. */
export function productEmiLink(loan: FinanceLoan): {
  href: string;
  label: string;
  rate: number | null;
} | null {
  const rate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  const amountMin = toNumber(loan.loanAmountMin);
  // Prefer min amount only when present; never max/loanAmountMax.
  const amount = amountMin != null && amountMin > 0 ? amountMin : undefined;

  let tenure: number | undefined;
  let tenureUnit: 'months' | 'years' | undefined;
  if (loan.tenureMin != null && loan.tenureMin > 0) {
    if (loan.tenureMin >= 12 && loan.tenureMin % 12 === 0) {
      tenure = loan.tenureMin / 12;
      tenureUnit = 'years';
    } else {
      tenure = loan.tenureMin;
      tenureUnit = 'months';
    }
  }

  const category =
    loan.category?.slug && isLoanHubCategorySlug(loan.category.slug)
      ? loan.category.slug
      : undefined;

  const href = buildCalculatorHref(emiCalculatorSlugForLoan(loan), {
    amount,
    rate: rate ?? undefined,
    tenure,
    tenureUnit,
    product: loan.slug?.trim() || undefined,
    lender: loan.bank?.slug?.trim() || undefined,
    category,
  });

  if (rate != null) {
    const rateLabel = formatPercent(rate)?.replace('%', '') ?? String(rate);
    return {
      href,
      label: `Calculate EMI at ${rateLabel}% →`,
      rate,
    };
  }

  return {
    href,
    label: 'Calculate EMI',
    rate: null,
  };
}
