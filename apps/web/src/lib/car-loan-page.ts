/**
 * Car Loan planning-page defaults — vehicle price / financing % / mid-tenure journey
 * (distinct from Personal Loan and Home Loan decision helpers).
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

export const CAR_LOAN_DECISION_HERO_ASSET = '/hub/finance/car-loan-decision-hero.svg?v=1';

/** Clearly labeled illustrative default for planning (not a market rate). */
export const CAR_LOAN_ILLUSTRATIVE_RATE = 9.5;

export const CAR_LOAN_DEFAULT_VEHICLE_PRICE = 12_00_000;
export const CAR_LOAN_DEFAULT_DOWN_PAYMENT = 2_40_000;
export const CAR_LOAN_DEFAULT_TENURE_YEARS = 5;

export const CAR_LOAN_TENURE_YEARS = [1, 3, 5, 7] as const;

export const CAR_LOAN_DOWN_PAYMENT_SCENARIOS = [10, 20, 30] as const;

export const CAR_LOAN_VEHICLE_PRESETS = [
  { label: '₹5L', value: 5_00_000 },
  { label: '₹8L', value: 8_00_000 },
  { label: '₹12L', value: 12_00_000 },
  { label: '₹20L', value: 20_00_000 },
] as const;

export type CarVehicleCondition = 'new' | 'used';

export function clampCarLoanDownPayment(vehiclePrice: number, downPayment: number): number {
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0) return 0;
  if (!Number.isFinite(downPayment) || downPayment < 0) return 0;
  return Math.min(downPayment, vehiclePrice);
}

export function carLoanRequirement(vehiclePrice: number, downPayment: number): number {
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0) return 0;
  const down = clampCarLoanDownPayment(vehiclePrice, downPayment);
  return Math.max(0, vehiclePrice - down);
}

/** Financing % = Loan Required / Vehicle Price × 100 */
export function carLoanFinancingPercent(vehiclePrice: number, loanRequired: number): number | null {
  if (!Number.isFinite(vehiclePrice) || vehiclePrice <= 0) return null;
  if (!Number.isFinite(loanRequired) || loanRequired < 0) return null;
  return (loanRequired / vehiclePrice) * 100;
}

export type IllustrativeOfferEmi =
  | { status: 'ok'; monthlyEmi: number; rateUsed: number }
  | { status: 'unavailable'; message: string };

