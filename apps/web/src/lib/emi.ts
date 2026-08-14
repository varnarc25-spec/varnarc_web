/** Standard reducing-balance EMI helpers (client-safe, no API). */

export const EMI_LIMITS = {
  amountMin: 1,
  amountMax: 10_00_00_000, // ₹10 crore
  rateMin: 0,
  rateMax: 50,
  tenureMonthsMin: 1,
  tenureMonthsMax: 480, // 40 years
} as const;

export type EmiInputs = {
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
};

export type EmiResult = {
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  principal: number;
};

export type EmiValidationError =
  | 'invalid_amount'
  | 'invalid_rate'
  | 'invalid_tenure'
  | 'amount_too_high'
  | 'rate_too_high'
  | 'tenure_too_high';

/**
 * EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 * Zero interest: EMI = P / n
 */
export function calculateEmi(input: EmiInputs): EmiResult | null {
  const principal = input.principal;
  const annualRatePercent = input.annualRatePercent;
  const n = Math.floor(input.tenureMonths);

  if (!Number.isFinite(principal) || principal < EMI_LIMITS.amountMin) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < EMI_LIMITS.rateMin) return null;
  if (!Number.isFinite(n) || n < EMI_LIMITS.tenureMonthsMin) return null;
  if (principal > EMI_LIMITS.amountMax) return null;
  if (annualRatePercent > EMI_LIMITS.rateMax) return null;
  if (n > EMI_LIMITS.tenureMonthsMax) return null;

  let monthlyEmi: number;
  if (annualRatePercent === 0) {
    monthlyEmi = principal / n;
  } else {
    const r = annualRatePercent / 12 / 100;
    const factor = Math.pow(1 + r, n);
    monthlyEmi = (principal * r * factor) / (factor - 1);
  }

  if (!Number.isFinite(monthlyEmi) || monthlyEmi < 0) return null;

  const totalRepayment = monthlyEmi * n;
  const totalInterest = Math.max(0, totalRepayment - principal);

  return {
    monthlyEmi,
    totalInterest,
    totalRepayment,
    principal,
  };
}

export function validateEmiInputs(input: EmiInputs): EmiValidationError | null {
  const { principal, annualRatePercent, tenureMonths } = input;
  const n = Math.floor(tenureMonths);

  if (!Number.isFinite(principal) || principal < EMI_LIMITS.amountMin) return 'invalid_amount';
  if (principal > EMI_LIMITS.amountMax) return 'amount_too_high';
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < EMI_LIMITS.rateMin) {
    return 'invalid_rate';
  }
  if (annualRatePercent > EMI_LIMITS.rateMax) return 'rate_too_high';
  if (!Number.isFinite(n) || n < EMI_LIMITS.tenureMonthsMin) return 'invalid_tenure';
  if (n > EMI_LIMITS.tenureMonthsMax) return 'tenure_too_high';
  return null;
}

export function monthsFromTenure(value: number, unit: 'months' | 'years'): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return unit === 'years' ? Math.round(value * 12) : Math.floor(value);
}

export const EMI_VALIDATION_MESSAGES: Record<EmiValidationError, string> = {
  invalid_amount: 'Enter a loan amount greater than zero.',
  amount_too_high: `Loan amount cannot exceed ₹${EMI_LIMITS.amountMax.toLocaleString('en-IN')}.`,
  invalid_rate: 'Interest rate cannot be negative.',
  rate_too_high: `Interest rate cannot exceed ${EMI_LIMITS.rateMax}% p.a.`,
  invalid_tenure: 'Tenure must be at least 1 month.',
  tenure_too_high: `Tenure cannot exceed ${EMI_LIMITS.tenureMonthsMax} months.`,
};
