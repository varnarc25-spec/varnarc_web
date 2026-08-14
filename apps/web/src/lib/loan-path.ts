import { isLoanHubCategorySlug, type LoanCategorySlug } from '@/lib/loan-hub-categories';

/** UUID v1–v5 (case-insensitive). Used to preserve loan detail routes. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLoanDetailUuid(segment: string): boolean {
  return UUID_RE.test(segment);
}

export type LoanPathKind = 'category' | 'loan-detail' | 'unknown';

export type LoanPathClassification =
  | { kind: 'category'; slug: LoanCategorySlug }
  | { kind: 'loan-detail'; id: string }
  | { kind: 'unknown'; segment: string };

/**
 * Strict discrimination for `/finance/loans/{segment}`.
 * Category allowlist is checked before UUID so reserved slugs never hit the loan API.
 */
export function classifyLoanPathSegment(segment: string): LoanPathClassification {
  const value = segment.trim();
  if (!value) return { kind: 'unknown', segment: value };
  if (isLoanHubCategorySlug(value)) return { kind: 'category', slug: value };
  if (isLoanDetailUuid(value)) return { kind: 'loan-detail', id: value };
  return { kind: 'unknown', segment: value };
}

/** Catalog filter keys preserved across legacy category redirects. */
export const LOAN_CATALOG_FILTER_KEYS = [
  'bankId',
  'lender',
  'sort',
  'featured',
  'rateMin',
  'rateMax',
  'amountMin',
  'amountMax',
  'tenureMin',
  'tenureMax',
  'processingFeeMax',
  'creditScoreMaxRequired',
  'employmentType',
  'cursor',
] as const;

export type LoanCatalogFilterKey = (typeof LOAN_CATALOG_FILTER_KEYS)[number];

export function pickLoanCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const qs = new URLSearchParams();
  for (const key of LOAN_CATALOG_FILTER_KEYS) {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value == null) continue;
    const trimmed = String(value).trim();
    if (!trimmed) continue;
    // Normalize legacy `lender` → `bankId` (single filter key in catalog URLs).
    if (key === 'lender') {
      if (!qs.has('bankId')) qs.set('bankId', trimmed);
      continue;
    }
    qs.set(key, trimmed);
  }
  return qs;
}

/**
 * Build redirect target for legacy `/finance/loans?categorySlug=…`.
 * Returns null when categorySlug is missing or not an allowlisted hub category.
 */
export function buildLegacyCategoryRedirect(
  categorySlug: string | null | undefined,
  params: Record<string, string | string[] | undefined>,
): string | null {
  if (!categorySlug || !isLoanHubCategorySlug(categorySlug)) return null;
  const qs = pickLoanCatalogFilters(params);
  const query = qs.toString();
  return query ? `/finance/loans/${categorySlug}?${query}` : `/finance/loans/${categorySlug}`;
}

export function loanCategoryCanonicalPath(slug: LoanCategorySlug): string {
  return `/finance/loans/${slug}`;
}

export function loansHubCanonicalPath(): string {
  return '/finance/loans';
}

export function hasLoanCatalogFilters(params: Record<string, string | undefined>): boolean {
  return LOAN_CATALOG_FILTER_KEYS.some((key) => {
    const value = params[key];
    if (value == null || String(value).trim() === '') return false;
    if (key === 'sort' && value === 'recommended') return false;
    return true;
  });
}
