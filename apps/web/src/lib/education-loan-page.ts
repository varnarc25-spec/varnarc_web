/**
 * Education Loan planning-page defaults and calculation helpers.
 * Distinct from Personal / Home / Car loan decision helpers.
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

export const EDUCATION_LOAN_DECISION_HERO_ASSET =
  '/hub/finance/education-loan-decision-hero.svg?v=1';

/** Clearly labeled illustrative default for planning (not a market rate). */
export const EDUCATION_LOAN_ILLUSTRATIVE_RATE = 9.5;

export const EDUCATION_LOAN_DEFAULT_TUITION = 8_00_000;
export const EDUCATION_LOAN_DEFAULT_LIVING = 2_00_000;
export const EDUCATION_LOAN_DEFAULT_BOOKS = 40_000;
export const EDUCATION_LOAN_DEFAULT_TRAVEL = 0;
export const EDUCATION_LOAN_DEFAULT_OTHER = 60_000;
export const EDUCATION_LOAN_DEFAULT_OWN_CONTRIBUTION = 2_00_000;
export const EDUCATION_LOAN_DEFAULT_SCHOLARSHIP = 0;
export const EDUCATION_LOAN_DEFAULT_COURSE_YEARS = 2;
export const EDUCATION_LOAN_DEFAULT_MORATORIUM_MONTHS = 12;
export const EDUCATION_LOAN_DEFAULT_REPAYMENT_YEARS = 8;

export type EducationStudyLocation = 'india' | 'abroad';
export type EducationInterestMode = 'pay-during-study' | 'capitalize';
export type EducationSecurityMode = 'unsecured' | 'secured' | 'unsure';

export type EducationCostBreakdown = {
  tuition: number;
  living: number;
  books: number;
  travel: number;
  other: number;
};

export function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function totalEducationCost(parts: EducationCostBreakdown): number {
  return (
    clampNonNegative(parts.tuition) +
    clampNonNegative(parts.living) +
    clampNonNegative(parts.books) +
    clampNonNegative(parts.travel) +
    clampNonNegative(parts.other)
  );
}

/**
 * Funding gap / loan required.
 * Scholarship is user-entered only — never assumed.
 */
export function educationLoanRequirement(input: {
  totalCost: number;
  ownContribution: number;
  scholarship?: number;
}): number {
  const total = clampNonNegative(input.totalCost);
  const own = clampNonNegative(input.ownContribution);
  const scholarship = clampNonNegative(input.scholarship ?? 0);
  return Math.max(0, total - own - scholarship);
}

/** Surplus when own funds + scholarship exceed total education cost. */
export function educationFundingSurplus(input: {
  totalCost: number;
  ownContribution: number;
  scholarship?: number;
}): number {
  const total = clampNonNegative(input.totalCost);
  const own = clampNonNegative(input.ownContribution);
  const scholarship = clampNonNegative(input.scholarship ?? 0);
  return Math.max(0, own + scholarship - total);
}

export type StudyPeriodInterestResult = {
  mode: EducationInterestMode;
  /** Simple interest during course+moratorium when capitalizing; cash interest paid when paying during study. */
  interestDuringStudy: number;
  /** Principal balance when EMI repayment begins. */
  balanceAtRepaymentStart: number;
  /** Cash outflow during study (interest-only payments when paying during study). */
  cashOutflowDuringStudy: number;
  calculationBasis: string;
};

/**
 * Study-period interest model (illustrative).
 * Capitalize mode uses simple interest: P × r × months / 1200
 * (same basis as the shared education EMI calculator seed).
 * Pay-during-study assumes interest-only cash payments; principal unchanged.
 * Does NOT invent lender-specific capitalization methods.
 */
