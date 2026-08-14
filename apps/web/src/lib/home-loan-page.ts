/**
 * Home Loan planning-page defaults — property / LTV / long-tenure journey
 * (distinct from Personal Loan decision-page helpers).
 */

import {
  calculateEmi,
  calculatePrincipalFromEmi,
  estimateAffordableEmi,
  type EmiResult,
} from '@/lib/emi';
import { calculatorHref, financeEligibilityPath } from '@/lib/finance-routes';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import type { FinanceLoan } from '@/services/finance';
import { toNumber } from '@/components/loans/loan-format';

export const HOME_LOAN_DECISION_HERO_ASSET = '/hub/finance/home-loan-decision-hero.svg?v=2';

/** Clearly labeled illustrative default for planning (not a market rate). */
export const HOME_LOAN_ILLUSTRATIVE_RATE = 8.5;

export const HOME_LOAN_DEFAULT_PROPERTY = 75_00_000;
export const HOME_LOAN_DEFAULT_DOWN_PAYMENT = 15_00_000;
export const HOME_LOAN_DEFAULT_TENURE_YEARS = 20;

export const HOME_LOAN_TENURE_YEARS = [10, 15, 20, 25, 30] as const;

export const HOME_LOAN_DOWN_PAYMENT_SCENARIOS = [10, 20, 30] as const;

export const HOME_LOAN_PROPERTY_PRESETS = [
  { label: '₹30L', value: 30_00_000 },
  { label: '₹50L', value: 50_00_000 },
  { label: '₹75L', value: 75_00_000 },
  { label: '₹1Cr', value: 1_00_00_000 },
] as const;

export type HomeAffordabilityEstimate = {
  comfortableEmi: number;
  loanCapacity: number;
  propertyBudget: number;
};

/**
 * Illustrative affordability using FOIR-style EMI capacity and reverse EMI for loan amount.
 * Not lender eligibility or approval.
 */
export function estimateHomeAffordability(input: {
  monthlyIncome: number;
  existingEmis: number;
  availableDownPayment: number;
  annualRatePercent: number;
  tenureYears: number;
  foirRatio?: number;
}): HomeAffordabilityEstimate | null {
  const comfortableEmi = estimateAffordableEmi({
    monthlyIncome: input.monthlyIncome,
    existingEmis: input.existingEmis,
    foirRatio: input.foirRatio,
  });
  if (comfortableEmi == null || comfortableEmi <= 0) return null;

  const tenureMonths = Math.floor(input.tenureYears * 12);
  const loanCapacity = calculatePrincipalFromEmi({
    monthlyEmi: comfortableEmi,
    annualRatePercent: input.annualRatePercent,
    tenureMonths,
  });
  if (loanCapacity == null || loanCapacity <= 0) return null;

  const downPayment = Number.isFinite(input.availableDownPayment)
    ? Math.max(0, input.availableDownPayment)
    : 0;

  return {
    comfortableEmi,
    loanCapacity,
    propertyBudget: loanCapacity + downPayment,
  };
}

export type IllustrativeOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

/**
 * Illustrative EMI for an offer row using loan requirement + tenure + product starting rate.
 * Never fabricates rates; never silently clamps to product max amount.
 */
export function illustrativeHomeLoanOfferEmi(
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
  if (!result) {
    return { status: 'unavailable', message: 'Unable to calculate' };
  }

  return { status: 'ok', monthlyEmi: result.monthlyEmi, rateUsed: rate };
}

export function clampHomeLoanDownPayment(propertyValue: number, downPayment: number): number {
  if (!Number.isFinite(propertyValue) || propertyValue <= 0) return 0;
  if (!Number.isFinite(downPayment) || downPayment < 0) return 0;
  return Math.min(downPayment, propertyValue);
}

export function homeLoanRequirement(propertyValue: number, downPayment: number): number {
  return Math.max(0, propertyValue - clampHomeLoanDownPayment(propertyValue, downPayment));
}

