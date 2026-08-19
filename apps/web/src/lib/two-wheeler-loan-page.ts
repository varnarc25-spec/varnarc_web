/**
 * Two-Wheeler Loan planning-page defaults — budget-focused, shorter tenures,
 * smaller amounts, dealer-finance-aware.
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
import type { LoanGuideCardModel } from '@/lib/loan-guides';
import {
  estimateHomeLoanPrepaymentImpact,
  type PrepaymentImpact,
  type PrepaymentMode,
} from '@/lib/home-loan-page';

export const TW_DECISION_HERO_ASSET = '/hub/finance/two-wheeler-loan-decision-hero.svg';

export const TW_ILLUSTRATIVE_RATE = 12;

export const TW_DEFAULT_VEHICLE_PRICE = 1_20_000;
export const TW_DEFAULT_DOWN_PAYMENT = 20_000;
export const TW_DEFAULT_TENURE_YEARS = 3;

export const TW_TENURE_YEARS = [1, 2, 3, 4, 5] as const;

export const TW_DOWN_PAYMENT_SCENARIOS = [10, 20, 30, 40] as const;

export const TW_VEHICLE_PRESETS = [
  { label: '₹75K', value: 75_000 },
  { label: '₹1L', value: 1_00_000 },
  { label: '₹1.25L', value: 1_25_000 },
  { label: '₹1.5L', value: 1_50_000 },
  { label: '₹2L', value: 2_00_000 },
] as const;

export type TwoWheelerVehicleCondition = 'new' | 'used';
export type TwoWheelerVehicleType = 'motorcycle' | 'scooter' | 'electric' | 'other';

export function clampTwoWheelerDownPayment(vehiclePrice: number, downPayment: number): number {
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0) return 0;
  if (!Number.isFinite(downPayment) || downPayment < 0) return 0;
  return Math.min(downPayment, vehiclePrice);
}

export function twoWheelerLoanRequirement(vehiclePrice: number, downPayment: number): number {
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0) return 0;
  const down = clampTwoWheelerDownPayment(vehiclePrice, downPayment);
  return Math.max(0, vehiclePrice - down);
}

export function twoWheelerFinancingPercent(
  vehiclePrice: number,
  loanRequired: number,
): number | null {
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0) return null;
  if (!Number.isFinite(loanRequired) || loanRequired < 0) return null;
  return (loanRequired / vehiclePrice) * 100;
}

export type IllustrativeTwOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

export function illustrativeTwOfferEmi(
  loan: FinanceLoan,
  selectedAmount: number,
  selectedTenureMonths: number,
): IllustrativeTwOfferEmi {
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

export function formatTwRateTypeLabel(rateType?: string | null): string {
  if (!rateType?.trim()) return 'Not currently available';
  const t = rateType.trim().toLowerCase();
  if (t === 'fixed') return 'Fixed';
  if (t === 'floating' || t === 'variable') return 'Floating';
  return rateType.trim();
}

export function parseTwoWheelerMoneyInput(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const cleaned = raw.replace(/[₹,\s]/g, '').trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export type { PrepaymentImpact, PrepaymentMode, EmiResult };

export function estimateTwPrepaymentImpact(input: {
  outstanding: number;
  annualRatePercent: number;
  remainingMonths: number;
  prepaymentAmount: number;
  mode: PrepaymentMode;
}): PrepaymentImpact | null {
  return estimateHomeLoanPrepaymentImpact(input);
}

export type TwAffordabilityEstimate = {
  comfortableEmi: number;
  loanCapacity: number;
  vehicleBudget: number;
};

export function estimateTwAffordability(input: {
  monthlyIncome: number;
  existingEmis: number;
  availableDownPayment: number;
  annualRatePercent: number;
  tenureYears: number;
  foirRatio?: number;
}): TwAffordabilityEstimate | null {
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
    vehicleBudget: loanCapacity + downPayment,
  };
}

export const TW_LOAN_INTRO =
  'Estimate your down payment, loan requirement, EMI and total financing cost before comparing available Two-Wheeler Loan options.';

export const TW_NEW_VS_USED_ROWS = [
  {
    label: 'Valuation',
    newTw: 'Invoice / showroom price',
    usedTw: 'Vehicle valuation or inspection may apply',
  },
  {
    label: 'Vehicle Age',
    newTw: 'Current-model or new stock',
    usedTw: 'Age and condition are reviewed',
  },
  {
    label: 'Documentation',
    newTw: 'Dealer invoice / purchase papers common',
    usedTw: 'Ownership and registration reviewed carefully',
  },
  {
    label: 'Potential Tenure',
    newTw: 'Options vary by lender and ticket size',
    usedTw: 'May be shorter depending on product policy',
  },
  {
    label: 'Financing Structure',
    newTw: 'Follows each lender\u2019s new-vehicle policy',
    usedTw: 'May differ by valuation and age rules',
  },
  {
    label: 'Dealer / Lender Availability',
    newTw: 'Widely available through dealers and lenders',
    usedTw: 'Availability varies by lender and vehicle profile',
  },
] as const;

export const TW_NEW_POINTS = [
  'Invoice price as the financing basis',
  'Dealer and direct-lender finance widely available',
  'Vehicle age not an issue initially',
  'Manufacturer or dealer promotions may exist',
  'Straightforward documentation structure',
] as const;

export const TW_USED_POINTS = [
  'Vehicle valuation and condition are assessed',
  'Vehicle age may affect available tenure',
  'Ownership transfer and registration verified',
  'Some lenders may apply different terms',
  'Documentation includes ownership history',
] as const;

export const TW_DEALER_POINTS = [
  'Convenience at the point of purchase',
  'On-site processing with the dealer',
  'Manufacturer or lender schemes may be available',
  'Bundled products or promotions may exist for limited periods',
  'Comparing total cost remains important',
] as const;

export const TW_LENDER_POINTS = [
  'Ability to compare independently before purchasing',
  'Existing customer offers may apply',
  'Direct lender relationship for servicing',
  'Rate and fee structure set by the lender product',
  'Terms vary by lender and applicant profile',
] as const;

export const TW_DEALER_LENDER_COMPARE = [
  'Interest Rate',
  'Processing Fee',
  'Promotional Benefits',
  'Tenure',
  'Prepayment Terms',
  'Convenience',
  'Total Cost',
] as const;

export const TW_FEE_TYPES = [
  {
    key: 'processing',
    title: 'Processing Fee',
    detail: 'Charged by some lenders when processing an application. Confirm GST and refund rules.',
  },
  {
    key: 'documentation',
    title: 'Documentation Charges',
    detail: 'Admin or documentation fees may appear on the sanction letter \u2014 verify before accepting.',
  },
  {
    key: 'prepayment',
    title: 'Prepayment / Foreclosure',
    detail: 'Prepayment or foreclosure charges are product-specific. Confirm lock-in and fee terms on the offer letter.',
  },
  {
    key: 'other',
    title: 'Other Lender Charges',
    detail: 'Late payment, bounce, or statement fees may apply \u2014 check the schedule of charges.',
  },
] as const;

export const TW_CLOSURE_STEPS = [
  'Final Payment',
  'Loan Closure Confirmation',
  'NOC / Closure Documents',
  'Hypothecation Removal Process',
  'Updated Vehicle Records',
] as const;

export const TW_TIMELINE_STEPS = [
  'Set Vehicle Budget',
  'Choose Motorcycle / Scooter',
  'Decide New / Used',
  'Plan Down Payment',
  'Estimate EMI',
  'Compare Finance Options',
  'Check Eligibility',
  'Prepare Documents',
  'Apply',
  'Verification',
  'Lender Decision',
  'Vehicle Purchase / Disbursement',
  'Repayment',
  'Loan Closure / Hypothecation Removal',
] as const;

export const TW_SALARIED_NOTES = [
  'Stable salary credit history is commonly reviewed.',
  'Existing EMIs and affordability checks may affect sanction amount.',
  'Requested amount, tenure and vehicle profile are assessed together.',
] as const;

export const TW_SELF_EMPLOYED_NOTES = [
  'Business income documentation requirements vary by lender.',
  'Cash-flow stability and existing obligations are typically reviewed.',
  'Vehicle type and age (for used two-wheelers) may be additional factors.',
] as const;

export const TW_RELATED_CALCULATORS: ContextualLink[] = [
  { label: 'Two-Wheeler EMI Calculator', href: calculatorHref('bike-loan-emi') },
  {
    label: 'Two-Wheeler Affordability Calculator',
    href: '/finance/loans/two-wheeler-loan#tw-affordability',
  },
  {
    label: 'Two-Wheeler Eligibility Calculator',
    href: financeEligibilityPath({ loanType: 'two-wheeler' }),
  },
  { label: 'Prepayment Calculator', href: calculatorHref('loan-prepayment') },
];

export const TW_RELATED_SECONDARY: ContextualLink[] = [
  {
    label: 'Down Payment Calculator',
    href: '/finance/loans/two-wheeler-loan#tw-down-payment',
  },
  {
    label: 'Interest Rate Calculator',
    href: calculatorHref('emi-rate-compare'),
  },
  {
    label: 'Loan Comparison Calculator',
    href: calculatorHref('debt-planner'),
  },
];

export const TW_DEFAULT_FAQS = [
  {
    question: 'What is a Two-Wheeler Loan?',
    answer:
      'A Two-Wheeler Loan is a financing product that helps you purchase a motorcycle, scooter or electric two-wheeler. The vehicle is typically hypothecated to the lender until the loan is repaid.',
  },
  {
    question: 'How is Two-Wheeler Loan EMI calculated?',
    answer:
      'EMI is typically calculated on a reducing-balance model using principal, annual interest rate and tenure in months. Illustrative figures on this page use that model with labeled assumptions.',
  },
  {
    question: 'How much down payment may I need?',
    answer:
      'Down payment choices affect loan amount, EMI and total interest. Requirements vary by lender, vehicle type and ticket size \u2014 this page does not invent universal percentages.',
  },
  {
    question: 'Can I finance a used motorcycle or scooter?',
    answer:
      'Some lenders offer used two-wheeler financing, but vehicle age, valuation and documentation requirements vary. Compare product terms rather than assuming one structure fits all.',
  },
  {
    question: 'What affects Two-Wheeler Loan interest rates?',
    answer:
      'Rates can reflect credit profile, income stability, vehicle condition, amount, tenure and lender policy. Listed rates may be starting or last-verified figures \u2014 not final offers.',
  },
  {
    question: 'What affects eligibility?',
    answer:
      'Lenders typically assess income, credit history, existing EMIs, employment or business profile, requested amount and vehicle details. Thresholds are product-specific.',
  },
  {
    question: 'Can a first-time borrower get a Two-Wheeler Loan?',
    answer:
      'Some borrowers may have limited credit history. Lenders may consider income, banking history, employment stability, down payment, loan amount and internal policy when assessing such applications.',
  },
  {
    question: 'Dealer finance or bank finance: what is the difference?',
    answer:
      'Dealer finance is arranged at the point of purchase and may involve partnerships or promotions. Bank/NBFC finance is arranged directly with a lender. Neither is universally cheaper \u2014 compare total cost.',
  },
  {
    question: 'Can I prepay a Two-Wheeler Loan?',
    answer:
      'Prepayment flexibility and charges depend on the product. Confirm lock-ins and fees on the sanction letter before planning an early payment.',
  },
  {
    question: 'What is hypothecation?',
    answer:
      'Hypothecation generally means the lender records a security interest in the financed vehicle. Exact documentation and removal processes vary by lender and local procedure.',
  },
  {
    question: 'How do I remove hypothecation after repayment?',
    answer:
      'After loan closure, the lender typically issues NOC/closure documents. These are then used for hypothecation removal through the applicable transport-authority process. Exact steps vary.',
  },
] as const;

export const TW_DEFAULT_GUIDES: LoanGuideCardModel[] = [
  {
    id: 'tw-guide-afford',
    title: 'How Much Two-Wheeler Can I Afford?',
    href: '/finance/loans/two-wheeler-loan#tw-affordability',
    excerpt: 'Estimate an indicative vehicle budget from income, EMIs and down payment.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/affordability.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-dp',
    title: 'Two-Wheeler Loan Down Payment Explained',
    href: '/finance/loans/two-wheeler-loan#tw-down-payment',
    excerpt: 'See how down payment changes loan required, EMI and financing %.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/down-payment.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-emi',
    title: 'Two-Wheeler EMI Guide',
    href: '/finance/loans/two-wheeler-loan#tw-tenure',
    excerpt: 'Compare how tenure changes monthly EMI and total interest.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/emi.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-new-used',
    title: 'New vs Used Two-Wheeler Finance',
    href: '/finance/loans/two-wheeler-loan#tw-new-vs-used',
    excerpt: 'Compare financing considerations for new and used two-wheelers.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/new-vs-used.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-dealer',
    title: 'Dealer Finance vs Direct Lender',
    href: '/finance/loans/two-wheeler-loan#tw-dealer-vs-lender',
    excerpt: 'What to compare when choosing dealer or direct-lender financing.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/dealer-vs-lender.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-eligibility',
    title: 'Two-Wheeler Loan Eligibility',
    href: '/finance/loans/two-wheeler-loan#tw-eligibility',
    excerpt: 'Factors lenders commonly assess when evaluating two-wheeler loan applications.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/eligibility.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-hypothecation',
    title: 'Vehicle Hypothecation Explained',
    href: '/finance/loans/two-wheeler-loan#tw-hypothecation',
    excerpt: 'How lender security interest relates to vehicle ownership records.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/hypothecation.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-closure',
    title: 'How to Close a Two-Wheeler Loan',
    href: '/finance/loans/two-wheeler-loan#tw-closure',
    excerpt: 'Typical closure, NOC and hypothecation removal journey.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/loan-closure.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-documents',
    title: 'Two-Wheeler Loan Documents',
    href: '/finance/loans/two-wheeler-loan#tw-documents',
    excerpt: 'Common documents requested during a two-wheeler loan application.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/documents.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'two-wheeler-loan',
  },
  {
    id: 'tw-guide-prepay',
    title: 'Two-Wheeler Loan Prepayment',
    href: '/finance/loans/two-wheeler-loan#tw-prepayment',
    excerpt: 'Illustrative interest and time impact of an additional payment.',
    categoryLabel: 'Two-Wheeler Loan',
    imageUrl: '/hub/finance/two-wheeler-loan-guides/prepayment.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'two-wheeler-loan',
  },
];
