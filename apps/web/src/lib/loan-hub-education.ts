/**
 * Default modular copy for /finance/loans educational sections.
 * CMS can override per-module fields via finance page SEO structuredData.educationModules.
 */

import {
  articlePath,
  calculatorHref,
  comparePath,
  financeCreditScorePath,
  financeEligibilityPath,
  financeGuidesPath,
} from '@/lib/finance-routes';

export type LoanEducationModuleOverride = {
  title?: string;
  summary?: string;
  guideHref?: string | null;
};

export type LoanEducationModulesCms = Partial<
  Record<LoanEducationModuleId, LoanEducationModuleOverride>
>;

export type LoanEducationModuleId =
  | 'typesOfLoans'
  | 'howInterestWorks'
  | 'rateFactors'
  | 'feesAndCharges'
  | 'eligibility'
  | 'securedVsUnsecured'
  | 'fixedVsFloating'
  | 'tenureAndCost'
  | 'compareTotalCost'
  | 'prepayment'
  | 'mistakes';

export type LoanEducationModuleBase = {
  id: LoanEducationModuleId;
  title: string;
  summary: string;
  /** Deeper guide when available; null hides the CTA. */
  guideHref: string | null;
};

export const LOAN_EDUCATION_DEFAULTS: Record<LoanEducationModuleId, LoanEducationModuleBase> = {
  typesOfLoans: {
    id: 'typesOfLoans',
    title: 'Types of Loans',
    summary:
      'Common loan categories differ by purpose, collateral, tenure, and typical pricing. Browse a category to refine products.',
    guideHref: financeGuidesPath(),
  },
  howInterestWorks: {
    id: 'howInterestWorks',
    title: 'How Loan Interest Rates Work',
    summary:
      'Interest is the cost of borrowing. Most retail loans use a reducing-balance EMI model — early payments lean more toward interest.',
    guideHref: articlePath('emi-calculator-how-to-use'),
  },
  rateFactors: {
    id: 'rateFactors',
    title: 'What Affects Your Loan Interest Rate?',
    summary:
      'The rate you are offered depends on the lender’s assessment of risk and product rules — not only the headline range on a listing.',
    guideHref: financeCreditScorePath(),
  },
  feesAndCharges: {
    id: 'feesAndCharges',
    title: 'Loan Fees and Charges',
    summary:
      'Beyond interest, fees can change total cost. Check what is stored on each product and confirm final charges with the lender.',
    guideHref: financeGuidesPath(),
  },
  eligibility: {
    id: 'eligibility',
    title: 'How Loan Eligibility Works',
    summary:
      'Eligibility is an indicative screen based on income, obligations, credit profile, and product rules. Lenders make the final call.',
    guideHref: financeEligibilityPath(),
  },
  securedVsUnsecured: {
    id: 'securedVsUnsecured',
    title: 'Secured vs Unsecured Loans',
    summary:
      'Secured loans use collateral; unsecured loans rely more on profile and capacity. Terms always depend on the specific product.',
    guideHref: financeGuidesPath('how-to-choose-a-personal-loan'),
  },
  fixedVsFloating: {
    id: 'fixedVsFloating',
    title: 'Fixed vs Floating Interest Rates',
    summary:
      'Fixed rates stay set for an applicable period; floating rates can reset with benchmarks. Confirm reset rules before you choose.',
    guideHref: comparePath('fixed-vs-floating-home-loan'),
  },
  tenureAndCost: {
    id: 'tenureAndCost',
    title: 'How Loan Tenure Affects Cost',
    summary:
      'Longer tenure usually lowers EMI but can raise total interest. Shorter tenure raises EMI and often reduces total interest.',
    guideHref: calculatorHref('emi'),
  },
  compareTotalCost: {
    id: 'compareTotalCost',
    title: 'How to Compare Total Loan Cost',
    summary:
      'Look past the headline rate. Compare interest outlay, fees, tenure, and repayment together — then verify with the lender.',
    guideHref: calculatorHref('emi-rate-compare'),
  },
  prepayment: {
    id: 'prepayment',
    title: 'What Happens When You Prepay a Loan?',
    summary:
      'Prepayment can cut interest or shorten tenure, depending on lender rules. Some products charge foreclosure or part-prepayment fees.',
    guideHref: calculatorHref('loan-prepayment'),
  },
  mistakes: {
    id: 'mistakes',
    title: 'Common Loan Mistakes to Avoid',
    summary:
      'Small oversights — ignoring fees, stretching tenure, or applying too often — can raise cost or hurt approval odds.',
    guideHref: financeGuidesPath('how-to-choose-a-personal-loan'),
  },
};

