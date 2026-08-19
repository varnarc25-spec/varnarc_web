/**
 * Loan Against Property planning-page defaults and calculation helpers.
 * Distinct from Home Loan (purchase finance) and Business Loan (cash-flow finance).
 *
 * Property values, LTV and FOIR inputs are illustrative planning values —
 * not guarantees, approvals, or universal regulatory caps.
 */

import {
  calculateEmi,
  calculatePrincipalFromEmi,
  estimateAffordableEmi,
  EMI_LIMITS,
  ILLUSTRATIVE_FOIR_RATIO,
  type EmiResult,
} from '@/lib/emi';
import { calculatorHref } from '@/lib/finance-routes';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import type { FinanceLoan } from '@/services/finance';
import { toNumber } from '@/components/loans/loan-format';
import type { LoanGuideCardModel } from '@/lib/loan-guides';
import {
  estimateHomeLoanPrepaymentImpact,
  type PrepaymentImpact,
  type PrepaymentMode,
} from '@/lib/home-loan-page';

export const LAP_DECISION_HERO_ASSET = '/hub/finance/loan-against-property-decision-hero-v3.png';

export const LAP_ILLUSTRATIVE_RATE = 10.5;
/** User-adjustable illustrative LTV — not a published universal regulatory cap. */
export const LAP_DEFAULT_ILLUSTRATIVE_LTV = 60;
export const LAP_DEFAULT_PROPERTY_VALUE = 1_00_00_000;
export const LAP_DEFAULT_REQUIRED = 40_00_000;
export const LAP_DEFAULT_TENURE_YEARS = 10;
export const LAP_DEFAULT_MONTHLY_INCOME = 1_50_000;
export const LAP_DEFAULT_EXISTING_EMIS = 25_000;
/** Keep planner loan amounts within the shared EMI engine range. */
export const LAP_MAX_REQUIRED_LOAN = EMI_LIMITS.amountMax;
export const LAP_MAX_PROPERTY_VALUE = 100_00_00_000;

/**
 * Normalize typed/pasted money strings (₹, commas, spaces) to a finite number.
 * Returns 0 for empty / non-numeric input so clamps can apply consistently.
 */
export function parseLapMoneyInput(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const cleaned = raw.replace(/[₹,\s]/g, '').trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export type LapPropertyType = 'residential' | 'commercial' | 'industrial' | 'other';
export type LapApplicantType = 'salaried' | 'self_employed' | 'business_owner';
export type LapOwnership = 'sole' | 'joint' | 'inherited' | 'business';

export const LAP_PROPERTY_TYPES: Array<{ id: LapPropertyType; label: string }> = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'industrial', label: 'Industrial / Other' },
  { id: 'other', label: 'Other' },
];

export const LAP_APPLICANT_TYPES: Array<{ id: LapApplicantType; label: string }> = [
  { id: 'salaried', label: 'Salaried' },
  { id: 'self_employed', label: 'Self-employed' },
  { id: 'business_owner', label: 'Business Owner' },
];

export const LAP_OWNERSHIP_OPTIONS: Array<{ id: LapOwnership; label: string }> = [
  { id: 'sole', label: 'Self-owned' },
  { id: 'joint', label: 'Jointly owned' },
  { id: 'inherited', label: 'Inherited / Family' },
  { id: 'business', label: 'Business-owned' },
];

export function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function clampPercent(n: number, max = 100): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
}

/** LTV% = loan ÷ property value × 100 */
export function lapLtvPercent(propertyValue: number, loanAmount: number): number | null {
  const value = clampNonNegative(propertyValue);
  const loan = clampNonNegative(loanAmount);
  if (value <= 0) return null;
  return (loan / value) * 100;
}

export type LapBorrowingCapacity = {
  propertyValue: number;
  illustrativeLtvPercent: number;
  indicativeMaxLoan: number;
  requestedLoan: number;
  headroom: number;
  exceedsCapacity: boolean;
  remainingPropertyValue: number;
};