export function estimateStudyPeriodInterest(input: {
  loanAmount: number;
  annualRatePercent: number;
  courseMonths: number;
  moratoriumMonths: number;
  mode: EducationInterestMode;
}): StudyPeriodInterestResult | null {
  const principal = clampNonNegative(input.loanAmount);
  const rate = input.annualRatePercent;
  const courseMonths = Math.max(0, Math.floor(input.courseMonths));
  const moratoriumMonths = Math.max(0, Math.floor(input.moratoriumMonths));
  const studyMonths = courseMonths + moratoriumMonths;

  if (!Number.isFinite(rate) || rate < 0 || rate > 50) return null;
  if (principal <= 0 || studyMonths <= 0) {
    return {
      mode: input.mode,
      interestDuringStudy: 0,
      balanceAtRepaymentStart: principal,
      cashOutflowDuringStudy: 0,
      calculationBasis:
        'Illustrative model. No study/moratorium period entered — balance equals loan amount.',
    };
  }

  const simpleInterest = (principal * rate * studyMonths) / 1200;

  if (input.mode === 'pay-during-study') {
    return {
      mode: 'pay-during-study',
      interestDuringStudy: simpleInterest,
      balanceAtRepaymentStart: principal,
      cashOutflowDuringStudy: simpleInterest,
      calculationBasis:
        'Illustrative simple interest during course + moratorium months (P × r × n / 1200). Assumes interest is paid as cash during study; principal is unchanged. Lender methods may differ.',
    };
  }

  return {
    mode: 'capitalize',
    interestDuringStudy: simpleInterest,
    balanceAtRepaymentStart: principal + simpleInterest,
    cashOutflowDuringStudy: 0,
    calculationBasis:
      'Illustrative simple interest capitalization (P × r × n / 1200), matching the shared education EMI calculator basis. Accrued interest is added to principal at repayment start. Lender capitalization methods may differ.',
  };
}

export function estimateEmiAfterStudy(input: {
  balanceAtRepaymentStart: number;
  annualRatePercent: number;
  repaymentYears: number;
}): EmiResult | null {
  const months = Math.floor(input.repaymentYears * 12);
  if (months < 1) return null;
  return calculateEmi({
    principal: input.balanceAtRepaymentStart,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: months,
  });
}

