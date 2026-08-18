/**
 * Gold Loan planning-page defaults and calculation helpers.
 * Distinct from Personal / Home / Car / Education / Business loan planners.
 *
 * Reference gold rates and LTV inputs are user-adjustable illustrative planning
 * values — not live market feeds, guaranteed valuations, or universal regulatory caps.
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

export const GOLD_LOAN_DECISION_HERO_ASSET = '/hub/finance/gold-loan-decision-hero.png?v=5';

export const GOLD_LOAN_ILLUSTRATIVE_RATE = 10;
export const GOLD_LOAN_DEFAULT_REQUIRED = 3_00_000;
export const GOLD_LOAN_DEFAULT_WEIGHT_G = 25;
export const GOLD_LOAN_DEFAULT_KARAT = 22;
export const GOLD_LOAN_DEFAULT_REFERENCE_RATE_PER_G = 7_000;
/** User-adjustable illustrative LTV — not a published universal regulatory cap. */
export const GOLD_LOAN_DEFAULT_ILLUSTRATIVE_LTV = 75;
export const GOLD_LOAN_DEFAULT_TENURE_MONTHS = 12;

export type GoldPurityPreset = 18 | 20 | 22 | 24 | 'custom';
export type GoldRepaymentMode = 'emi' | 'interest_only' | 'bullet';

export const GOLD_PURITY_PRESETS: Array<{ id: GoldPurityPreset; label: string; karat: number }> = [
  { id: 18, label: '18K', karat: 18 },
  { id: 20, label: '20K', karat: 20 },
  { id: 22, label: '22K', karat: 22 },
  { id: 24, label: '24K', karat: 24 },
  { id: 'custom', label: 'Custom', karat: 22 },
];

export function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function clampPercent(n: number, max = 100): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
}

/** Fine-gold factor = karat / 24. */
export function purityFactorFromKarat(karat: number): number | null {
  if (!Number.isFinite(karat) || karat <= 0 || karat > 24) return null;
  return karat / 24;
}

export type GoldValuationResult = {
  grossWeightG: number;
  eligibleWeightG: number;
  karat: number;
  purityFactor: number;
  referenceRatePerG: number;
  estimatedGoldValue: number;
  calculationBasis: string;
};

/**
 * Estimated gold value for planning:
 * eligibleWeight × (karat/24) × referenceRatePerGram
 */
export function estimateGoldValue(input: {
  grossWeightG: number;
  karat: number;
  referenceRatePerG: number;
  /** 0–1 fraction of gross weight treated as eligible metal; default 1. */
  eligibleWeightFraction?: number;
}): GoldValuationResult | null {
  const gross = clampNonNegative(input.grossWeightG);
  const rate = clampNonNegative(input.referenceRatePerG);
  const fraction = clampPercent(input.eligibleWeightFraction ?? 1, 1);
  const factor = purityFactorFromKarat(input.karat);
  if (!factor || gross <= 0 || rate <= 0) return null;
  const eligibleWeightG = gross * fraction;
  return {
    grossWeightG: gross,
    eligibleWeightG,
    karat: input.karat,
    purityFactor: factor,
    referenceRatePerG: rate,
    estimatedGoldValue: eligibleWeightG * factor * rate,
    calculationBasis:
      'Illustrative: eligible weight × (karat ÷ 24) × reference value per gram. Lender appraisal methods differ; market quotes are not valuations.',
  };
}

export type GoldBorrowingCapacity = {
  estimatedGoldValue: number;
  illustrativeLtvPercent: number;
  indicativeMaxLoan: number;
  requestedLoan: number;
  headroom: number;
  exceedsCapacity: boolean;
};

export function estimateBorrowingCapacity(input: {
  estimatedGoldValue: number;
  illustrativeLtvPercent: number;
  requestedLoan: number;
}): GoldBorrowingCapacity | null {
  const value = clampNonNegative(input.estimatedGoldValue);
  const ltv = clampPercent(input.illustrativeLtvPercent);
  const requested = clampNonNegative(input.requestedLoan);
  if (value <= 0 || ltv <= 0) return null;
  const indicativeMaxLoan = value * (ltv / 100);
  return {
    estimatedGoldValue: value,
    illustrativeLtvPercent: ltv,
    indicativeMaxLoan,
    requestedLoan: requested,
    headroom: indicativeMaxLoan - requested,
    exceedsCapacity: requested > indicativeMaxLoan + 0.5,
  };
}