export function illustrativeCarLoanOfferEmi(
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

export function formatCarRateTypeLabel(rateType?: string | null): string {
  if (!rateType?.trim()) return 'Not currently available';
  const t = rateType.trim().toLowerCase();
  if (t === 'fixed') return 'Fixed';
  if (t === 'floating' || t === 'variable') return 'Floating';
  return rateType.trim();
}

export function estimateCarLoanPrepaymentImpact(input: {
  outstanding: number;
  annualRatePercent: number;
  remainingMonths: number;
  prepaymentAmount: number;
  mode: PrepaymentMode;
}): PrepaymentImpact | null {
  return estimateHomeLoanPrepaymentImpact(input);
}

export type CarAffordabilityEstimate = {
  comfortableEmi: number;
  loanCapacity: number;
  vehicleBudget: number;
};

export function estimateCarAffordability(input: {
  monthlyIncome: number;
  existingEmis: number;
  availableDownPayment: number;
  annualRatePercent: number;
  tenureYears: number;
  foirRatio?: number;
}): CarAffordabilityEstimate | null {
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

export type { PrepaymentImpact, PrepaymentMode, EmiResult };

export const CAR_LOAN_INTRO =
  'Estimate your down payment, loan requirement, EMI and total financing cost before comparing Car Loan offers.';

function calc(slug: Parameters<typeof calculatorHref>[0], label: string): ContextualLink {
  return { label, href: calculatorHref(slug) };
}

export const CAR_LOAN_RELATED_CALCULATORS: ContextualLink[] = [
  calc('car-loan', 'Car Loan EMI Calculator'),
  {
    label: 'Car Loan Affordability Calculator',
    href: '/calculators/car-loan-affordability',
  },
  {
    label: 'Car Loan Eligibility Calculator',
    href: financeEligibilityPath({ loanType: 'car' }),
  },
  calc('loan-prepayment', 'Loan Prepayment Calculator'),
];

export const CAR_LOAN_RELATED_SECONDARY: ContextualLink[] = [
  {
    label: 'Down Payment Calculator',
    href: '/finance/loans/car-loan#car-loan-down-payment',
  },
  {
    label: 'Interest Rate Calculator',
    href: calculatorHref('emi-rate-compare'),
  },
  {
    label: 'Debt-to-Income Calculator',
    href: calculatorHref('debt-planner'),
  },
];

export const CAR_LOAN_DEFAULT_GUIDES: LoanGuideCardModel[] = [
  {
    id: 'cl-guide-afford',
    title: 'How Much Car Can I Afford?',
    href: '/finance/loans/car-loan#car-loan-affordability',
    excerpt: 'Estimate an illustrative vehicle budget from income, EMIs and down payment.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/affordability.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-dp',
    title: 'Car Loan Down Payment Explained',
    href: '/finance/loans/car-loan#car-loan-down-payment',
    excerpt: 'See how down payment changes loan required, EMI and financing %.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/down-payment.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-emi',
    title: 'Car Loan EMI Guide',
    href: '/finance/loans/car-loan#car-loan-tenure-simulator',
    excerpt: 'Compare how tenure changes monthly EMI and total interest.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/emi.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-new-used',
    title: 'New vs Used Car Loan',
    href: '/finance/loans/car-loan#car-loan-new-vs-used',
    excerpt: 'Compare financing considerations for new and used vehicles.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/new-vs-used.svg',
    updatedAt: null,
    readingTimeMinutes: 5,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-bank-dealer',
    title: 'Bank vs Dealer Finance',
    href: '/finance/loans/car-loan#car-loan-bank-vs-dealer',
    excerpt: 'What to compare when choosing bank or dealer financing.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/bank-vs-dealer.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-prepay',
    title: 'Car Loan Prepayment Guide',
    href: '/finance/loans/car-loan#car-loan-prepayment',
    excerpt: 'Illustrative interest and time impact of an additional payment.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/prepayment.svg',
    updatedAt: null,
    readingTimeMinutes: 4,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-hypo',
    title: 'Vehicle Hypothecation Explained',
    href: '/finance/loans/car-loan#car-loan-hypothecation',
    excerpt: 'How lender security interest relates to vehicle ownership records.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/hypothecation.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'car-loan',
  },
  {
    id: 'cl-guide-closure',
    title: 'How to Close a Car Loan',
    href: '/finance/loans/car-loan#car-loan-closure',
    excerpt: 'Typical closure, NOC and hypothecation removal journey.',
    categoryLabel: 'Car Loan',
    imageUrl: '/hub/finance/car-loan-guides/loan-closure.svg',
    updatedAt: null,
    readingTimeMinutes: 3,
    relatedCategorySlug: 'car-loan',
  },
];

/** Recommended Loan.metadata keys for car products (admin/API). */
export const CAR_LOAN_METADATA_SCHEMA = {
  vehicleCondition: "'new' | 'used' | 'both'",
  vehicleAgeMax: 'number (years)',
  financingPercentageMin: 'number 0–100',
  financingPercentageMax: 'number 0–100',
  vehicleValuationRequired: 'boolean',
  prepaymentTerms: 'string (optional override)',
  foreclosureTerms: 'string (optional override)',
} as const;

export const CAR_LOAN_FEE_TYPES = [
  {
    key: 'processing',
    title: 'Processing Fee',
    detail: 'Charged by some lenders when processing an application. Confirm GST and refund rules.',
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
      'Prepayment or foreclosure charges are product-specific. Confirm lock-in and fee terms on the offer letter.',
  },
  {
    key: 'other',
    title: 'Other Lender Charges',
    detail: 'Late payment, bounce, or statement fees may apply — check the schedule of charges.',
  },
] as const;

export const CAR_LOAN_NEW_VS_USED_ROWS = [
  {
    label: 'Vehicle Age',
    newCar: 'Current-model or new stock',
    usedCar: 'Age and history are reviewed',
  },
  {
    label: 'Typical Financing Structure',
    newCar: 'Follows each lender’s new-vehicle policy',
    usedCar: 'May differ by valuation and age rules',
  },
  {
    label: 'Loan Tenure',
    newCar: 'Options vary by lender and ticket size',
    usedCar: 'May be shorter depending on product policy',
  },
  {
    label: 'Rate Considerations',
    newCar: 'Product-specific — not universally lower',
    usedCar: 'Product-specific — not universally higher',
  },
  {
    label: 'Valuation',
    newCar: 'Usually invoice / on-road purchase basis',
    usedCar: 'Valuation or inspection may apply',
  },
  {
    label: 'Down Payment',
    newCar: 'Planner-driven; lender rules vary',
    usedCar: 'Planner-driven; lender rules vary',
  },
  {
    label: 'Documentation',
    newCar: 'Dealer invoice / purchase papers common',
    usedCar: 'Ownership and registration reviewed carefully',
  },
  {
    label: 'Resale / Asset Considerations',
    newCar: 'Asset starts as a new vehicle',
    usedCar: 'Existing depreciation and condition matter',
  },
] as const;

export const CAR_LOAN_NEW_CAR_POINTS = [
  'Vehicle age is typically current-model or new stock',
  'Financing structure follows each lender’s new-vehicle policy',
  'Tenure options vary by lender and ticket size',
  'Rate and fee terms are product-specific',
  'Documentation usually includes dealer invoice / purchase papers',
] as const;

export const CAR_LOAN_USED_CAR_POINTS = [
  'Vehicle age and valuation may affect financing terms',
  'Lenders may apply different tenure or amount policies',
  'Rate considerations can differ by product — not universally higher',
  'Additional valuation or inspection steps may apply',
  'Ownership and registration documents are reviewed carefully',
] as const;

export const CAR_LOAN_BANK_POINTS = [
  'Direct relationship with the lender',
  'Rate and fee structure set by the bank/NBFC product',
  'Pre-approved offers may apply for some customers',
  'Financing process is separate from vehicle purchase',
  'Terms vary by lender and applicant profile',
] as const;

export const CAR_LOAN_DEALER_POINTS = [
  'Convenience at the point of purchase',
  'May involve manufacturer or dealer partnerships',
  'Promotional schemes may exist for limited periods',
  'Fees and conditions can differ from standalone bank offers',
  'Comparing total cost remains important',
] as const;

export const CAR_LOAN_BANK_DEALER_COMPARE = [
  'Interest Rate',
  'Processing Fee',
  'Promotional Discounts',
  'Tenure',
  'Prepayment Terms',
  'Convenience',
  'Total Cost',
] as const;

export const CAR_LOAN_TIMELINE_STEPS = [
  'Set Vehicle Budget',
  'Choose New / Used',
  'Plan Down Payment',
  'Estimate EMI',
  'Compare Offers',
  'Check Eligibility',
  'Apply',
  'Verification',
  'Lender Decision',
  'Disbursement / Purchase',
] as const;

export const CAR_LOAN_CLOSURE_STEPS = [
  'Final Payment',
  'Loan Closure Confirmation',
  'NOC / Closure Documents',
  'Hypothecation Removal Process',
  'Updated Vehicle Records',
] as const;

export const CAR_LOAN_SALARIED_NOTES = [
  'Stable salary credit history is commonly reviewed.',
  'Existing EMIs and FOIR-style affordability checks may affect sanction amount.',
  'Requested amount, tenure and vehicle profile are assessed together.',
] as const;

export const CAR_LOAN_SELF_EMPLOYED_NOTES = [
  'Business income documentation requirements vary by lender.',
  'Cash-flow stability and existing obligations are typically reviewed.',
  'Vehicle valuation and age (for used cars) may be additional factors.',
] as const;

export const CAR_LOAN_JOINT_NOTES = [
  'A co-applicant may strengthen combined income assessment, subject to lender rules.',
  'Both applicants’ credit profiles and existing EMIs may be reviewed.',
  'Vehicle ownership, repayment liability and documentation requirements are product-specific.',
] as const;

export const CAR_LOAN_DEFAULT_FAQS = [
  {
    question: 'How is Car Loan EMI calculated?',
    answer:
      'EMI is typically calculated on a reducing-balance model using principal, annual interest rate and tenure in months. Illustrative figures on this page use that model with labeled assumptions.',
  },
  {
    question: 'How much down payment should I make?',
    answer:
      'Down payment choices affect loan amount, EMI and total interest. Requirements vary by lender, vehicle type and ticket size — this page does not invent universal percentages.',
  },
  {
    question: 'Can I finance a used car?',
    answer:
      'Many lenders offer used-car financing, but vehicle age, valuation and documentation requirements vary. Compare product terms rather than assuming one structure fits all.',
  },
  {
    question: 'What affects Car Loan interest rates?',
    answer:
      'Rates can reflect credit profile, income stability, vehicle condition, amount, tenure and lender policy. Listed rates may be starting or last-verified figures — not final offers.',
  },
  {
    question: 'What affects Car Loan eligibility?',
    answer:
      'Lenders typically assess income, credit history, existing EMIs, employment or business profile, requested amount and vehicle details. Thresholds are product-specific.',
  },
  {
    question: 'Can I prepay a Car Loan?',
    answer:
      'Prepayment flexibility and charges depend on the product. Confirm lock-ins and fees on the sanction letter before planning an early payment.',
  },
  {
    question: 'What is vehicle hypothecation?',
    answer:
      'Hypothecation generally means the lender records a security interest in the financed vehicle. Exact documentation and removal processes vary by lender and local procedure.',
  },
  {
    question: 'How do I close a Car Loan?',
    answer:
      'After the final payment, lenders typically issue closure confirmation and NOC/closure documents, followed by hypothecation removal and updated vehicle records. Exact steps vary by lender and local transport authority process.',
  },
  {
    question: 'Bank or dealer finance: what is the difference?',
    answer:
      'Bank/NBFC finance is arranged directly with a lender; dealer finance is often arranged at purchase and may involve partnerships or promotions. Neither is universally cheaper — compare total cost.',
  },
] as const;
