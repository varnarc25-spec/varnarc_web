import { describe, expect, it } from 'vitest';
import { calculateEmi, EMI_LIMITS } from '@/lib/emi';
import {
  LAP_DECISION_HERO_ASSET,
  LAP_DEFAULT_GUIDES,
  LAP_DEFAULT_ILLUSTRATIVE_LTV,
  LAP_MAX_REQUIRED_LOAN,
  compareLapTenures,
  estimateLapBorrowingCapacity,
  estimateLapEmi,
  estimateLapIncomeCapacity,
  estimateLapObligationRatio,
  estimateLapPrepaymentImpact,
  estimateLapTotalCost,
  lapLtvPercent,
  parseLapMoneyInput,
} from '@/lib/loan-against-property-page';
import {
  LAP_DEFAULT_SCHEMES,
  evaluateLapSchemeRelevance,
  resolveLapGovernmentSchemes,
} from '@/lib/loan-against-property-schemes';

describe('LAP LTV', () => {
  it('computes loan ÷ property value × 100', () => {
    expect(lapLtvPercent(1_00_00_000, 40_00_000)).toBeCloseTo(40, 6);
  });

  it('matches additional 40% scenarios', () => {
    expect(lapLtvPercent(75_00_000, 30_00_000)).toBeCloseTo(40, 6);
    expect(lapLtvPercent(2_00_00_000, 80_00_000)).toBeCloseTo(40, 6);
  });

  it('returns null for zero / invalid property value', () => {
    expect(lapLtvPercent(0, 40_00_000)).toBeNull();
    expect(lapLtvPercent(-1, 40_00_000)).toBeNull();
  });

  it('clamps negative loan to zero LTV', () => {
    expect(lapLtvPercent(1_00_00_000, -5)).toBeCloseTo(0, 6);
  });

  it('handles loan greater than property value and decimals without NaN', () => {
    const over = lapLtvPercent(50_00_000, 80_00_000);
    expect(over).toBeCloseTo(160, 6);
    expect(Number.isFinite(over!)).toBe(true);
    expect(lapLtvPercent(1_00_00_000.5, 40_00_000.25)).toBeCloseTo(40.0000025, 4);
  });
});

describe('parseLapMoneyInput', () => {
  it('normalizes Indian currency formatting', () => {
    expect(parseLapMoneyInput('10000000')).toBe(1_00_00_000);
    expect(parseLapMoneyInput('1,00,00,000')).toBe(1_00_00_000);
    expect(parseLapMoneyInput('₹1,00,00,000')).toBe(1_00_00_000);
    expect(parseLapMoneyInput('')).toBe(0);
    expect(parseLapMoneyInput('abc')).toBe(0);
  });
});

describe('LAP borrowing capacity', () => {
  it('computes indicative max loan and headroom', () => {
    const cap = estimateLapBorrowingCapacity({
      propertyValue: 1_00_00_000,
      illustrativeLtvPercent: 60,
      requestedLoan: 40_00_000,
    });
    expect(cap).not.toBeNull();
    expect(cap!.indicativeMaxLoan).toBeCloseTo(60_00_000, 4);
    expect(cap!.headroom).toBeCloseTo(20_00_000, 4);
    expect(cap!.exceedsCapacity).toBe(false);
    expect(cap!.remainingPropertyValue).toBeCloseTo(40_00_000, 4);
  });

  it('flags when requested exceeds capacity without saying rejected', () => {
    const cap = estimateLapBorrowingCapacity({
      propertyValue: 1_00_00_000,
      illustrativeLtvPercent: 50,
      requestedLoan: 60_00_000,
    });
    expect(cap!.exceedsCapacity).toBe(true);
    expect(cap!.headroom).toBeLessThan(0);
  });

  it('rejects zero property value / LTV', () => {
    expect(
      estimateLapBorrowingCapacity({
        propertyValue: 0,
        illustrativeLtvPercent: 60,
        requestedLoan: 10,
      }),
    ).toBeNull();
    expect(
      estimateLapBorrowingCapacity({
        propertyValue: 1_00_00_000,
        illustrativeLtvPercent: 0,
        requestedLoan: 10,
      }),
    ).toBeNull();
  });

  it('handles very high property values', () => {
    const cap = estimateLapBorrowingCapacity({
      propertyValue: 50_00_00_000,
      illustrativeLtvPercent: LAP_DEFAULT_ILLUSTRATIVE_LTV,
      requestedLoan: 10_00_00_000,
    });
    expect(cap!.indicativeMaxLoan).toBeCloseTo(30_00_00_000, 2);
  });

  it('keeps required loan max aligned with EMI engine', () => {
    expect(LAP_MAX_REQUIRED_LOAN).toBe(EMI_LIMITS.amountMax);
  });
});

