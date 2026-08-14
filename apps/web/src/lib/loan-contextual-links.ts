import {
  articlePath,
  calculatorHref,
  comparePath,
  financeCreditScorePath,
  financeEligibilityPath,
  financeGuidesPath,
  financeRatesPath,
  loansHubPath,
  type KnownCalculatorSlug,
} from '@/lib/finance-routes';

export type ContextualLink = {
  label: string;
  href: string;
};

function calc(slug: KnownCalculatorSlug, label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

/** Category → related tools/guides. Only includes destinations that exist. */
const CATEGORY_LINKS: Record<string, ContextualLink[]> = {
  'personal-loan': [
    calc('personal-loan-emi', 'Personal Loan EMI Calculator'),
    {
      label: 'Personal Loan Eligibility Check',
      href: financeEligibilityPath({ loanType: 'personal' }),
    },
    calc('loan-eligibility', 'Loan Eligibility Calculator'),
    {
      label: 'Personal Loan Guides',
      href: loansHubPath({ categorySlug: 'personal-loan', hash: 'loan-guides-heading' }),
    },
  ],
  'home-loan': [
    calc('home-loan-emi', 'Home Loan EMI Calculator'),
    {
      label: 'Home Loan Eligibility Check',
      href: financeEligibilityPath({ loanType: 'home' }),
    },
    calc('loan-eligibility', 'Loan Eligibility Calculator'),
    // Balance Transfer Calculator is not seeded yet — omit to avoid broken links.
    {
      label: 'Home Loan Guides',
      href: loansHubPath({ categorySlug: 'home-loan', hash: 'loan-guides-heading' }),
    },
  ],
  'car-loan': [
    calc('car-loan', 'Car Loan EMI Calculator'),
    {
      label: 'Car Loan Eligibility Check',
      href: financeEligibilityPath({ loanType: 'car' }),
    },
    {
      label: 'Car Loan Guides',
      href: loansHubPath({ categorySlug: 'car-loan', hash: 'loan-guides-heading' }),
    },
  ],
  'education-loan': [
    calc('education-loan-emi', 'Education Loan EMI Calculator'),
    calc('loan-eligibility', 'Loan Eligibility Calculator'),
    {
      label: 'Education Loan Guides',
      href: loansHubPath({ categorySlug: 'education-loan', hash: 'loan-guides-heading' }),
    },
  ],
  'business-loan': [
    calc('business-loan-emi', 'Business Loan EMI Calculator'),
    {
      label: 'Business Loan Eligibility Check',
      href: financeEligibilityPath({ loanType: 'business' }),
    },
  ],
  'gold-loan': [calc('gold-loan-emi', 'Gold Loan EMI Calculator')],
  'two-wheeler-loan': [calc('bike-loan-emi', 'Two-Wheeler Loan EMI Calculator')],
  'loan-against-property': [
    calc('loan-against-property-emi', 'Loan Against Property EMI Calculator'),
  ],
};

/** Education / content section → related tools. */
const SECTION_LINKS: Record<string, ContextualLink[]> = {
  howInterestWorks: [
    calc('emi-rate-compare', 'EMI Rate Compare Calculator'),
    calc('fixed-vs-floating-emi', 'Fixed vs Floating Rate Calculator'),
    { label: 'Interest rates hub', href: financeRatesPath() },
    {
      label: 'How to use an EMI calculator',
      href: articlePath('emi-calculator-how-to-use'),
    },
  ],
  rateFactors: [
    { label: 'Credit score overview', href: financeCreditScorePath() },
    calc('loan-eligibility', 'Loan Eligibility Calculator'),
  ],
  feesAndCharges: [
    calc('emi', 'EMI Calculator'),
    { label: 'Loan guides', href: financeGuidesPath() },
  ],
  eligibility: [
    calc('loan-eligibility', 'Loan Eligibility Calculator'),
    { label: 'Eligibility check', href: financeEligibilityPath() },
  ],
  securedVsUnsecured: [
    {
      label: 'How to choose a personal loan',
      href: financeGuidesPath('how-to-choose-a-personal-loan'),
    },
    calc('loan-eligibility', 'Loan Eligibility Calculator'),
  ],
  fixedVsFloating: [
    calc('fixed-vs-floating-emi', 'Fixed vs Floating Rate Calculator'),
    {
      label: 'Fixed vs floating comparison',
      href: comparePath('fixed-vs-floating-home-loan'),
    },
  ],
  tenureAndCost: [
    calc('emi', 'EMI Calculator'),
    calc('emi-tenure-calculator', 'EMI Tenure Calculator'),
  ],
  compareTotalCost: [
    calc('emi', 'EMI Calculator'),
    calc('emi-rate-compare', 'EMI Rate Compare Calculator'),
  ],
  prepayment: [
    calc('loan-prepayment', 'Loan Prepayment Calculator'),
    { label: 'Home loan prepayment guide', href: articlePath('home-loan-prepayment') },
  ],
  mistakes: [
    calc('emi', 'EMI Calculator'),
    {
      label: 'How to choose a personal loan',
      href: financeGuidesPath('how-to-choose-a-personal-loan'),
    },
  ],
  emi: [calc('emi', 'Full EMI Calculator'), calc('loan-prepayment', 'Loan Prepayment Calculator')],
  creditScore: [
    { label: 'Credit score page', href: financeCreditScorePath() },
    {
      label: 'Credit score guides',
      href: loansHubPath({ hash: 'loan-guides-heading' }),
    },
    { label: 'How to improve CIBIL score', href: articlePath('cibil-score-improve') },
  ],
};

export function contextualLinksForCategory(slug: string): ContextualLink[] {
  return CATEGORY_LINKS[slug] ?? [];
}

export function contextualLinksForSection(sectionId: string): ContextualLink[] {
  return SECTION_LINKS[sectionId] ?? [];
}

/** Infer a related loan category from guide/article copy for hub cards. */
export function inferRelatedLoanCategorySlug(
  ...parts: Array<string | null | undefined>
): string | null {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  if (!text.trim()) return null;

  const rules: Array<{ re: RegExp; slug: string }> = [
    { re: /\b(home|housing)\s+loans?\b/, slug: 'home-loan' },
    { re: /\bpersonal\s+loans?\b/, slug: 'personal-loan' },
    { re: /\b(car|auto|vehicle)\s+loans?\b/, slug: 'car-loan' },
    { re: /\b(education|student)\s+loans?\b/, slug: 'education-loan' },
    { re: /\bbusiness\s+loans?\b/, slug: 'business-loan' },
    { re: /\bgold\s+loans?\b/, slug: 'gold-loan' },
    { re: /\b(two[-\s]?wheeler|bike)\s+loans?\b/, slug: 'two-wheeler-loan' },
    { re: /\bloan\s+against\s+property\b|\blap\b/, slug: 'loan-against-property' },
  ];

  for (const rule of rules) {
    if (rule.re.test(text)) return rule.slug;
  }
  return null;
}

export function relatedCategoryLink(slug: string, label?: string): ContextualLink {
  return {
    label: label ?? 'Browse related loans',
    href: loansHubPath({ categorySlug: slug }),
  };
}