export function estimateLapBorrowingCapacity(input: {
  propertyValue: number;
  illustrativeLtvPercent: number;
  requestedLoan: number;
}): LapBorrowingCapacity | null {
  const value = clampNonNegative(input.propertyValue);
  const ltv = clampPercent(input.illustrativeLtvPercent);
  const requested = clampNonNegative(input.requestedLoan);
  if (value <= 0 || ltv <= 0) return null;
  const indicativeMaxLoan = value * (ltv / 100);
  return {
    propertyValue: value,
    illustrativeLtvPercent: ltv,
    indicativeMaxLoan,
    requestedLoan: requested,
    headroom: indicativeMaxLoan - requested,
    exceedsCapacity: requested > indicativeMaxLoan + 0.5,
    remainingPropertyValue: Math.max(0, value - indicativeMaxLoan),
  };
}

export type LapObligationResult = {
  monthlyIncome: number;
  existingEmis: number;
  otherObligations: number;
  proposedEmi: number;
  totalMonthlyDebt: number;
  remainingMonthlyIncome: number;
  obligationRatioPercent: number | null;
};

/** Obligation ratio = (existing + other + proposed) ÷ income × 100. Not a universal FOIR cap. */
export function estimateLapObligationRatio(input: {
  monthlyIncome: number;
  existingEmis: number;
  otherObligations?: number;
  proposedEmi: number;
}): LapObligationResult | null {
  const income = clampNonNegative(input.monthlyIncome);
  const existing = clampNonNegative(input.existingEmis);
  const other = clampNonNegative(input.otherObligations ?? 0);
  const proposed = clampNonNegative(input.proposedEmi);
  if (income <= 0) return null;
  const totalMonthlyDebt = existing + other + proposed;
  return {
    monthlyIncome: income,
    existingEmis: existing,
    otherObligations: other,
    proposedEmi: proposed,
    totalMonthlyDebt,
    remainingMonthlyIncome: income - totalMonthlyDebt,
    obligationRatioPercent: (totalMonthlyDebt / income) * 100,
  };
}

export type LapIncomeCapacity = {
  comfortableMonthlyEmi: number;
  illustrativeLoanFromIncome: number | null;
  foirRatioUsed: number;
};

export function estimateLapIncomeCapacity(input: {
  monthlyIncome: number;
  existingEmis: number;
  otherObligations?: number;
  annualRatePercent: number;
  tenureMonths: number;
  foirRatio?: number;
}): LapIncomeCapacity | null {
  const other = clampNonNegative(input.otherObligations ?? 0);
  const comfortable = estimateAffordableEmi({
    monthlyIncome: input.monthlyIncome,
    existingEmis: clampNonNegative(input.existingEmis) + other,
    foirRatio: input.foirRatio ?? ILLUSTRATIVE_FOIR_RATIO,
  });
  if (comfortable == null) return null;
  const loan =
    comfortable > 0
      ? calculatePrincipalFromEmi({
          monthlyEmi: comfortable,
          annualRatePercent: input.annualRatePercent,
          tenureMonths: input.tenureMonths,
        })
      : 0;
  return {
    comfortableMonthlyEmi: comfortable,
    illustrativeLoanFromIncome: loan,
    foirRatioUsed: input.foirRatio ?? ILLUSTRATIVE_FOIR_RATIO,
  };
}

export function estimateLapEmi(input: {
  loanAmount: number;
  annualRatePercent: number;
  tenureMonths: number;
}): EmiResult | null {
  return calculateEmi({
    principal: clampNonNegative(input.loanAmount),
    annualRatePercent: input.annualRatePercent,
    tenureMonths: Math.floor(input.tenureMonths),
  });
}

export type LapTenureCompareRow = {
  years: number;
  months: number;
  emi: EmiResult | null;
};

export function compareLapTenures(input: {
  loanAmount: number;
  annualRatePercent: number;
  yearOptions?: number[];
}): LapTenureCompareRow[] {
  const years = input.yearOptions ?? [5, 10, 15, 20];
  return years.map((y) => {
    const months = y * 12;
    return {
      years: y,
      months,
      emi: estimateLapEmi({
        loanAmount: input.loanAmount,
        annualRatePercent: input.annualRatePercent,
        tenureMonths: months,
      }),
    };
  });
}

export type LapTotalCost = {
  principal: number;
  totalInterest: number;
  knownFees: number | null;
  feesKnown: boolean;
  totalFinancingCost: number;
  totalRepayment: number;
};