/** Reverse: estimated gold grams needed for a target loan. */
export function estimateGoldRequired(input: {
  requiredLoan: number;
  karat: number;
  referenceRatePerG: number;
  illustrativeLtvPercent: number;
}): number | null {
  const loan = clampNonNegative(input.requiredLoan);
  const rate = clampNonNegative(input.referenceRatePerG);
  const ltv = clampPercent(input.illustrativeLtvPercent);
  const factor = purityFactorFromKarat(input.karat);
  if (!factor || loan <= 0 || rate <= 0 || ltv <= 0) return null;
  const requiredEligibleValue = loan / (ltv / 100);
  const perGram = factor * rate;
  if (perGram <= 0) return null;
  return requiredEligibleValue / perGram;
}

export type PurityComparisonRow = {
  karat: number;
  label: string;
  purityFactor: number;
  estimatedGoldValue: number;
};

export function comparePurityForWeight(input: {
  grossWeightG: number;
  referenceRatePerG: number;
  karats?: number[];
}): PurityComparisonRow[] {
  const list = input.karats ?? [18, 20, 22, 24];
  return list
    .map((karat) => {
      const v = estimateGoldValue({
        grossWeightG: input.grossWeightG,
        karat,
        referenceRatePerG: input.referenceRatePerG,
      });
      if (!v) return null;
      return {
        karat,
        label: `${karat}K`,
        purityFactor: v.purityFactor,
        estimatedGoldValue: v.estimatedGoldValue,
      };
    })
    .filter((r): r is PurityComparisonRow => r != null);
}

export type GoldRepaymentSummary = {
  mode: GoldRepaymentMode;
  periodicPayment: number | null;
  totalInterest: number;
  totalRepayment: number;
  principalAtEnd: number;
  notes: string;
};

/** Educational repayment models — not an exhaustive lender catalog. */
export function estimateGoldRepayment(input: {
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
  mode: GoldRepaymentMode;
}): GoldRepaymentSummary | null {
  const principal = clampNonNegative(input.principal);
  const months = Math.floor(input.tenureMonths);
  const rate = input.annualRatePercent;
  if (!Number.isFinite(rate) || rate < 0 || principal <= 0 || months < 1) return null;

  if (input.mode === 'emi') {
    const emi = calculateEmi({
      principal,
      annualRatePercent: rate,
      tenureMonths: months,
    });
    if (!emi) return null;
    return {
      mode: 'emi',
      periodicPayment: emi.monthlyEmi,
      totalInterest: emi.totalInterest,
      totalRepayment: emi.totalRepayment,
      principalAtEnd: 0,
      notes: 'Illustrative reducing-balance EMI. Confirm structure with the lender.',
    };
  }

  const monthlyRate = rate / 12 / 100;
  if (input.mode === 'interest_only') {
    const periodic = principal * monthlyRate;
    const totalInterest = periodic * months;
    return {
      mode: 'interest_only',
      periodicPayment: periodic,
      totalInterest,
      totalRepayment: principal + totalInterest,
      principalAtEnd: principal,
      notes:
        'Illustrative periodic interest with principal due at end. Not all lenders offer this structure.',
    };
  }

  // bullet: interest + principal at end (simple annualised interest for tenure)
  const totalInterest = principal * (rate / 100) * (months / 12);
  return {
    mode: 'bullet',
    periodicPayment: null,
    totalInterest,
    totalRepayment: principal + totalInterest,
    principalAtEnd: principal,
    notes:
      'Illustrative bullet-style repayment (interest accrued over tenure; principal at end). Lender contracts differ.',
  };
}

export type GoldValueStressRow = {
  id: string;
  label: string;
  valueMultiplier: number;
  illustrativeGoldValue: number;
  outstandingLoan: number;
  resultingLtvPercent: number | null;
};

export function stressGoldValueLtv(input: {
  currentGoldValue: number;
  outstandingLoan: number;
  customMultiplier?: number | null;
}): GoldValueStressRow[] {
  const base = clampNonNegative(input.currentGoldValue);
  const loan = clampNonNegative(input.outstandingLoan);
  const scenarios: Array<{ id: string; label: string; mult: number }> = [
    { id: 'current', label: 'Current', mult: 1 },
    { id: 'minus5', label: '−5%', mult: 0.95 },
    { id: 'minus10', label: '−10%', mult: 0.9 },
  ];
  if (input.customMultiplier != null && Number.isFinite(input.customMultiplier)) {
    scenarios.push({
      id: 'custom',
      label: 'Custom',
      mult: Math.max(0, input.customMultiplier),
    });
  }
  return scenarios.map((s) => {
    const value = base * s.mult;
    return {
      id: s.id,
      label: s.label,
      valueMultiplier: s.mult,
      illustrativeGoldValue: value,
      outstandingLoan: loan,
      resultingLtvPercent: value > 0 ? (loan / value) * 100 : null,
    };
  });
}