export function homeLoanLtvPercent(propertyValue: number, loanAmount: number): number | null {
  if (!Number.isFinite(propertyValue) || propertyValue <= 0) return null;
  if (!Number.isFinite(loanAmount) || loanAmount < 0) return null;
  return (loanAmount / propertyValue) * 100;
}

export function formatRateTypeLabel(rateType: string | null | undefined): string {
  const raw = rateType?.trim();
  if (!raw) return 'Not currently available';
  const lower = raw.toLowerCase();
  if (lower.includes('float')) return 'Floating';
  if (lower.includes('fixed')) return 'Fixed';
  if (lower.includes('hybrid') || lower.includes('mix')) return 'Hybrid';
  return raw;
}

export type PrepaymentMode = 'reduce-tenure' | 'reduce-emi';

export type PrepaymentImpact = {
  original: EmiResult;
  revised: EmiResult;
  interestSaved: number;
  monthsSaved: number;
  mode: PrepaymentMode;
};

/**
 * Illustrative prepayment impact using the shared reducing-balance EMI engine.
 * Does not model lender lock-ins or prepayment charges.
 */
export function estimateHomeLoanPrepaymentImpact(input: {
  outstanding: number;
  annualRatePercent: number;
  remainingMonths: number;
  prepaymentAmount: number;
  mode: PrepaymentMode;
}): PrepaymentImpact | null {
  const outstanding = input.outstanding;
  const prepay = input.prepaymentAmount;
  if (
    !Number.isFinite(outstanding) ||
    outstanding <= 0 ||
    !Number.isFinite(prepay) ||
    prepay <= 0 ||
    prepay >= outstanding
  ) {
    return null;
  }

  const original = calculateEmi({
    principal: outstanding,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: input.remainingMonths,
  });
  if (!original) return null;

  const newPrincipal = outstanding - prepay;

  if (input.mode === 'reduce-emi') {
    const revised = calculateEmi({
      principal: newPrincipal,
      annualRatePercent: input.annualRatePercent,
      tenureMonths: input.remainingMonths,
    });
    if (!revised) return null;
    return {
      original,
      revised,
      interestSaved: Math.max(0, original.totalInterest - revised.totalInterest),
      monthsSaved: 0,
      mode: 'reduce-emi',
    };
  }

  // Reduce tenure: keep original EMI, find shortest tenure that amortizes new principal.
  const targetEmi = original.monthlyEmi;
  let bestMonths = input.remainingMonths;
  for (let months = 1; months <= input.remainingMonths; months += 1) {
    const trial = calculateEmi({
      principal: newPrincipal,
      annualRatePercent: input.annualRatePercent,
      tenureMonths: months,
    });
    if (trial && trial.monthlyEmi <= targetEmi + 0.5) {
      bestMonths = months;
      break;
    }
  }

  const revised = calculateEmi({
    principal: newPrincipal,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: bestMonths,
  });
  if (!revised) return null;

  return {
    original,
    revised,
    interestSaved: Math.max(0, original.totalInterest - revised.totalInterest),
    monthsSaved: Math.max(0, input.remainingMonths - bestMonths),
    mode: 'reduce-tenure',
  };
}

export type BalanceTransferImpact = {
  current: EmiResult;
  proposed: EmiResult;
  grossInterestSaved: number;
  transferCost: number;
  netSavings: number;
  monthlyEmiDifference: number;
  breakEvenMonths: number | null;
};

/**
 * Illustrative balance-transfer comparison. Transfer costs are user-entered only.
 */