export function estimateLapTotalCost(input: {
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
  knownFees?: number | null;
}): LapTotalCost | null {
  const emi = estimateLapEmi({
    loanAmount: input.principal,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: input.tenureMonths,
  });
  if (!emi) return null;
  const feesKnown = input.knownFees != null && Number.isFinite(input.knownFees);
  const fees = feesKnown ? clampNonNegative(input.knownFees as number) : null;
  const feeAmount = fees ?? 0;
  return {
    principal: clampNonNegative(input.principal),
    totalInterest: emi.totalInterest,
    knownFees: fees,
    feesKnown,
    totalFinancingCost: emi.totalInterest + feeAmount,
    totalRepayment: emi.totalRepayment + feeAmount,
  };
}

export function estimateLapPrepaymentImpact(input: {
  outstanding: number;
  annualRatePercent: number;
  remainingMonths: number;
  prepaymentAmount: number;
  mode: PrepaymentMode;
  knownCharge?: number | null;
}): (PrepaymentImpact & { knownCharge: number | null; netSavings: number | null }) | null {
  const base = estimateHomeLoanPrepaymentImpact(input);
  if (!base) return null;
  const chargeKnown = input.knownCharge != null && Number.isFinite(input.knownCharge);
  const charge = chargeKnown ? clampNonNegative(input.knownCharge as number) : null;
  return {
    ...base,
    knownCharge: charge,
    netSavings: charge != null ? Math.max(0, base.interestSaved - charge) : null,
  };
}

export type IllustrativeOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

export function illustrativeLapOfferEmi(
  loan: FinanceLoan,
  selectedAmount: number,
  selectedTenureMonths: number,
): IllustrativeOfferEmi {
  const rate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  if (rate == null) return { status: 'unavailable', message: 'Rate not available' };
  const minAmount = toNumber(loan.loanAmountMin);
  const maxAmount = toNumber(loan.loanAmountMax) ?? toNumber(loan.maxAmount);
  if (
    (minAmount != null && selectedAmount < minAmount) ||
    (maxAmount != null && selectedAmount > maxAmount)
  ) {
    return { status: 'unavailable', message: 'Selected amount outside displayed product range' };
  }
  if (loan.tenureMin != null && selectedTenureMonths < loan.tenureMin) {
    return { status: 'unavailable', message: 'Selected tenure outside product range' };
  }
  if (loan.tenureMax != null && selectedTenureMonths > loan.tenureMax) {
    return { status: 'unavailable', message: 'Selected tenure outside product range' };
  }
  const result = calculateEmi({
    principal: selectedAmount,
    annualRatePercent: rate,
    tenureMonths: selectedTenureMonths,
  });
  if (!result) return { status: 'unavailable', message: 'Unable to calculate' };
  return { status: 'ok', monthlyEmi: result.monthlyEmi, rateUsed: rate };
}

export type { PrepaymentImpact, PrepaymentMode, EmiResult };

export const LAP_INTRO =
  'Estimate how much you may be able to borrow against an owned property, understand LTV and repayment capacity, then compare available LAP options.';

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const LAP_RELATED_CALCULATORS: ContextualLink[] = [
  calc('loan-against-property-emi', 'LAP EMI Calculator'),
  {
    label: 'LTV Calculator',
    href: '/finance/loans/loan-against-property#lap-ltv',
  },
  {
    label: 'Repayment Capacity',
    href: '/finance/loans/loan-against-property#lap-foir',
  },
  {
    label: 'Loan Eligibility Calculator',
    href: '/finance/eligibility',
  },
];

export const LAP_RELATED_SECONDARY: ContextualLink[] = [
  calc('loan-prepayment', 'Prepayment Calculator'),
  calc('emi', 'EMI Calculator'),
  {
    label: 'Compare Home Loans',
    href: '/finance/loans/home-loan',
  },
];

export const LAP_APPLICATION_STEPS = [
  'Estimate property value',
  'Decide loan requirement',
  'Calculate LTV',
  'Check repayment capacity',
  'Compare LAP options',
  'Prepare applicant documents',
  'Prepare property documents',
  'Apply',
  'Financial assessment',
  'Legal verification',
  'Technical / property valuation',
  'Lender decision',
  'Documentation',
  'Disbursement',
] as const;

export const LAP_VALUATION_STEPS = [
  'Property details',
  'Document review',
  'Physical / technical assessment',
  'Market / valuation assessment',
  'Eligible property value',
  'Loan assessment',
] as const;

