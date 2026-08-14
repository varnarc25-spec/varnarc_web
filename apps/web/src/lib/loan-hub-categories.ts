import type { FinanceCategory } from '@/services/finance';

/**
 * Single source of truth for loan-hub category slugs (route-safe allowlist).
 * Used for URL discrimination before any API lookup.
 */
export const LOAN_HUB_CATEGORY_SLUGS = [
  'personal-loan',
  'home-loan',
  'car-loan',
  'education-loan',
  'business-loan',
  'gold-loan',
  'two-wheeler-loan',
  'loan-against-property',
] as const;

export type LoanCategorySlug = (typeof LOAN_HUB_CATEGORY_SLUGS)[number];

export const LOAN_HUB_SLUGS = new Set<string>(LOAN_HUB_CATEGORY_SLUGS);

export function isLoanHubCategorySlug(slug: string): slug is LoanCategorySlug {
  return LOAN_HUB_SLUGS.has(slug);
}

/**
 * Structural loan hub categories (names/slugs only — no rates).
 * Used when the API has not deployed `/finance/loan-categories` yet.
 */
export const LOAN_HUB_CATEGORY_FALLBACK: FinanceCategory[] = [
  {
    id: 'hub-personal-loan',
    name: 'Personal Loan',
    slug: 'personal-loan',
    shortDescription:
      'Compare unsecured financing for personal expenses, with flexible tenure and repayment options.',
    introduction:
      'Compare personal loan rates, monthly EMI, fees, tenure and eligibility from available lenders.',
    typicalMinTenure: 12,
    typicalMaxTenure: 60,
  },
  {
    id: 'hub-home-loan',
    name: 'Home Loan',
    slug: 'home-loan',
    shortDescription:
      'Compare financing options for buying, building or renovating residential property.',
    introduction:
      'Compare home loan interest rates, loan amounts, tenure, processing fees, LTV and eligibility for buying or building a home.',
    typicalMinTenure: 60,
    typicalMaxTenure: 360,
  },
  {
    id: 'hub-car-loan',
    name: 'Car Loan',
    slug: 'car-loan',
    shortDescription: 'Compare vehicle financing for new and used cars across lenders.',
    typicalMinTenure: 12,
    typicalMaxTenure: 84,
  },
  {
    id: 'hub-education-loan',
    name: 'Education Loan',
    slug: 'education-loan',
    shortDescription: 'Compare study financing for higher education in India and abroad.',
    typicalMinTenure: 12,
    typicalMaxTenure: 180,
  },
  {
    id: 'hub-business-loan',
    name: 'Business Loan',
    slug: 'business-loan',
    shortDescription: 'Compare credit options for working capital and business growth.',
    typicalMinTenure: 12,
    typicalMaxTenure: 84,
  },
  {
    id: 'hub-gold-loan',
    name: 'Gold Loan',
    slug: 'gold-loan',
    shortDescription: 'Compare loans secured against gold jewellery from banks and NBFCs.',
    typicalMinTenure: 3,
    typicalMaxTenure: 36,
  },
  {
    id: 'hub-two-wheeler-loan',
    name: 'Two-Wheeler Loan',
    slug: 'two-wheeler-loan',
    shortDescription: 'Compare financing for scooters and motorcycles.',
    typicalMinTenure: 6,
    typicalMaxTenure: 48,
  },
  {
    id: 'hub-loan-against-property',
    name: 'Loan Against Property',
    slug: 'loan-against-property',
    shortDescription: 'Compare secured credit against residential or commercial property.',
    typicalMinTenure: 60,
    typicalMaxTenure: 180,
  },
];

export function loanCategoryDisplayName(slug: LoanCategorySlug): string {
  const row = LOAN_HUB_CATEGORY_FALLBACK.find((c) => c.slug === slug);
  return row?.name ?? slug;
}