export function estimateHomeLoanBalanceTransfer(input: {
  outstanding: number;
  currentRatePercent: number;
  newRatePercent: number;
  remainingMonths: number;
  transferCost: number;
}): BalanceTransferImpact | null {
  if (
    !Number.isFinite(input.outstanding) ||
    input.outstanding <= 0 ||
    !Number.isFinite(input.remainingMonths) ||
    input.remainingMonths < 1
  ) {
    return null;
  }

  const current = calculateEmi({
    principal: input.outstanding,
    annualRatePercent: input.currentRatePercent,
    tenureMonths: input.remainingMonths,
  });
  const proposed = calculateEmi({
    principal: input.outstanding,
    annualRatePercent: input.newRatePercent,
    tenureMonths: input.remainingMonths,
  });
  if (!current || !proposed) return null;

  const transferCost = Number.isFinite(input.transferCost) ? Math.max(0, input.transferCost) : 0;
  const grossInterestSaved = current.totalInterest - proposed.totalInterest;
  const netSavings = grossInterestSaved - transferCost;
  const monthlyEmiDifference = current.monthlyEmi - proposed.monthlyEmi;
  const breakEvenMonths =
    monthlyEmiDifference > 0 && transferCost > 0
      ? Math.ceil(transferCost / monthlyEmiDifference)
      : transferCost === 0
        ? 0
        : null;

  return {
    current,
    proposed,
    grossInterestSaved,
    transferCost,
    netSavings,
    monthlyEmiDifference,
    breakEvenMonths,
  };
}

export const HOME_LOAN_INTRO =
  'Compare Home Loan rates, EMI, tenure, fees and eligibility while planning your property purchase.';

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const HOME_LOAN_RELATED_CALCULATORS: ContextualLink[] = [
  calc('home-loan-emi', 'Home Loan EMI Calculator'),
  {
    label: 'Home Affordability Calculator',
    href: '/finance/loans/home-loan#home-loan-affordability',
  },
  {
    label: 'Home Loan Eligibility Calculator',
    href: financeEligibilityPath({ loanType: 'home-loan' }),
  },
  calc('loan-prepayment', 'Loan Prepayment Calculator'),
];

export const HOME_LOAN_RELATED_SECONDARY: ContextualLink[] = [
  {
    label: 'Down Payment Calculator',
    href: '/finance/loans/home-loan#home-loan-down-payment',
  },
  {
    label: 'LTV Calculator',
    href: '/finance/loans/home-loan#home-loan-ltv',
  },
  {
    label: 'Balance Transfer Calculator',
    href: '/finance/loans/home-loan#home-loan-balance-transfer',
  },
];

export const HOME_LOAN_FEE_TYPES = [
  {
    key: 'processing',
    title: 'Processing Fee',
    detail: 'Charged by some lenders when processing an application. Confirm GST and refund rules.',
  },
  {
    key: 'legal',
    title: 'Legal / Technical Valuation',
    detail:
      'Property diligence and valuation charges may apply and vary by lender and property type.',
  },
  {
    key: 'documentation',
    title: 'Documentation Charges',
    detail:
      'Admin or documentation fees may appear on the sanction letter — verify before accepting.',
  },
  {
    key: 'prepayment',
    title: 'Prepayment / Foreclosure',
    detail:
      'Floating-rate products often allow more flexible prepayment than fixed-rate ones, but charges and lock-ins are product-specific.',
  },
  {
    key: 'late',
    title: 'Late Payment Charges',
    detail: 'Missed EMI may attract penal interest or fees per lender policy.',
  },
  {
    key: 'insurance',
    title: 'Insurance-related Costs',
    detail:
      'Some offers include or require insurance. Treat premiums as part of total cost when applicable.',
  },
] as const;

export const HOME_LOAN_APPLICANT_DOCS = [
  'Identity proof',
  'Address proof',
  'Income proof',
  'Bank statements',
  'Employment / business proof',
] as const;

export const HOME_LOAN_PROPERTY_DOCS = [
  'Sale agreement',
  'Title / ownership documents',
  'Approved plans',
  'Tax / property records',
  'Other lender-required documents',
] as const;