export type GoldTotalCost = {
  principal: number;
  totalInterest: number;
  knownFees: number | null;
  feesKnown: boolean;
  totalFinancingCost: number;
  totalRepayment: number;
};

export function estimateGoldTotalCost(input: {
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
  mode: GoldRepaymentMode;
  knownFees?: number | null;
}): GoldTotalCost | null {
  const repayment = estimateGoldRepayment({
    principal: input.principal,
    annualRatePercent: input.annualRatePercent,
    tenureMonths: input.tenureMonths,
    mode: input.mode,
  });
  if (!repayment) return null;
  const feesKnown = input.knownFees != null && Number.isFinite(input.knownFees);
  const fees = feesKnown ? clampNonNegative(input.knownFees as number) : null;
  const feeAmount = fees ?? 0;
  return {
    principal: clampNonNegative(input.principal),
    totalInterest: repayment.totalInterest,
    knownFees: fees,
    feesKnown,
    totalFinancingCost: repayment.totalInterest + feeAmount,
    totalRepayment: repayment.totalRepayment + feeAmount,
  };
}

export function estimateGoldLoanEmi(input: {
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

export type IllustrativeOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

export function illustrativeGoldLoanOfferEmi(
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

export function estimateGoldLoanPrepaymentImpact(input: {
  outstanding: number;
  annualRatePercent: number;
  remainingMonths: number;
  prepaymentAmount: number;
  mode: PrepaymentMode;
}): PrepaymentImpact | null {
  return estimateHomeLoanPrepaymentImpact(input);
}

export type { PrepaymentImpact, PrepaymentMode, EmiResult };

export const GOLD_LOAN_INTRO =
  'Estimate borrowing capacity using gold weight, purity and indicative valuation, then explore repayment costs, eligibility and available lender offers.';

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const GOLD_LOAN_RELATED_CALCULATORS: ContextualLink[] = [
  calc('gold-loan-emi', 'Gold Loan Calculator'),
  calc('emi', 'EMI Calculator'),
  {
    label: 'Loan Eligibility Calculator',
    href: '/finance/eligibility',
  },
  calc('loan-prepayment', 'Loan Prepayment Calculator'),
];

export const GOLD_LOAN_RELATED_SECONDARY: ContextualLink[] = [
  {
    label: 'Gold Value Estimator',
    href: '/finance/loans/gold-loan#gl-valuation',
  },
  {
    label: 'LTV / Borrowing Capacity',
    href: '/finance/loans/gold-loan#gl-capacity',
  },
  {
    label: 'Gold Required Calculator',
    href: '/finance/loans/gold-loan#gl-gold-required',
  },
];

export const GOLD_LOAN_PLEDGE_STEPS = [
  'Gold Presented',
  'Appraisal',
  'Purity / Eligible Weight',
  'Valuation',
  'Loan Terms',
  'Gold Pledged',
  'Repayment',
  'Closure',
  'Gold Released',
] as const;

export const GOLD_LOAN_APPLICATION_STEPS = [
  'Choose loan requirement',
  'Visit / initiate application',
  'KYC',
  'Gold appraisal',
  'Valuation',
  'Review loan terms',
  'Pledge gold',
  'Disbursement',
  'Repayment',
  'Closure',
  'Gold release',
] as const;

export const GOLD_LOAN_DEFAULT_GUIDES: LoanGuideCardModel[] = [
  {
    id: 'gl-guide-valuation',
    title: 'How Gold Loan Valuation Works',
    href: '/finance/loans/gold-loan#gl-valuation',
    excerpt: 'Weight, purity and why market price is not the same as lender valuation.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/valuation.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-ltv',
    title: 'Gold Loan LTV Explained',
    href: '/finance/loans/gold-loan#gl-capacity',
    excerpt: 'How loan-to-value shapes indicative borrowing capacity.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/ltv.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-purity',
    title: '18K vs 22K Gold for Loan Valuation',
    href: '/finance/loans/gold-loan#gl-purity',
    excerpt: 'How karat purity changes fine-gold content for the same weight.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/purity.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-repayment',
    title: 'Gold Loan Repayment Methods Explained',
    href: '/finance/loans/gold-loan#gl-repayment-compare',
    excerpt: 'EMI, periodic interest and bullet-style structures as educational models.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/repayment.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-auction',
    title: 'What Happens If a Gold Loan Is Not Repaid?',
    href: '/finance/loans/gold-loan#gl-missed-payments',
    excerpt: 'Overdue process concepts without fear-based claims.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/auction.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-release',
    title: 'How to Close a Gold Loan and Get Gold Back',
    href: '/finance/loans/gold-loan#gl-release',
    excerpt: 'Closure and release as a lender-process journey.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/release.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-vs-pl',
    title: 'Gold Loan vs Personal Loan',
    href: '/finance/loans/gold-loan#gl-vs-personal',
    excerpt: 'Secured jewellery-backed borrowing compared with unsecured personal loans.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/vs-personal.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 4,
    relatedCategorySlug: 'gold-loan',
  },
  {
    id: 'gl-guide-process',
    title: 'How a Gold Loan Typically Works',
    href: '/finance/loans/gold-loan#gl-application',
    excerpt: 'From appraisal and pledge through repayment and release.',
    categoryLabel: 'Gold Loan',
    imageUrl: '/hub/finance/gold-loan-guides/process.svg?v=3',
    updatedAt: '2026-08-18',
    readingTimeMinutes: 5,
    relatedCategorySlug: 'gold-loan',
  },
];

export const GOLD_LOAN_DEFAULT_FAQS = [
  {
    question: 'What is a Gold Loan?',
    answer:
      'A gold loan is financing secured against pledged gold jewellery or ornaments, subject to lender appraisal, KYC and product terms. This page is a planning tool, not an approval.',
  },
  {
    question: 'How is gold valued for a Gold Loan?',
    answer:
      'Lenders typically consider weight, purity and their appraisal method. Market gold price is a reference, not necessarily the valuation used for lending.',
  },
  {
    question: 'Does purity affect Gold Loan amount?',
    answer:
      'Higher karat generally means more fine-gold content for the same gross weight, which can affect estimated value. Exact treatment depends on the lender’s appraisal.',
  },
  {
    question: 'What is LTV in a Gold Loan?',
    answer:
      'Loan-to-value compares the loan amount with the valued gold. Applicable LTV depends on lender policy and any applicable regulatory requirements — confirm current rules with official sources and the lender.',
  },
  {
    question: 'How much Gold Loan can I get?',
    answer:
      'Indicative capacity is often framed as valued gold × applicable LTV. Actual sanctioned amounts depend on appraisal, product limits and underwriting.',
  },
  {
    question: 'Can stones in jewellery be included in valuation?',
    answer:
      'Stones and non-gold components may be excluded or adjusted. Confirm how the lender treats eligible metal weight.',
  },
  {
    question: 'Can I repay a Gold Loan early?',
    answer:
      'Many products allow early repayment subject to lender policy and any disclosed charges. Confirm foreclosure terms before relying on savings estimates.',
  },
  {
    question: 'What repayment methods are available?',
    answer:
      'Common educational structures include EMI, periodic interest with principal later, and bullet-style repayment. Availability varies by lender and product.',
  },
  {
    question: 'What happens if I miss a Gold Loan payment?',
    answer:
      'Overdue dues may trigger lender communication and contractual processes. Exact timelines and actions depend on the agreement, lender policy and applicable requirements — not automatic immediate auction.',
  },
  {
    question: 'Can pledged gold be auctioned?',
    answer:
      'Where permitted under the contract and applicable process, unrecovered dues may lead to recovery actions including auction after due process. Read notice and recovery terms carefully.',
  },
  {
    question: 'How do I get my gold back after repayment?',
    answer:
      'After outstanding amounts are cleared and the loan is closed, gold is typically released under the lender’s process, often with identity checks. Verify returned items against pledge documentation.',
  },
  {
    question: 'Is a Gold Loan better than a Personal Loan?',
    answer:
      'Neither is universally better. Gold loans are secured against pledged gold; personal loans are typically unsecured. Compare security, documentation, pricing and risk for your situation.',
  },
] as const;