export function estimateEducationLoanPrepaymentImpact(input: {
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

export function illustrativeEducationLoanOfferEmi(
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

export type { PrepaymentImpact, PrepaymentMode, EmiResult };

export const EDUCATION_LOAN_INTRO =
  'Estimate your total study cost, funding gap, study-period interest and future EMI before comparing Education Loan options.';

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const EDUCATION_LOAN_RELATED_CALCULATORS: ContextualLink[] = [
  {
    label: 'Education Cost Calculator',
    href: '/finance/loans/education-loan#el-cost-breakdown',
  },
  calc('education-loan-emi', 'Education Loan EMI Calculator'),
  {
    label: 'Study-Period Interest Calculator',
    href: '/finance/loans/education-loan#el-pay-vs-capitalize',
  },
  {
    label: 'Education Loan Eligibility Calculator',
    href: '/finance/eligibility',
  },
];

export const EDUCATION_LOAN_RELATED_SECONDARY: ContextualLink[] = [
  {
    label: 'Moratorium Calculator',
    href: '/finance/loans/education-loan#el-moratorium',
  },
  calc('loan-prepayment', 'Prepayment Calculator'),
  {
    label: 'Abroad Cost Planning (INR)',
    href: '/finance/loans/education-loan#el-india-abroad',
  },
];

export const EDUCATION_LOAN_DEFAULT_GUIDES: LoanGuideCardModel[] = [
  {
    id: 'el-guide-vidyalaxmi',
    title: 'PM-Vidyalaxmi Explained',
    href: '/finance/loans/education-loan#el-pm-vidyalaxmi',
    excerpt:
      'Official portal concepts, QHEI eligibility and interest subvention caveats. Not the official government page.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/government.svg',
    updatedAt: '2026-08-17',
    readingTimeMinutes: 6,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-moratorium',
    title: 'Education Loan Moratorium Explained',
    href: '/finance/loans/education-loan#el-moratorium',
    excerpt: 'Course period, moratorium and when EMI typically begins.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/moratorium.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-abroad',
    title: 'Education Loan for Study Abroad',
    href: '/finance/loans/education-loan#el-india-abroad',
    excerpt: 'How overseas cost categories differ from domestic study planning.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/study-abroad.svg',
    updatedAt: null,
    readingTimeMinutes: 5,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-coapp',
    title: 'Education Loan Co-applicant Guide',
    href: '/finance/loans/education-loan#el-coapplicant',
    excerpt: 'Why co-applicant income and credit profiles often matter.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/coapplicant.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-interest',
    title: 'Pay Interest During Study or Later?',
    href: '/finance/loans/education-loan#el-pay-vs-capitalize',
    excerpt: 'Illustrative tradeoff between cash interest now and a higher balance later.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/study-interest.svg',
    updatedAt: null,
    readingTimeMinutes: 5,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-secured',
    title: 'Secured vs Unsecured Education Loan',
    href: '/finance/loans/education-loan#el-secured-unsecured',
    excerpt: 'Balanced comparison — neither option is universally better.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/secured.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-docs',
    title: 'Education Loan Documents',
    href: '/finance/loans/education-loan#el-documents',
    excerpt: 'Student, co-applicant, academic and collateral checklist groups.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/funding-gap.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-need',
    title: 'How Much Education Loan Do I Need?',
    href: '/finance/loans/education-loan#el-funding-gap',
    excerpt: 'Estimate total study cost, own contribution and funding gap.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/funding-gap.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'education-loan',
  },
  {
    id: 'el-guide-csis',
    title: 'PM-USP CSIS Explained',
    href: '/finance/loans/education-loan#el-pm-usp-csis',
    excerpt:
      'Central Sector Interest Subsidy — distinct from PM-Vidyalaxmi. Verify on official Ministry sources.',
    categoryLabel: 'Education Loan',
    imageUrl: '/hub/finance/education-loan-guides/government.svg',
    updatedAt: '2026-08-17',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'education-loan',
  },
];

export const EDUCATION_LOAN_TIMELINE_STEPS = [
  'Estimate Education Cost',
  'Calculate Funding Gap',
  'Check Government Support',
  'Compare Loans',
  'Prepare Documents',
  'Apply',
  'Bank Verification',
  'Collateral Review if applicable',
  'Lender Decision',
  'Disbursement',
  'Course Period',
  'Moratorium',
  'Repayment',
] as const;

export const EDUCATION_LOAN_DISBURSEMENT_STEPS = [
  'Loan Sanction',
  'Documentation',
  'Institution Payment Requirement',
  'First Disbursement',
  'Future Term / Semester Requirements',
  'Subsequent Disbursements',
] as const;

export const EDUCATION_LOAN_DEFAULT_FAQS = [
  {
    question: 'What is an Education Loan?',
    answer:
      'An education loan is financing that may help cover education costs such as tuition and related expenses. Terms, coverage and eligibility vary by lender and product — this page is a planning tool, not an approval.',
  },
  {
    question: 'What expenses may an Education Loan cover?',
    answer:
      'Depending on the lender and product, education loans may consider tuition, living costs, books/equipment, travel and other academic expenses. Coverage is product-specific — this page does not imply every expense is financed.',
  },
  {
    question: 'What is the moratorium period?',
    answer:
      'A moratorium is typically the period covering the course and an additional buffer before EMI repayment begins. Exact duration and interest treatment vary by lender and scheme — use the planner as illustrative only.',
  },
  {
    question: 'Does interest accrue while I study?',
    answer:
      'Interest may accrue during the course and moratorium. Some borrowers pay interest during study; others allow it to accumulate. Confirm the product’s interest treatment with the lender.',
  },
  {
    question: 'What is a co-applicant?',
    answer:
      'A co-applicant is typically a parent or guardian whose income and credit profile may be assessed with the student. Requirements vary by lender and product.',
  },
  {
    question: 'When might collateral be required?',
    answer:
      'Collateral requirements depend on lender, loan amount, institution, course and applicant/co-applicant profile. There is no universal threshold on this page. Confirm security requirements on the offer letter.',
  },
  {
    question: 'Can I get a loan for study abroad?',
    answer:
      'Many lenders offer overseas education financing, but cost categories, documentation and security requirements can differ from domestic loans. Compare product terms carefully.',
  },
  {
    question: 'What is PM-Vidyalaxmi?',
    answer:
      'PM-Vidyalaxmi is a Government of India education-loan portal initiative. Scheme rules, eligible institutions and interest-subvention criteria are change-sensitive — verify on the official portal and with participating banks. Varnarc is not the official portal.',
  },
  {
    question: 'What is PM-USP CSIS?',
    answer:
      'The Central Sector Interest Subsidy Scheme (PM-USP CSIS) provides interest subsidy during the moratorium for eligible borrowers under Ministry guidelines. It is distinct from PM-Vidyalaxmi. Confirm current guidelines on official sources.',
  },
  {
    question: 'How do I check whether my institution is eligible?',
    answer:
      'Use the official PM-Vidyalaxmi / QHEI eligible-institution list published by the Government. Varnarc does not maintain a substitute official list and does not fabricate institution eligibility.',
  },
  {
    question: 'How is EMI calculated after study?',
    answer:
      'EMI may be calculated on the balance at repayment start (original principal plus any capitalized interest), not necessarily the original loan amount, using a reducing-balance model over the repayment tenure. Illustrative figures on this page use labeled assumptions.',
  },
] as const;
