/**
 * Business Loan planning-page defaults and calculation helpers.
 * Distinct from Personal / Home / Car / Education loan decision helpers.
 */

import { calculateEmi, type EmiResult } from '@/lib/emi';
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

export const BUSINESS_LOAN_DECISION_HERO_ASSET = '/hub/finance/business-loan-decision-hero.png?v=3';

export const BUSINESS_LOAN_ILLUSTRATIVE_RATE = 12;

export const BUSINESS_LOAN_DEFAULT_FUNDING = 15_00_000;
export const BUSINESS_LOAN_DEFAULT_TENURE_YEARS = 3;
export const BUSINESS_LOAN_DEFAULT_REVENUE = 8_00_000;
export const BUSINESS_LOAN_DEFAULT_OP_EXPENSES = 5_50_000;
export const BUSINESS_LOAN_DEFAULT_EXISTING_DEBT = 40_000;
export const BUSINESS_LOAN_DEFAULT_ANNUAL_TURNOVER = 1_00_00_000;
export const BUSINESS_LOAN_DEFAULT_CONTRIBUTION_MARGIN = 25;
export const BUSINESS_LOAN_DEFAULT_VINTAGE_YEARS = 3;

export type BusinessFundingPurpose =
  | 'working_capital'
  | 'inventory'
  | 'equipment'
  | 'expansion'
  | 'renovation'
  | 'marketing'
  | 'new_branch'
  | 'cash_flow_gap'
  | 'refinancing'
  | 'other';

export type BusinessEntityType =
  'proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'other';

export type BusinessFacilityHint = 'working_capital' | 'term_loan' | 'explore_both';

export type BusinessSecurityMode = 'secured' | 'unsecured' | 'unsure';

export type CashFlowHeadroom =
  'more_repayment_headroom' | 'limited_repayment_headroom' | 'potential_cash_flow_pressure';

export const BUSINESS_FUNDING_PURPOSES: Array<{
  id: BusinessFundingPurpose;
  label: string;
  summary: string;
  facilityHint: BusinessFacilityHint;
}> = [
  {
    id: 'working_capital',
    label: 'Working Capital',
    summary: 'Manage everyday operating requirements.',
    facilityHint: 'working_capital',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    summary: 'Purchase stock or raw materials.',
    facilityHint: 'working_capital',
  },
  {
    id: 'equipment',
    label: 'Machinery / Equipment',
    summary: 'Finance equipment or production assets.',
    facilityHint: 'term_loan',
  },
  {
    id: 'expansion',
    label: 'Expansion',
    summary: 'Increase capacity or grow operations.',
    facilityHint: 'term_loan',
  },
  {
    id: 'new_branch',
    label: 'New Branch',
    summary: 'Support a new location or capacity build-out.',
    facilityHint: 'term_loan',
  },
  {
    id: 'cash_flow_gap',
    label: 'Cash-flow Gap',
    summary: 'Bridge timing differences between receivables and expenses.',
    facilityHint: 'working_capital',
  },
  {
    id: 'renovation',
    label: 'Renovation',
    summary: 'Improve office, store or business premises.',
    facilityHint: 'term_loan',
  },
  {
    id: 'marketing',
    label: 'Marketing / Growth',
    summary: 'Fund customer acquisition or growth initiatives.',
    facilityHint: 'term_loan',
  },
  {
    id: 'refinancing',
    label: 'Debt Refinancing',
    summary: 'Replace existing business borrowing where appropriate.',
    facilityHint: 'explore_both',
  },
  {
    id: 'other',
    label: 'Other',
    summary: 'Other business financing needs.',
    facilityHint: 'explore_both',
  },
];

export function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Practical planner bounds (shared EMI engine still enforces EMI_LIMITS). */
export const BUSINESS_LOAN_PLANNER_LIMITS = {
  fundingMax: 10_00_00_000,
  rateMax: 50,
  tenureYearsMin: 1,
  tenureYearsMax: 15,
  revenueMax: 100_00_00_000,
  contributionMarginMax: 100,
  vintageYearsMax: 50,
} as const;

export function clampBusinessFunding(n: number): number {
  return Math.min(BUSINESS_LOAN_PLANNER_LIMITS.fundingMax, clampNonNegative(n));
}