describe('FOIR / obligation ratio', () => {
  it('computes (debt ÷ income) × 100', () => {
    const result = estimateLapObligationRatio({
      monthlyIncome: 1_00_000,
      existingEmis: 20_000,
      otherObligations: 5_000,
      proposedEmi: 25_000,
    });
    expect(result!.totalMonthlyDebt).toBe(50_000);
    expect(result!.remainingMonthlyIncome).toBe(50_000);
    expect(result!.obligationRatioPercent).toBeCloseTo(50, 6);
  });

  it('matches documented 2L income scenario', () => {
    const result = estimateLapObligationRatio({
      monthlyIncome: 2_00_000,
      existingEmis: 30_000,
      otherObligations: 10_000,
      proposedEmi: 50_000,
    });
    expect(result!.totalMonthlyDebt).toBe(90_000);
    expect(result!.remainingMonthlyIncome).toBe(1_10_000);
    expect(result!.obligationRatioPercent).toBeCloseTo(45, 6);
  });

  it('handles obligations greater than income without NaN', () => {
    const result = estimateLapObligationRatio({
      monthlyIncome: 50_000,
      existingEmis: 40_000,
      otherObligations: 20_000,
      proposedEmi: 30_000,
    });
    expect(result!.totalMonthlyDebt).toBe(90_000);
    expect(result!.remainingMonthlyIncome).toBeLessThan(0);
    expect(Number.isFinite(result!.obligationRatioPercent!)).toBe(true);
    expect(result!.obligationRatioPercent).toBeCloseTo(180, 6);
  });

  it('returns null when income is missing', () => {
    expect(
      estimateLapObligationRatio({
        monthlyIncome: 0,
        existingEmis: 10_000,
        proposedEmi: 10_000,
      }),
    ).toBeNull();
  });

  it('estimates income-based EMI capacity via illustrative FOIR', () => {
    const capacity = estimateLapIncomeCapacity({
      monthlyIncome: 1_50_000,
      existingEmis: 25_000,
      annualRatePercent: 10.5,
      tenureMonths: 120,
    });
    expect(capacity).not.toBeNull();
    expect(capacity!.comfortableMonthlyEmi).toBeGreaterThan(0);
    expect(capacity!.illustrativeLoanFromIncome).toBeGreaterThan(0);
  });
});