export const LAP_NONPAYMENT_STEPS = [
  'Payment Due',
  'Overdue',
  'Lender Communication',
  'Notice / Contractual Process',
  'Recovery Measures',
  'Enforcement Against Secured Property Where Applicable',
] as const;

export const LAP_DEFAULT_GUIDES: LoanGuideCardModel[] = [
  {
    id: 'lap-guide-valuation',
    title: 'How Property Valuation Works for LAP',
    href: '/finance/loans/loan-against-property#lap-valuation',
    excerpt: 'Why lender valuation can differ from an owner’s expected market value.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/valuation.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-ltv',
    title: 'LAP LTV Explained',
    href: '/finance/loans/loan-against-property#lap-ltv',
    excerpt: 'Loan-to-value compares the loan with property value — illustrative planning only.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/ltv.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-eligibility',
    title: 'LAP Eligibility Factors',
    href: '/finance/loans/loan-against-property#lap-eligibility',
    excerpt: 'Property, applicant and loan profile factors lenders may assess.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/eligibility.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-documents',
    title: 'LAP Documents Checklist',
    href: '/finance/loans/loan-against-property#lap-documents',
    excerpt: 'Common KYC, income and property ownership documentation themes.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/documents.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-residential-commercial',
    title: 'Residential vs Commercial Property for LAP',
    href: '/finance/loans/loan-against-property#lap-property-type',
    excerpt: 'Neutral comparison of property-type themes — acceptance is lender-specific.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/residential-vs-commercial.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-vs-home',
    title: 'LAP vs Home Loan',
    href: '/finance/loans/loan-against-property#lap-compare',
    excerpt: 'Owned-property collateral versus property-purchase financing.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/vs-home.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-prepayment',
    title: 'How Prepayment Affects LAP',
    href: '/finance/loans/loan-against-property#lap-prepayment',
    excerpt: 'Illustrative interest and tenure impact of an extra payment.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/prepayment.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'loan-against-property',
  },
  {
    id: 'lap-guide-verification',
    title: 'Legal and Technical Property Verification',
    href: '/finance/loans/loan-against-property#lap-legal',
    excerpt: 'Title diligence and technical assessment themes in secured lending.',
    categoryLabel: 'Loan Against Property',
    imageUrl: '/hub/finance/loan-against-property-guides/verification.svg?v=2',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'loan-against-property',
  },
];

export const LAP_DEFAULT_FAQS = [
  {
    question: 'What is a Loan Against Property?',
    answer:
      'A Loan Against Property is secured credit where an owned residential or commercial property may be used as collateral, subject to valuation, legal/technical checks and lender policy. This page is a planning tool, not an approval.',
  },
  {
    question: 'How much can I borrow against my property?',
    answer:
      'Indicative capacity is often framed using property value and applicable LTV, alongside repayment-capacity assessment. Actual sanction depends on appraisal, underwriting and product limits.',
  },
  {
    question: 'What is LTV in LAP?',
    answer:
      'Loan-to-value compares the loan amount with the valued property. Applicable LTV depends on lender policy and any applicable regulatory requirements — confirm with official sources and the lender.',
  },
  {
    question: 'Can commercial property be used?',
    answer:
      'Some products may consider commercial property. Acceptance, valuation and documentation vary by lender — do not assume every product accepts every property type.',
  },
  {
    question: 'Can jointly owned property be used?',
    answer:
      'Joint ownership may require co-owner involvement or consent under lender process. Ownership alone does not automatically equal borrowing eligibility.',
  },
  {
    question: 'How is property value determined?',
    answer:
      'Lenders typically use their valuation and diligence process. An owner’s expected market value is a planning input, not necessarily the eligible value used for lending.',
  },
  {
    question: 'Does income affect LAP eligibility?',
    answer:
      'Yes. Even with collateral, lenders commonly assess repayment capacity using income, existing obligations and other underwriting factors.',
  },
  {
    question: 'What happens if LAP payments are missed?',
    answer:
      'Overdue dues may trigger communication and contractual processes. Exact timelines and remedies depend on the agreement, applicable law and lender policy — including possible enforcement against the secured property where applicable.',
  },
  {
    question: 'How is LAP different from a Home Loan?',
    answer:
      'Home loans typically finance property purchase. LAP uses already-owned property as security for a loan that may serve other purposes, subject to product terms.',
  },
] as const;
