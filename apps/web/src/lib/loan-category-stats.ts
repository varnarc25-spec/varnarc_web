import type { FinanceLoan } from '@/services/finance';
import {
  toNumber,
  formatInr,
  formatPercent,
  formatTenureMonths,
} from '@/components/loans/loan-format';

export type LoanCategoryStat = {
  key: 'startingRate' | 'maxAmount' | 'maxTenure' | 'lenderCount';
  label: string;
  value: string;
};

/**
 * Derive public summary stats from active catalog products.
 * Only uses verified rates for starting-rate; omits any stat that cannot be computed.
 * Never fabricates values.
 */
export function computeLoanCategoryStats(loans: FinanceLoan[]): LoanCategoryStat[] {
  if (!loans.length) return [];

  const stats: LoanCategoryStat[] = [];

  const verifiedRates: number[] = [];
  for (const loan of loans) {
    if (!loan.rateLastVerifiedAt) continue;
    const rate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
    if (rate != null && rate >= 0) verifiedRates.push(rate);
  }
  if (verifiedRates.length) {
    const starting = Math.min(...verifiedRates);
    const label = formatPercent(starting);
    if (label) {
      stats.push({ key: 'startingRate', label: 'Starting rate', value: `${label} p.a.` });
    }
  }

  const amounts: number[] = [];
  for (const loan of loans) {
    const max = toNumber(loan.loanAmountMax) ?? toNumber(loan.maxAmount);
    if (max != null && max > 0) amounts.push(max);
  }
  if (amounts.length) {
    const maxAmount = Math.max(...amounts);
    const formatted = formatInr(maxAmount);
    if (formatted) {
      stats.push({ key: 'maxAmount', label: 'Maximum loan amount', value: formatted });
    }
  }

  const tenures: number[] = [];
  for (const loan of loans) {
    if (loan.tenureMax != null && loan.tenureMax > 0) tenures.push(loan.tenureMax);
  }
  if (tenures.length) {
    const maxTenure = Math.max(...tenures);
    const formatted = formatTenureMonths(maxTenure, maxTenure);
    if (formatted) {
      stats.push({ key: 'maxTenure', label: 'Maximum tenure', value: `Up to ${formatted}` });
    }
  }

  const lenderIds = new Set<string>();
  for (const loan of loans) {
    if (loan.bank?.id) lenderIds.add(loan.bank.id);
  }
  if (lenderIds.size > 0) {
    stats.push({
      key: 'lenderCount',
      label: 'Lenders compared',
      value: String(lenderIds.size),
    });
  }

  return stats;
}