export function clampBusinessRate(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(BUSINESS_LOAN_PLANNER_LIMITS.rateMax, n);
}

export function clampBusinessTenureYears(n: number): number {
  if (!Number.isFinite(n)) return BUSINESS_LOAN_PLANNER_LIMITS.tenureYearsMin;
  return Math.max(
    BUSINESS_LOAN_PLANNER_LIMITS.tenureYearsMin,
    Math.min(BUSINESS_LOAN_PLANNER_LIMITS.tenureYearsMax, Math.floor(n)),
  );
}

export function clampContributionMarginPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  return Math.min(BUSINESS_LOAN_PLANNER_LIMITS.contributionMarginMax, n);
}

export function breakEvenValidationMessage(contributionMarginPercent: number): string | null {
  if (!Number.isFinite(contributionMarginPercent)) {
    return 'Enter a valid contribution margin between 0 and 100%.';
  }
  if (contributionMarginPercent <= 0) {
    return 'Contribution margin must be greater than 0% to estimate additional sales (division by zero is not allowed).';
  }
  if (contributionMarginPercent > 100) {
    return 'Contribution margin cannot exceed 100%.';
  }
  return null;
}

/** Compact planner micro-summary amounts (e.g. ₹15L). */
export function formatCompactFundingInr(amount: number): string {
  const n = clampNonNegative(amount);
  if (n >= 1_00_00_000) {
    const cr = n / 1_00_00_000;
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(1)}Cr`;
  }
  if (n >= 1_00_000) {
    const lakh = n / 1_00_000;
    return `₹${Number.isInteger(lakh) ? lakh : lakh.toFixed(1)}L`;
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export const BUSINESS_VINTAGE_TIMELINE = [
  { id: 'new', label: 'New', minYears: 0, maxYears: 0.99 },
  { id: '1y', label: '1 Year', minYears: 1, maxYears: 1.99 },
  { id: '2y', label: '2 Years', minYears: 2, maxYears: 2.99 },
  { id: '3y', label: '3 Years', minYears: 3, maxYears: 4.99 },
  { id: '5y', label: '5+ Years', minYears: 5, maxYears: 999 },
] as const;

export function vintageTimelineStepId(vintageYears: number): string {
  const y = clampNonNegative(vintageYears);
  const match = BUSINESS_VINTAGE_TIMELINE.find((s) => y >= s.minYears && y <= s.maxYears);
  return match?.id ?? 'new';
}

export function facilityHintForPurpose(purpose: BusinessFundingPurpose): BusinessFacilityHint {
  return BUSINESS_FUNDING_PURPOSES.find((p) => p.id === purpose)?.facilityHint ?? 'explore_both';
}

export function facilityHintLabel(hint: BusinessFacilityHint): string {
  switch (hint) {
    case 'working_capital':
      return 'Working-capital financing may be worth exploring.';
    case 'term_loan':
      return 'A term-loan structure may be worth exploring.';
    case 'explore_both':
      return 'Both working-capital and term structures may be worth exploring depending on lender products.';
  }
}

export type BusinessCashFlowResult = {
  operatingSurplusBeforeEmi: number;
  surplusAfterProposedEmi: number;
  headroom: CashFlowHeadroom;
};

export function assessBusinessCashFlow(input: {
  monthlyRevenue: number;
  monthlyOperatingExpenses: number;
  existingMonthlyDebt: number;
  proposedMonthlyEmi: number;
  otherCommitments?: number;
}): BusinessCashFlowResult {
  const revenue = clampNonNegative(input.monthlyRevenue);
  const expenses = clampNonNegative(input.monthlyOperatingExpenses);
  const existing = clampNonNegative(input.existingMonthlyDebt);
  const other = clampNonNegative(input.otherCommitments ?? 0);
  const emi = clampNonNegative(input.proposedMonthlyEmi);
  const operatingSurplusBeforeEmi = revenue - expenses - existing - other;
  const surplusAfterProposedEmi = operatingSurplusBeforeEmi - emi;

  let headroom: CashFlowHeadroom;
  if (surplusAfterProposedEmi >= emi * 0.5 && surplusAfterProposedEmi > 0) {
    headroom = 'more_repayment_headroom';
  } else if (surplusAfterProposedEmi >= 0) {
    headroom = 'limited_repayment_headroom';
  } else {
    headroom = 'potential_cash_flow_pressure';
  }

  return { operatingSurplusBeforeEmi, surplusAfterProposedEmi, headroom };
}

export function cashFlowHeadroomLabel(h: CashFlowHeadroom): string {
  switch (h) {
    case 'more_repayment_headroom':
      return 'More repayment headroom';
    case 'limited_repayment_headroom':
      return 'Limited repayment headroom';
    case 'potential_cash_flow_pressure':
      return 'Potential cash-flow pressure';
  }
}

export type RevenueStressScenario = {
  id: string;
  label: string;
  revenueMultiplier: number;
};

export const BUSINESS_REVENUE_STRESS_SCENARIOS: RevenueStressScenario[] = [
  { id: 'current', label: 'Current Revenue', revenueMultiplier: 1 },
  { id: 'minus10', label: 'Revenue −10%', revenueMultiplier: 0.9 },
  { id: 'minus20', label: 'Revenue −20%', revenueMultiplier: 0.8 },
];

export function stressTestBusinessCashFlow(input: {
  monthlyRevenue: number;
  monthlyOperatingExpenses: number;
  existingMonthlyDebt: number;
  proposedMonthlyEmi: number;
  otherCommitments?: number;
  customRevenue?: number | null;
}): Array<BusinessCashFlowResult & { id: string; label: string; revenue: number }> {
  const scenarios = [...BUSINESS_REVENUE_STRESS_SCENARIOS];
  const results = scenarios.map((s) => {
    const revenue = clampNonNegative(input.monthlyRevenue) * s.revenueMultiplier;
    return {
      id: s.id,
      label: s.label,
      revenue,
      ...assessBusinessCashFlow({ ...input, monthlyRevenue: revenue }),
    };
  });
  if (input.customRevenue != null && Number.isFinite(input.customRevenue)) {
    const revenue = clampNonNegative(input.customRevenue);
    results.push({
      id: 'custom',
      label: 'Custom Revenue',
      revenue,
      ...assessBusinessCashFlow({ ...input, monthlyRevenue: revenue }),
    });
  }
  return results;
}

export function turnoverLoanRatio(annualTurnover: number, requestedLoan: number): number | null {
  const t = clampNonNegative(annualTurnover);
  const loan = clampNonNegative(requestedLoan);
  if (t <= 0) return null;
  return (loan / t) * 100;
}

export type DscrResult = {
  dscr: number;
  annualDebtService: number;
  calculationBasis: string;
};

export function calculateIllustrativeDscr(input: {
  annualCashAvailableForDebtService: number;
  annualExistingDebtPayments: number;
  proposedAnnualLoanPayments: number;
}): DscrResult | null {
  const cash = clampNonNegative(input.annualCashAvailableForDebtService);
  const existing = clampNonNegative(input.annualExistingDebtPayments);
  const proposed = clampNonNegative(input.proposedAnnualLoanPayments);
  const debtService = existing + proposed;
  if (debtService <= 0) return null;
  return {
    dscr: cash / debtService,
    annualDebtService: debtService,
    calculationBasis:
      'Illustrative DSCR = cash available for debt service ÷ (existing + proposed annual debt payments). Lender definitions and expectations vary by product and underwriting policy.',
  };
}

/** Additional monthly sales needed to cover EMI at a given contribution margin %. */
export function breakEvenAdditionalSales(input: {
  proposedMonthlyEmi: number;
  contributionMarginPercent: number;
}): number | null {
  const emi = clampNonNegative(input.proposedMonthlyEmi);
  const margin = input.contributionMarginPercent;
  if (!Number.isFinite(margin) || margin <= 0 || margin > 100) return null;
  return emi / (margin / 100);
}

export type TotalBorrowingCost = {
  loanAmount: number;
  totalInterest: number;
  knownFees: number | null;
  feesKnown: boolean;
  totalFinancingCost: number;
  totalRepayment: number;
};

export function estimateTotalBorrowingCost(input: {
  loanAmount: number;
  annualRatePercent: number;
  tenureYears: number;
  /** null/undefined = fees not currently available (do not imply “no fee”). */
  knownFees?: number | null;
}): TotalBorrowingCost | null {
  const months = Math.floor(input.tenureYears * 12);
  const emi = calculateEmi({
    principal: input.loanAmount,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: months,
  });
  if (!emi) return null;
  const feesKnown = input.knownFees != null && Number.isFinite(input.knownFees);
  const fees = feesKnown ? clampNonNegative(input.knownFees as number) : null;
  const feeAmount = fees ?? 0;
  return {
    loanAmount: emi.principal,
    totalInterest: emi.totalInterest,
    knownFees: fees,
    feesKnown,
    totalFinancingCost: emi.totalInterest + feeAmount,
    totalRepayment: emi.totalRepayment + feeAmount,
  };
}

export function estimateBusinessLoanEmi(input: {
  loanAmount: number;
  annualRatePercent: number;
  tenureYears: number;
}): EmiResult | null {
  const months = Math.floor(input.tenureYears * 12);
  if (months < 1) return null;
  return calculateEmi({
    principal: input.loanAmount,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: months,
  });
}

/** Month-tenure wrapper for shared EMI engine (regression / calculators). */
export function estimateBusinessLoanEmiMonths(input: {
  loanAmount: number;
  annualRatePercent: number;
  tenureMonths: number;
}): EmiResult | null {
  return calculateEmi({
    principal: input.loanAmount,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: Math.floor(input.tenureMonths),
  });
}

export function tenureComparisonRows(input: {
  loanAmount: number;
  annualRatePercent: number;
  tenureYearsList: number[];
}): Array<{ tenureYears: number; emi: EmiResult | null }> {
  return input.tenureYearsList.map((tenureYears) => ({
    tenureYears,
    emi: estimateBusinessLoanEmi({
      loanAmount: input.loanAmount,
      annualRatePercent: input.annualRatePercent,
      tenureYears,
    }),
  }));
}

export function estimateBusinessLoanPrepaymentImpact(input: {
  outstanding: number;
  annualRatePercent: number;
  remainingMonths: number;
  prepaymentAmount: number;
  mode: PrepaymentMode;
}): PrepaymentImpact | null {
  return estimateHomeLoanPrepaymentImpact(input);
}

export type IllustrativeOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

export function illustrativeBusinessLoanOfferEmi(
  loan: FinanceLoan,
  selectedAmount: number,
  selectedTenureMonths: number,
): IllustrativeOfferEmi {
  const rate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  if (rate == null) {
    return { status: 'unavailable', message: 'Rate not available' };
  }
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

export const BUSINESS_LOAN_INTRO =
  'Estimate your business funding requirement, understand repayment capacity and compare financing options based on your business needs.';

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const BUSINESS_LOAN_RELATED_CALCULATORS: ContextualLink[] = [
  calc('business-loan-emi', 'Business Loan EMI Calculator'),
  {
    label: 'Business Loan Eligibility Calculator',
    href: '/finance/eligibility',
  },
  {
    label: 'DSCR Calculator',
    href: '/finance/loans/business-loan#bl-dscr',
  },
  {
    label: 'Business Cash Flow Calculator',
    href: '/finance/loans/business-loan#bl-cash-flow',
  },
];

export const BUSINESS_LOAN_RELATED_SECONDARY: ContextualLink[] = [
  calc('loan-prepayment', 'Prepayment Calculator'),
  {
    label: 'Working Capital Planner',
    href: '/finance/loans/business-loan#bl-wc-vs-term',
  },
  {
    label: 'Break-even Impact',
    href: '/finance/loans/business-loan#bl-break-even',
  },
];

export const BUSINESS_LOAN_TIMELINE_STEPS = [
  'Define Funding Need',
  'Prepare Business Financials',
  'Compare Financing Options',
  'Check Eligibility',
  'Prepare Documents',
  'Submit Application',
  'Lender Verification',
  'Business / Financial Assessment',
  'Collateral Assessment if applicable',
  'Lender Decision',
  'Documentation',
  'Disbursement',
] as const;

export const BUSINESS_LOAN_DEFAULT_GUIDES: LoanGuideCardModel[] = [
  {
    id: 'bl-guide-wc-term',
    title: 'Working Capital vs Term Loan',
    href: '/finance/loans/business-loan#bl-wc-vs-term',
    excerpt: 'When short-term operating needs differ from planned investment financing.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/working-capital.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-eligibility',
    title: 'Business Loan Eligibility',
    href: '/finance/loans/business-loan#bl-eligibility',
    excerpt: 'Business, financial, borrowing, promoter and security profiles.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/eligibility.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-dscr',
    title: 'What Is DSCR?',
    href: '/finance/loans/business-loan#bl-dscr',
    excerpt: 'Plain-language debt service coverage for business repayment planning.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/dscr.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-turnover',
    title: 'Turnover and Profitability',
    href: '/finance/loans/business-loan#bl-turnover',
    excerpt: 'Why scale and surplus are different — and how both inform repayment planning.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/turnover.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-docs',
    title: 'Business Loan Documents',
    href: '/finance/loans/business-loan#bl-documents',
    excerpt: 'Identity, financial, tax and security documents commonly requested.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/documents.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-msme',
    title: 'MSME / Government Finance',
    href: '/finance/loans/business-loan#bl-msme-support',
    excerpt: 'Government and MSME support concepts with official sources.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/msme.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 6,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-secured',
    title: 'Secured vs Unsecured',
    href: '/finance/loans/business-loan#bl-secured',
    excerpt: 'How collateral and cash-flow underwriting can differ by facility type.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/secured.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'business-loan',
  },
  {
    id: 'bl-guide-prepay',
    title: 'Business Loan Prepayment',
    href: '/finance/loans/business-loan#bl-prepayment',
    excerpt: 'Illustrative interest and tenure impact when you repay early.',
    categoryLabel: 'Business Loan',
    imageUrl: '/hub/finance/business-loan-guides/cash-flow.svg',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'business-loan',
  },
];

export const BUSINESS_LOAN_DEFAULT_FAQS = [
  {
    question: 'What is a Business Loan?',
    answer:
      'A business loan is financing underwritten primarily on business need, cash flow and documentation. Terms vary by lender and product — this page is a planning tool, not an approval.',
  },
  {
    question: 'What can a Business Loan be used for?',
    answer:
      'Depending on the product, funds may support working capital, inventory, equipment, expansion, renovation or other business purposes. Coverage is product-specific.',
  },
  {
    question: 'What is the difference between working capital and a term loan?',
    answer:
      'Working-capital facilities typically address short-term operating needs. Term loans typically fund planned investments repaid over an agreed tenure. Exact product structures vary by lender.',
  },
  {
    question: 'What is DSCR?',
    answer:
      'Debt Service Coverage Ratio compares cash available for debt service with debt obligations. Lender definitions and expectations vary — illustrative DSCR on this page is not an approval metric.',
  },
  {
    question: 'How does business turnover affect eligibility?',
    answer:
      'Turnover can help lenders understand business scale, but turnover alone does not determine eligibility. Profitability, cash flow, vintage and credit profile also matter.',
  },
  {
    question: 'Can a Business Loan be unsecured?',
    answer:
      'Some products are unsecured and rely more on business performance and credit profile. Others require collateral. Do not assume secured always means a lower rate.',
  },
  {
    question: 'What is Udyam registration?',
    answer:
      'Udyam is the Government of India MSME registration framework. Classification and benefits are change-sensitive — verify on the official Udyam portal. Varnarc is not the registration portal.',
  },
  {
    question: 'Are there government schemes for MSMEs?',
    answer:
      'Government and credit-guarantee programmes may be relevant for some enterprises. Confirm current rules on official sources — Varnarc does not approve or guarantee scheme benefits.',
  },
  {
    question: 'What documents may be required?',
    answer:
      'Lenders may request business identity, promoter KYC, financial statements, bank statements, tax filings and security documents where applicable. Exact lists vary.',
  },
  {
    question: 'Can I prepay a Business Loan?',
    answer:
      'Many products allow prepayment subject to lender policy and any disclosed charges. Confirm foreclosure/prepayment terms on the offer letter before relying on savings estimates.',
  },
] as const;
