/** Map loan category slug → HubIcon name (existing icon set). */
export const LOAN_CATEGORY_ICONS: Record<string, string> = {
  'personal-loan': 'wallet',
  'home-loan': 'home',
  'car-loan': 'car',
  'education-loan': 'book',
  'business-loan': 'building',
  'gold-loan': 'sparkles',
  'two-wheeler-loan': 'fuel',
  'loan-against-property': 'bank',
};

/** Editorial SVG illustrations for loan category cards (4:3). */
export const LOAN_CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  'personal-loan': '/hub/finance/categories/personal-loan.svg',
  'home-loan': '/hub/finance/categories/home-loan.svg',
  'car-loan': '/hub/finance/categories/car-loan.svg',
  'education-loan': '/hub/finance/categories/education-loan.svg',
  'business-loan': '/hub/finance/categories/business-loan.svg',
  'gold-loan': '/hub/finance/categories/gold-loan.svg',
  'two-wheeler-loan': '/hub/finance/categories/two-wheeler-loan.svg',
  'loan-against-property': '/hub/finance/categories/loan-against-property.svg',
};

export function loanCategoryIcon(slug: string): string {
  return LOAN_CATEGORY_ICONS[slug] ?? 'wallet';
}

export function loanCategoryIllustration(slug: string): string | null {
  return LOAN_CATEGORY_ILLUSTRATIONS[slug] ?? null;
}
