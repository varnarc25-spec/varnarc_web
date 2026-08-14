/**
 * EMI-oriented wrappers around the shared calculator URL architecture.
 * Prefer `@/lib/calculator-query` for new code.
 */
import {
  buildCalculatorHref,
  parseCalculatorParams,
  serializeCalculatorParams,
  type CalculatorQueryState,
  type CalculatorTenureUnit,
  type ParsedCalculatorParams,
} from '@/lib/calculator-query';
import { EMI_LIMITS } from '@/lib/emi';

export type EmiTenureUnit = CalculatorTenureUnit;

export type EmiQueryState = CalculatorQueryState;

export type ParsedEmiQuery = {
  amount: number;
  rate: number;
  tenure: number;
  tenureUnit: EmiTenureUnit;
  tenureMonths: number;
  product: string | null;
  lender: string | null;
  category: string | null;
  /** @deprecated Use `product` slug. Kept for transitional callers. */
  productName: string | null;
  /** @deprecated Removed from shareable URLs. Always null. */
  productId: string | null;
  usedDefaults: {
    amount: boolean;
    rate: boolean;
    tenure: boolean;
  };
};

const DEFAULTS = {
  amount: 5_00_000,
  rate: 10,
  tenure: 5,
  tenureUnit: 'years' as EmiTenureUnit,
};

function withDefaults(parsed: ParsedCalculatorParams): ParsedEmiQuery {
  const amount = parsed.amount ?? DEFAULTS.amount;
  const rate = parsed.rate ?? DEFAULTS.rate;
  const tenure = parsed.tenure ?? DEFAULTS.tenure;
  const tenureUnit = parsed.tenureUnit ?? DEFAULTS.tenureUnit;
  const tenureMonths =
    parsed.tenureMonths ?? (tenureUnit === 'years' ? Math.round(tenure * 12) : Math.floor(tenure));

  return {
    amount,
    rate,
    tenure,
    tenureUnit,
    tenureMonths: Math.min(
      Math.max(tenureMonths, EMI_LIMITS.tenureMonthsMin),
      EMI_LIMITS.tenureMonthsMax,
    ),
    product: parsed.product,
    lender: parsed.lender,
    category: parsed.category,
    productName: parsed.product,
    productId: null,
    usedDefaults: {
      amount: parsed.missing.amount,
      rate: parsed.missing.rate,
      tenure: parsed.missing.tenure,
    },
  };
}

/**
 * Parse EMI calculator query params with safe defaults for interactive widgets.
 * Never reads catalog filter keys (`amountMin`, `tenureMin`, …).
 */
export function parseEmiQuery(
  params: URLSearchParams | Record<string, string | null | undefined>,
): ParsedEmiQuery {
  return withDefaults(parseCalculatorParams(params));
}

export function serializeEmiQuery(state: EmiQueryState): URLSearchParams {
  return serializeCalculatorParams(state);
}

export function buildEmiCalculatorHref(calculatorSlug: string, state: EmiQueryState): string {
  return buildCalculatorHref(calculatorSlug, state);
}

export const EMI_QUERY_DEFAULTS = DEFAULTS;

export {
  parseCalculatorParams,
  serializeCalculatorParams,
  sanitizeAmount,
  sanitizeRate,
  sanitizeTenure,
  buildCalculatorHref,
} from '@/lib/calculator-query';