describe('LAP EMI / tenure / total cost', () => {
  it('matches shared calculateEmi', () => {
    const emi = estimateLapEmi({
      loanAmount: 40_00_000,
      annualRatePercent: 10.5,
      tenureMonths: 120,
    });
    const expected = calculateEmi({
      principal: 40_00_000,
      annualRatePercent: 10.5,
      tenureMonths: 120,
    });
    expect(emi!.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
    expect(emi!.totalInterest).toBeCloseTo(expected!.totalInterest, 4);
    expect(emi!.totalRepayment).toBeCloseTo(expected!.totalRepayment, 4);
  });

  it('handles 0% rate as principal / n', () => {
    const emi = estimateLapEmi({
      loanAmount: 12_00_000,
      annualRatePercent: 0,
      tenureMonths: 120,
    });
    expect(emi).not.toBeNull();
    expect(emi!.monthlyEmi).toBeCloseTo(10_000, 6);
    expect(emi!.totalInterest).toBeCloseTo(0, 6);
    expect(emi!.totalRepayment).toBeCloseTo(12_00_000, 6);
  });

  it.each([
    [5_00_000, 8, 60],
    [10_00_000, 10.5, 120],
    [25_00_000, 12, 180],
    [40_00_000, 5, 240],
    [1_00_00_000, 15, 120],
  ] as const)('EMI matrix amount=%i rate=%f tenureMonths=%i', (amount, rate, months) => {
    const emi = estimateLapEmi({
      loanAmount: amount,
      annualRatePercent: rate,
      tenureMonths: months,
    });
    const expected = calculateEmi({
      principal: amount,
      annualRatePercent: rate,
      tenureMonths: months,
    });
    expect(emi).not.toBeNull();
    expect(emi!.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
    expect(emi!.totalInterest).toBeCloseTo(expected!.totalInterest, 4);
    expect(emi!.totalRepayment).toBeCloseTo(expected!.totalRepayment, 4);
    expect(Number.isFinite(emi!.monthlyEmi)).toBe(true);
  });

  it('compares tenure options', () => {
    const rows = compareLapTenures({
      loanAmount: 40_00_000,
      annualRatePercent: 10.5,
    });
    expect(rows.map((r) => r.years)).toEqual([5, 10, 15, 20]);
    expect(rows[0]!.emi!.monthlyEmi).toBeGreaterThan(rows[3]!.emi!.monthlyEmi);
    expect(rows[0]!.emi!.totalInterest).toBeLessThan(rows[3]!.emi!.totalInterest);
  });

  it('keeps unknown fees null (not zero)', () => {
    const cost = estimateLapTotalCost({
      principal: 40_00_000,
      annualRatePercent: 10.5,
      tenureMonths: 120,
      knownFees: null,
    });
    expect(cost!.feesKnown).toBe(false);
    expect(cost!.knownFees).toBeNull();
    expect(cost!.totalFinancingCost).toBeCloseTo(cost!.totalInterest, 4);
  });

  it('includes known fees when provided', () => {
    const cost = estimateLapTotalCost({
      principal: 40_00_000,
      annualRatePercent: 10.5,
      tenureMonths: 120,
      knownFees: 15_000,
    });
    expect(cost!.feesKnown).toBe(true);
    expect(cost!.knownFees).toBe(15_000);
    expect(cost!.totalFinancingCost).toBeCloseTo(cost!.totalInterest + 15_000, 4);
  });

  it('handles decimal rates', () => {
    const emi = estimateLapEmi({
      loanAmount: 10_00_000,
      annualRatePercent: 9.25,
      tenureMonths: 84,
    });
    expect(emi).not.toBeNull();
    expect(emi!.monthlyEmi).toBeGreaterThan(0);
  });

  it('handles long tenure', () => {
    const emi = estimateLapEmi({
      loanAmount: 50_00_000,
      annualRatePercent: 10,
      tenureMonths: 240,
    });
    expect(emi!.monthlyEmi).toBeGreaterThan(0);
    expect(emi!.totalInterest).toBeGreaterThan(0);
  });
});

describe('LAP prepayment', () => {
  it('estimates interest saved and net savings when charge known', () => {
    const impact = estimateLapPrepaymentImpact({
      outstanding: 30_00_000,
      annualRatePercent: 10.5,
      remainingMonths: 96,
      prepaymentAmount: 5_00_000,
      mode: 'reduce-tenure',
      knownCharge: 10_000,
    });
    expect(impact).not.toBeNull();
    expect(impact!.interestSaved).toBeGreaterThan(0);
    expect(impact!.knownCharge).toBe(10_000);
    expect(impact!.netSavings).toBeCloseTo(Math.max(0, impact!.interestSaved - 10_000), 4);
  });

  it('leaves net savings null when charge unknown', () => {
    const impact = estimateLapPrepaymentImpact({
      outstanding: 30_00_000,
      annualRatePercent: 10.5,
      remainingMonths: 96,
      prepaymentAmount: 5_00_000,
      mode: 'reduce-emi',
      knownCharge: null,
    });
    expect(impact!.knownCharge).toBeNull();
    expect(impact!.netSavings).toBeNull();
  });

  it('returns null for zero / full / over-outstanding prepayment', () => {
    const base = {
      outstanding: 30_00_000,
      annualRatePercent: 10.5,
      remainingMonths: 96,
      mode: 'reduce-tenure' as const,
      knownCharge: null,
    };
    expect(estimateLapPrepaymentImpact({ ...base, prepaymentAmount: 0 })).toBeNull();
    expect(estimateLapPrepaymentImpact({ ...base, prepaymentAmount: 30_00_000 })).toBeNull();
    expect(estimateLapPrepaymentImpact({ ...base, prepaymentAmount: 35_00_000 })).toBeNull();
  });

  it('never reports negative net savings when charge exceeds interest saved', () => {
    const impact = estimateLapPrepaymentImpact({
      outstanding: 30_00_000,
      annualRatePercent: 10.5,
      remainingMonths: 96,
      prepaymentAmount: 50_000,
      mode: 'reduce-emi',
      knownCharge: 50_00_000,
    });
    expect(impact).not.toBeNull();
    expect(impact!.netSavings).toBe(0);
  });
});

describe('LAP regulatory schemes', () => {
  it('resolves default schemes without invented LTV caps', () => {
    const schemes = resolveLapGovernmentSchemes(null);
    expect(schemes.length).toBeGreaterThan(0);
    expect(schemes[0]!.officialSourceUrl).toContain('rbi.org.in');
    expect(LAP_DEFAULT_SCHEMES.every((s) => s.incomeLimitInr == null)).toBe(true);
  });

  it('evaluates relevance without approval language', () => {
    const result = evaluateLapSchemeRelevance(LAP_DEFAULT_SCHEMES[0]!, {
      locationIndia: true,
      hasOwnedProperty: true,
      propertyValueKnown: true,
      requiredLoanInr: 40_00_000,
    });
    expect(['may_be_relevant', 'matched', 'insufficient_information']).toContain(result.status);
    expect(result.explanation.toLowerCase()).not.toContain('approved');
  });
});

describe('LAP page assets', () => {
  it('uses hub hero and guide family paths', () => {
    expect(LAP_DECISION_HERO_ASSET).toContain('loan-against-property-decision-hero');
    expect(LAP_DEFAULT_GUIDES).toHaveLength(8);
    expect(
      LAP_DEFAULT_GUIDES.every((g) =>
        g.imageUrl.includes('/hub/finance/loan-against-property-guides/'),
      ),
    ).toBe(true);
  });
});
