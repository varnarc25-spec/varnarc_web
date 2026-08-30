import { describe, expect, it } from 'vitest';
import {
  PEAK_CASH_FACTOR,
  RECOMMENDED_CONTINGENCY_PERCENT,
  calculateConstructionAffordability,
} from '../src/affordability-cost';

const base = {
  estimatedProjectCost: 5_000_000,
  availableSavings: 2_000_000,
  expectedLoanAmount: 3_500_000,
  constructionDurationMonths: 18,
  contingencyReservePercent: 10,
  contingencyAlreadyPercent: 10,
};

describe('calculateConstructionAffordability', () => {
  it('computes funds, need, surplus/gap and cash figures', () => {
    const r = calculateConstructionAffordability(base);
    expect(r.estimatedProjectCost).toBe(5_000_000);
    expect(r.contingencyReserveAmount).toBe(500_000);
    expect(r.totalFundingNeed).toBe(5_500_000);
    expect(r.availableFunds).toBe(5_500_000);
    expect(r.status).toBe('balanced');
    expect(r.monthlyCashRequirement).toBe(Math.round(5_500_000 / 18));
    expect(r.peakCashRequirement).toBe(Math.round(r.monthlyCashRequirement * PEAK_CASH_FACTOR));
    expect(r.recommendedContingencyPercent).toBe(RECOMMENDED_CONTINGENCY_PERCENT);
    expect(r.disclaimer.toLowerCase()).toMatch(/not personalized|not.*advice/);
  });

  it('flags a funding gap when funds are short', () => {
    const r = calculateConstructionAffordability({
      ...base,
      availableSavings: 500_000,
      expectedLoanAmount: 2_000_000,
    });
    expect(r.fundingDifference).toBeLessThan(0);
    expect(r.status).toBe('gap');
  });

  it('flags a surplus when funds exceed need', () => {
    const r = calculateConstructionAffordability({
      ...base,
      availableSavings: 4_000_000,
      expectedLoanAmount: 4_000_000,
    });
    expect(r.fundingDifference).toBeGreaterThan(0);
    expect(r.status).toBe('surplus');
  });

  it('shows financing burden only when EMI and income are provided', () => {
    const none = calculateConstructionAffordability(base);
    expect(none.financing).toBeNull();

    const withFin = calculateConstructionAffordability({
      ...base,
      monthlyIncome: 150_000,
      monthlyEmi: 45_000,
    });
    expect(withFin.financing).not.toBeNull();
    expect(withFin.financing!.emiToIncomePercent).toBe(30);
    expect(withFin.financing!.residualIncomeAfterEmi).toBe(105_000);
    expect(withFin.financing!.note.toLowerCase()).toMatch(/informational|not a credit/);
  });

  it('scales monthly cash with duration', () => {
    const short = calculateConstructionAffordability({
      ...base,
      constructionDurationMonths: 12,
    });
    const long = calculateConstructionAffordability({
      ...base,
      constructionDurationMonths: 24,
    });
    expect(short.monthlyCashRequirement).toBeGreaterThan(long.monthlyCashRequirement);
  });
});