export function mergeLoanEducationModules(
  overrides?: LoanEducationModulesCms | null,
): Record<LoanEducationModuleId, LoanEducationModuleBase> {
  const out = { ...LOAN_EDUCATION_DEFAULTS };
  if (!overrides) return out;

  (Object.keys(LOAN_EDUCATION_DEFAULTS) as LoanEducationModuleId[]).forEach((id) => {
    const patch = overrides[id];
    if (!patch) return;
    out[id] = {
      ...out[id],
      ...(typeof patch.title === 'string' && patch.title.trim()
        ? { title: patch.title.trim() }
        : {}),
      ...(typeof patch.summary === 'string' && patch.summary.trim()
        ? { summary: patch.summary.trim() }
        : {}),
      ...(patch.guideHref !== undefined ? { guideHref: patch.guideHref?.trim() || null } : {}),
    };
  });

  return out;
}

/** Static card/table/accordion payloads (layout structure stays in code; copy above is CMS-overridable). */

export const RATE_FACTOR_CARDS = [
  {
    title: 'Credit profile',
    body: 'Score band and repayment history influence pricing and approval odds.',
  },
  {
    title: 'Income & stability',
    body: 'Income level, employment type, and consistency affect affordability checks.',
  },
  {
    title: 'Existing obligations',
    body: 'Other EMIs and debt load can tighten eligibility and raise risk pricing.',
  },
  {
    title: 'Loan type & tenure',
    body: 'Product category, amount, and tenure change the rate band lenders quote.',
  },
  {
    title: 'Collateral',
    body: 'Secured products may price differently because of the pledged asset.',
  },
  {
    title: 'Lender policy',
    body: 'Each lender sets its own grids, offers, and underwriting rules.',
  },
] as const;

export const FEE_ROWS = [
  {
    fee: 'Processing fee',
    meaning: 'Charged when the loan is processed or disbursed; often a % or flat amount.',
  },
  {
    fee: 'Foreclosure / prepayment',
    meaning: 'May apply when you close early or pay down principal ahead of schedule.',
  },
  {
    fee: 'Late payment',
    meaning: 'Penalties or higher interest if an EMI is missed — check the product terms.',
  },
  {
    fee: 'Other charges',
    meaning: 'Documentation, conversion, or bounce charges may apply depending on the lender.',
  },
] as const;

export const ELIGIBILITY_STEPS = [
  { title: 'Profile basics', body: 'Age, residency, and employment type vs product rules.' },
  { title: 'Income capacity', body: 'Income and existing EMIs vs the new repayment.' },
  { title: 'Credit assessment', body: 'Credit score and history against lender thresholds.' },
  { title: 'Product limits', body: 'Amount, tenure, and any collateral or document requirements.' },
] as const;

export const SECURED_ROWS = [
  {
    label: 'Collateral',
    secured: 'Asset-backed (e.g. property, gold).',
    unsecured: 'No pledge in the usual sense.',
  },
  {
    label: 'Pricing tendency',
    secured: 'Often lower rates — not guaranteed.',
    unsecured: 'Can be higher for some products.',
  },
  {
    label: 'Main risk',
    secured: 'Asset may be at risk on default.',
    unsecured: 'Credit impact; no asset pledge.',
  },
] as const;

export const COMPARE_COST_CHECKS = [
  {
    title: 'Interest outlay',
    body: 'Total interest over the full tenure, not only the % p.a. label.',
  },
  { title: 'Fees', body: 'Processing and other charges that raise effective cost.' },
  { title: 'EMI affordability', body: 'Monthly payment vs your budget and other obligations.' },
  { title: 'Tenure trade-off', body: 'Shorter vs longer repayment and total interest paid.' },
  { title: 'Prepayment rules', body: 'Flexibility and any foreclosure charges.' },
  { title: 'Verify with lender', body: 'Final sanction terms can differ from published ranges.' },
] as const;

export const PREPAY_ITEMS = [
  {
    title: 'Reduce tenure',
    body: 'Keep EMI similar and finish earlier — often cuts more interest over time.',
  },
  {
    title: 'Reduce EMI',
    body: 'Keep the end date and lower the monthly payment — cash-flow relief, usually less interest saved.',
  },
  {
    title: 'Check charges',
    body: 'Some loans allow free part-prepayment; others levy fees. Confirm before you transfer funds.',
  },
] as const;

export const MISTAKE_ITEMS = [
  {
    title: 'Comparing only the headline rate',
    body: 'Fees and tenure can outweigh a small rate difference.',
  },
  {
    title: 'Stretching tenure too far',
    body: 'Lower EMI can hide a much higher total interest bill.',
  },
  {
    title: 'Ignoring eligibility reality',
    body: 'Applying when income or credit is stretched can lead to rejection and hard enquiries.',
  },
  {
    title: 'Skipping prepayment terms',
    body: 'Exit or part-payment charges affect flexibility if you plan to repay early.',
  },
  {
    title: 'Not verifying final offers',
    body: 'Published ranges are informational — sanction letters set the real terms.',
  },
] as const;

export const INTEREST_FLOW = [
  'Loan amount',
  'Interest rate',
  'Tenure',
  'EMI',
  'Total repayment',
] as const;

export const TENURE_COMPARE = [
  { label: 'Shorter tenure', emi: 'Higher EMI', interest: 'Usually less total interest' },
  { label: 'Longer tenure', emi: 'Lower EMI', interest: 'Usually more total interest' },
] as const;