export const HOME_LOAN_TIMELINE_STEPS = [
  'Set Property Budget',
  'Plan Down Payment',
  'Estimate Loan Requirement',
  'Compare Home Loans',
  'Check Eligibility',
  'Apply',
  'Applicant Verification',
  'Property / Legal Assessment',
  'Sanction',
  'Disbursement',
] as const;

export const HOME_LOAN_SALARIED_NOTES = [
  'Stable salary credits and employer details are commonly reviewed.',
  'Existing EMIs and FOIR-style affordability checks may affect the sanction amount.',
  'Credit history remains an important pricing and approval factor.',
] as const;

export const HOME_LOAN_SELF_EMPLOYED_NOTES = [
  'Business vintage, income tax returns and banking consistency are often assessed.',
  'Documentation requirements can be broader than for salaried applicants.',
  'Lender policies on self-employed profiles vary — product data takes priority over general guidance.',
] as const;

export const HOME_LOAN_JOINT_NOTES = [
  'A co-applicant may strengthen combined income assessment, subject to lender rules.',
  'Both applicants’ credit profiles and obligations may be reviewed.',
  'Ownership, repayment liability and tax treatment of joint loans are product- and structure-specific.',
] as const;

export const HOME_LOAN_FIXED_POINTS = [
  'Greater payment predictability while the fixed term applies.',
  'Rate stays fixed according to product terms (reset/conditions may still exist).',
  'Prepayment flexibility can be more restricted than floating products — confirm the offer.',
] as const;

export const HOME_LOAN_FLOATING_POINTS = [
  'Rate may change based on benchmark and lender reset rules.',
  'EMI and/or tenure may change when the rate moves.',
  'May become more or less expensive as rates move — outcome is not guaranteed.',
] as const;

export const HOME_LOAN_RATE_DECISION_FACTORS = [
  'Rate',
  'Reset conditions',
  'Benchmark',
  'Spread',
  'Prepayment conditions',
  'Tenure',
] as const;

export const HOME_LOAN_RATE_COMPARE_ITEMS = [
  'Rate',
  'Reset conditions',
  'Benchmark',
  'Spread',
  'Prepayment conditions',
  'Tenure',
] as const;

export const HOME_LOAN_DEFAULT_FAQS = [
  {
    question: 'What is a Home Loan?',
    answer:
      'A Home Loan finances purchase, construction or improvement of residential property. Sanctioned amount, rate, tenure and fees depend on the lender, property and borrower profile.',
  },
  {
    question: 'How much Home Loan can I afford?',
    answer:
      'Affordability depends on income, existing EMIs, down payment capacity, property value and lender assessment. Use the planning tools on this page as estimates — not approvals.',
  },
  {
    question: 'How is Home Loan EMI calculated?',
    answer:
      'EMI is typically calculated on a reducing-balance model using principal, annual interest rate and tenure in months. Illustrative figures on this page use that model with labeled assumptions.',
  },
  {
    question: 'What is LTV?',
    answer:
      'Loan-to-value is the loan amount as a percentage of property value. Lenders may use LTV as one factor when deciding how much of a property’s value they are willing to finance.',
  },
  {
    question: 'How much down payment is required?',
    answer:
      'Down payment requirements vary by lender, property type and ticket size. This page does not invent universal percentages — confirm product terms.',
  },
  {
    question: 'Fixed or floating Home Loan rate: what is the difference?',
    answer:
      'Fixed rates aim for payment predictability for a defined term; floating rates may change with benchmarks. Neither is universally better — compare product terms.',
  },
  {
    question: 'Can I prepay a Home Loan?',
    answer:
      'Many floating-rate home loans allow prepayment with fewer restrictions than fixed-rate products, but charges and lock-ins are product-specific. Confirm the offer letter.',
  },
  {
    question: 'What is a Home Loan balance transfer?',
    answer:
      'A balance transfer moves an existing home loan to another lender, often to seek a lower rate. Savings depend on the new rate, remaining tenure, fees and other charges.',
  },
] as const;
