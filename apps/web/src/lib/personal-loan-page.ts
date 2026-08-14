/**
 * Personal Loan decision-page defaults (intent-specific; not hub education).
 */

import { calculateEmi, type EmiResult } from '@/lib/emi';
import { calculatorHref } from '@/lib/finance-routes';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import type { FinanceLoan } from '@/services/finance';
import { toNumber } from '@/components/loans/loan-format';

export const PERSONAL_LOAN_DECISION_HERO_ASSET = '/hub/finance/personal-loan-decision-hero.svg?v=3';

export type IllustrativeOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

/**
 * Illustrative EMI for an offer row using user amount + tenure + product starting rate.
 * Never fabricates rates; never silently uses max product amount.
 */
export function illustrativePersonalLoanOfferEmi(
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

export const PERSONAL_LOAN_INTRO =
  'Compare personal loan rates, monthly EMI, fees, tenure and eligibility from available lenders.';

export const PERSONAL_LOAN_HERO_BENEFITS = [
  'Compare lenders',
  'Estimate EMI',
  'Review fees and repayment terms',
] as const;

/** Preset amounts for EMI calculator chips (INR). */
export const PERSONAL_LOAN_EMI_PRESETS = [
  { label: '₹1 lakh', amount: 1_00_000 },
  { label: '₹3 lakh', amount: 3_00_000 },
  { label: '₹5 lakh', amount: 5_00_000 },
  { label: '₹10 lakh', amount: 10_00_000 },
] as const;

/** Clearly labeled illustrative assumptions for the EMI example table. */
export const PERSONAL_LOAN_EMI_TABLE = {
  ratePercent: 12,
  tenureMonths: 36,
  amounts: [1_00_000, 3_00_000, 5_00_000, 10_00_000] as const,
  disclaimer:
    'Illustrative only at 12% p.a. for 36 months using a reducing-balance EMI model. Actual offers differ by lender and profile.',
} as const;

export type PersonalLoanEmiTableRow = {
  amount: number;
  result: EmiResult;
};

export function buildPersonalLoanEmiExampleRows(): PersonalLoanEmiTableRow[] {
  const rows: PersonalLoanEmiTableRow[] = [];
  for (const amount of PERSONAL_LOAN_EMI_TABLE.amounts) {
    const result = calculateEmi({
      principal: amount,
      annualRatePercent: PERSONAL_LOAN_EMI_TABLE.ratePercent,
      tenureMonths: PERSONAL_LOAN_EMI_TABLE.tenureMonths,
    });
    if (result) rows.push({ amount, result });
  }
  return rows;
}

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const PERSONAL_LOAN_RELATED_CALCULATORS: ContextualLink[] = [
  calc('personal-loan-emi', 'Personal Loan EMI Calculator'),
  calc('loan-eligibility', 'Personal Loan Eligibility Calculator'),
  calc('loan-prepayment', 'Loan Prepayment Calculator'),
  calc('debt-planner', 'Debt-to-Income Calculator'),
];

export const PERSONAL_LOAN_RATE_FACTORS = [
  {
    title: 'Credit profile',
    detail: 'Repayment history and score can influence pricing and approval odds.',
  },
  {
    title: 'Income',
    detail: 'Stable, verifiable income helps lenders assess repayment capacity.',
  },
  {
    title: 'Existing EMIs',
    detail: 'Higher obligations can reduce room for a new personal loan EMI.',
  },
  {
    title: 'Employer / business stability',
    detail: 'Job tenure or business vintage may affect lender comfort.',
  },
  {
    title: 'Loan amount',
    detail: 'Larger tickets can face tighter underwriting in some policies.',
  },
  {
    title: 'Tenure',
    detail: 'Longer tenure lowers EMI but can raise total interest cost.',
  },
  {
    title: 'Lender policy',
    detail: 'Each bank or NBFC applies its own risk and product rules.',
  },
] as const;

export const PERSONAL_LOAN_ELIGIBILITY_FACTORS = [
  'Age within the lender’s stated range',
  'Income that meets product criteria',
  'Employment type (salaried / self-employed / professional)',
  'Credit history quality',
  'Existing debt obligations',
  'Overall repayment capacity',
] as const;

export const PERSONAL_LOAN_SALARIED_NOTES = [
  'Stable salary credits and employer details are commonly reviewed',
  'Payslips and bank statements are often requested',
  'Work experience requirements vary by lender',
] as const;

export const PERSONAL_LOAN_SELF_EMPLOYED_NOTES = [
  'Business vintage and turnover may be assessed',
  'ITR and bank statements are commonly requested',
  'Criteria differ widely across lenders — confirm each product’s list',
] as const;

export const PERSONAL_LOAN_FEE_TYPES = [
  {
    key: 'processing',
    title: 'Processing fee',
    detail:
      'Charged at sanction or disbursal; may be a flat amount or percentage, plus GST where applicable.',
  },
  {
    key: 'late',
    title: 'Late payment fee',
    detail: 'Applies if an EMI is missed or delayed — confirm the amount and when it is levied.',
  },
  {
    key: 'prepayment',
    title: 'Prepayment fee',
    detail: 'May apply on part-prepayment after any lock-in; policies vary.',
  },
  {
    key: 'foreclosure',
    title: 'Foreclosure fee',
    detail: 'May apply if you close the loan early; check lock-in and calculation method.',
  },
  {
    key: 'docs',
    title: 'Documentation / admin charges',
    detail: 'Additional admin or documentation charges may appear on the sanction letter.',
  },
] as const;

export const PERSONAL_LOAN_REJECTION_REASONS = [
  'Weak or thin credit history',
  'High existing EMIs relative to income',
  'Income that appears unstable or hard to verify',
  'Inconsistent or incomplete documentation',
  'Mismatch with a lender’s specific eligibility policy',
  'Multiple recent credit applications',
] as const;

export const PERSONAL_LOAN_IMPROVE_CARDS = [
  {
    title: 'Reduce existing debt',
    detail: 'Lower EMI burden can improve capacity for a new loan.',
  },
  {
    title: 'Check your credit report',
    detail: 'Review errors and recent enquiries before you apply.',
  },
  {
    title: 'Choose a realistic amount',
    detail: 'Borrow for the need — not the maximum displayed amount.',
  },
  {
    title: 'Select a suitable tenure',
    detail: 'Balance EMI comfort against total interest cost.',
  },
  {
    title: 'Keep documents ready',
    detail: 'KYC, income proofs and statements speed verification.',
  },
  {
    title: 'Compare lender criteria',
    detail: 'Eligibility and pricing differ — shortlist before applying.',
  },
] as const;

export const PERSONAL_LOAN_TIMELINE_STEPS = [
  'Choose Amount',
  'Compare Offers',
  'Estimate EMI',
  'Check Eligibility',
  'Apply With Lender',
  'Verification / Credit Assessment',
  'Lender Decision',
  'Disbursement',
] as const;

export const PERSONAL_LOAN_CONSIDER_USEFUL = [
  'you need a defined lump sum',
  'you prefer scheduled monthly repayments',
  'you do not want to pledge collateral',
  'the EMI fits comfortably within your monthly budget',
  'you understand the total repayment cost',
] as const;

export const PERSONAL_LOAN_CONSIDER_CAREFUL = [
  'another EMI would significantly stretch your budget',
  'existing debt obligations are already high',
  'the borrowing is mainly for discretionary spending',
  'you have not compared fees and total repayment',
  'another borrowing option may better suit the purpose',
] as const;

export const PERSONAL_LOAN_DEFAULT_FAQS = [
  {
    question: 'What is a Personal Loan?',
    answer:
      'A Personal Loan is typically an unsecured installment loan used for a defined lump sum, repaid through scheduled EMIs over a fixed tenure. Product terms vary by lender.',
  },
  {
    question: 'How is Personal Loan EMI calculated?',
    answer:
      'EMI depends on principal, annual interest rate and tenure, typically on a reducing-balance basis. Use the calculator for illustrative estimates only.',
  },
  {
    question: 'What affects Personal Loan eligibility?',
    answer:
      'Lenders commonly review income, credit history, existing EMIs, employment or business stability, requested amount and tenure, plus their own underwriting rules.',
  },
  {
    question: 'What affects Personal Loan interest rates?',
    answer:
      'Pricing can reflect credit profile, income stability, existing obligations, amount, tenure and lender policy. Listed rates may be starting or last-verified figures — not final offers.',
  },
  {
    question: 'Does credit score affect a Personal Loan?',
    answer:
      'A stronger credit history may improve access or pricing, but lenders assess multiple factors. A high score does not guarantee approval or a specific rate.',
  },
  {
    question: 'What fees should I check?',
    answer:
      'Beyond interest, review processing fees, late payment charges, prepayment and foreclosure charges, and any documentation or admin fees on the sanction letter.',
  },
  {
    question: 'Can I repay a Personal Loan early?',
    answer:
      'Many lenders allow part-prepayment or foreclosure, sometimes after a lock-in and sometimes with charges. Confirm the product’s current policy.',
  },
  {
    question: 'What is the difference between a Personal Loan and credit card borrowing?',
    answer:
      'Personal Loans usually have a fixed amount, EMI and tenure. Credit cards are revolving credit with more flexible repayment — carrying balances can become expensive depending on card terms.',
  },
] as const;
