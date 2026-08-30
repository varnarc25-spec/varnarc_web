import { describe, expect, it } from 'vitest';
import {
  twoWheelerLoanRequirement,
  clampTwoWheelerDownPayment,
  twoWheelerFinancingPercent,
  estimateTwAffordability,
  estimateTwPrepaymentImpact,
  parseTwoWheelerMoneyInput,
  TW_DEFAULT_FAQS,
  TW_DEFAULT_GUIDES,
} from '@/lib/two-wheeler-loan-page';
import {
  resolveTwProductFields,
  filterTwLoanCatalog,
  formatTwVehicleConditionLabel,
} from '@/lib/two-wheeler-loan-product';

describe('twoWheelerLoanRequirement', () => {
  it('basic: 1,20,000 - 20,000 = 1,00,000', () => {
    expect(twoWheelerLoanRequirement(1_20_000, 20_000)).toBe(1_00_000);
  });

  it('zero vehicle price returns 0', () => {
    expect(twoWheelerLoanRequirement(0, 20_000)).toBe(0);
  });

  it('negative vehicle price returns 0', () => {
    expect(twoWheelerLoanRequirement(-1_00_000, 20_000)).toBe(0);
  });

  it('down payment exceeding vehicle price clamps to vehicle price', () => {
    expect(twoWheelerLoanRequirement(1_00_000, 2_00_000)).toBe(0);
  });

  it('zero down payment returns full amount', () => {
    expect(twoWheelerLoanRequirement(1_50_000, 0)).toBe(1_50_000);
  });
});

describe('clampTwoWheelerDownPayment', () => {
  it('clamps to vehicle price', () => {
    expect(clampTwoWheelerDownPayment(1_00_000, 1_50_000)).toBe(1_00_000);
  });

  it('negative returns 0', () => {
    expect(clampTwoWheelerDownPayment(1_00_000, -5000)).toBe(0);
  });

  it('NaN returns 0', () => {
    expect(clampTwoWheelerDownPayment(1_00_000, NaN)).toBe(0);
  });
});

describe('twoWheelerFinancingPercent', () => {
  it('1,00,000 / 1,20,000 = ~83.33%', () => {
    expect(twoWheelerFinancingPercent(1_20_000, 1_00_000)).toBeCloseTo(83.333, 2);
  });

  it('zero vehicle price returns null', () => {
    expect(twoWheelerFinancingPercent(0, 1_00_000)).toBeNull();
  });

  it('negative loan returns null', () => {
    expect(twoWheelerFinancingPercent(1_20_000, -1000)).toBeNull();
  });

  it('100% financing', () => {
    expect(twoWheelerFinancingPercent(1_00_000, 1_00_000)).toBeCloseTo(100, 6);
  });
});

describe('estimateTwAffordability', () => {
  it('returns valid estimate for typical inputs', () => {
    const result = estimateTwAffordability(40_000, 5_000, 20_000, 12, 36);
    expect(result).not.toBeNull();
    expect(result!.maxEmi).toBeGreaterThan(0);
    expect(result!.maxLoan).toBeGreaterThan(0);
    expect(result!.indicativeBudget).toBe(result!.maxLoan + 20_000);
  });

  it('returns null when income is zero', () => {
    const result = estimateTwAffordability(0, 10_000, 20_000, 12, 36);
    expect(result).toBeNull();
  });
});

describe('estimateTwPrepaymentImpact', () => {
  it('returns impact for valid prepayment', () => {
    const impact = estimateTwPrepaymentImpact(80_000, 12, 24, 20_000, 'reduce-tenure');
    expect(impact).not.toBeNull();
    expect(impact!.interestSaved).toBeGreaterThan(0);
    expect(impact!.monthsSaved).toBeGreaterThan(0);
  });
});

describe('parseTwoWheelerMoneyInput', () => {
  it('normalizes formatted currency', () => {
    expect(parseTwoWheelerMoneyInput('₹1,20,000')).toBe(1_20_000);
    expect(parseTwoWheelerMoneyInput('120000')).toBe(1_20_000);
    expect(parseTwoWheelerMoneyInput('')).toBe(0);
    expect(parseTwoWheelerMoneyInput(null)).toBe(0);
    expect(parseTwoWheelerMoneyInput('abc')).toBe(0);
  });

  it('handles number input', () => {
    expect(parseTwoWheelerMoneyInput(75000)).toBe(75000);
    expect(parseTwoWheelerMoneyInput(NaN)).toBe(0);
  });
});

describe('down payment scenarios', () => {
  it.each([10, 20, 30, 40])('%i%% of 1,20,000', (pct) => {
    const dp = Math.round((1_20_000 * pct) / 100);
    const loan = twoWheelerLoanRequirement(1_20_000, dp);
    expect(loan).toBe(1_20_000 - dp);
    const fp = twoWheelerFinancingPercent(1_20_000, loan);
    expect(fp).toBeCloseTo(100 - pct, 4);
  });
});

describe('product fields', () => {
  it('resolves vehicle condition from metadata', () => {
    const fields = resolveTwProductFields({
      metadata: { vehicleCondition: 'both' },
    } as any);
    expect(fields.vehicleCondition).toBe('both');
  });

  it('formats condition label', () => {
    expect(formatTwVehicleConditionLabel('new')).toBe('New');
    expect(formatTwVehicleConditionLabel(null)).toBe('Not currently available');
  });

  it('filters catalog by condition', () => {
    const loans = [
      { id: '1', metadata: { vehicleCondition: 'new' } },
      { id: '2', metadata: { vehicleCondition: 'used' } },
      { id: '3', metadata: { vehicleCondition: 'both' } },
    ] as any[];
    const filtered = filterTwLoanCatalog(loans, { vehicleCondition: 'new' });
    expect(filtered.map((l: any) => l.id)).toEqual(['1', '3']);
  });
});

describe('defaults', () => {
  it('has correct number of FAQs', () => {
    expect(TW_DEFAULT_FAQS.length).toBeGreaterThanOrEqual(5);
  });

  it('has correct number of guides', () => {
    expect(TW_DEFAULT_GUIDES.length).toBeGreaterThanOrEqual(3);
  });
});
