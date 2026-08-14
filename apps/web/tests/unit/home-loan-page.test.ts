import { describe, expect, it } from 'vitest';
import { calculateEmi } from '@/lib/emi';
import {
  HOME_LOAN_DECISION_HERO_ASSET,
  HOME_LOAN_TIMELINE_STEPS,
  clampHomeLoanDownPayment,
  estimateHomeAffordability,
  estimateHomeLoanBalanceTransfer,
  estimateHomeLoanPrepaymentImpact,
  formatRateTypeLabel,
  homeLoanLtvPercent,
  homeLoanRequirement,
  illustrativeHomeLoanOfferEmi,
} from '@/lib/home-loan-page';

describe('home loan decision page helpers', () => {
  it('computes loan requirement from property and down payment', () => {
    expect(homeLoanRequirement(75_00_000, 15_00_000)).toBe(60_00_000);
    expect(homeLoanRequirement(50_00_000, 60_00_000)).toBe(0);
  });

  it('clamps down payment to property value', () => {
    expect(clampHomeLoanDownPayment(50_00_000, 60_00_000)).toBe(50_00_000);
    expect(clampHomeLoanDownPayment(50_00_000, -1)).toBe(0);
  });

  it('computes LTV as loan divided by property times 100', () => {
    expect(homeLoanLtvPercent(75_00_000, 60_00_000)).toBeCloseTo(80, 4);
    expect(homeLoanLtvPercent(0, 60_00_000)).toBeNull();
  });

  it('formats rate type labels without fabricating unknown values', () => {
    expect(formatRateTypeLabel('floating')).toBe('Floating');
    expect(formatRateTypeLabel('FIXED')).toBe('Fixed');
    expect(formatRateTypeLabel(null)).toBe('Not currently available');
  });

  it('uses a home-loan decision hero asset with cache bust', () => {
    expect(HOME_LOAN_DECISION_HERO_ASSET).toContain('home-loan-decision-hero');
    expect(HOME_LOAN_DECISION_HERO_ASSET).toContain('v=2');
  });

  it('calculates illustrative offer EMI from loan requirement and product rate', () => {
    const ok = illustrativeHomeLoanOfferEmi(
      {
        id: '1',
        name: 'Test HL',
        slug: 'test-hl',
        loanType: 'home',
        interestRateMin: 8.5,
        loanAmountMin: 10_00_000,
        loanAmountMax: 1_00_00_000,
        tenureMin: 60,
        tenureMax: 360,
      },
      60_00_000,
      240,
    );
    expect(ok.status).toBe('ok');
    if (ok.status === 'ok') {
      const expected = calculateEmi({
        principal: 60_00_000,
        annualRatePercent: 8.5,
        tenureMonths: 240,
      });
      expect(ok.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
    }
  });

  it('does not invent EMI when amount is outside product range', () => {
    const result = illustrativeHomeLoanOfferEmi(
      {
        id: '1',
        name: 'Test HL',
        slug: 'test-hl',
        loanType: 'home',
        interestRateMin: 8.5,
        loanAmountMin: 10_00_000,
        loanAmountMax: 50_00_000,
      },
      60_00_000,
      240,
    );
    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.message).toContain('outside displayed product range');
    }
  });

  it('returns prepayment interest saved when inputs are valid', () => {
    const impact = estimateHomeLoanPrepaymentImpact({
      outstanding: 50_00_000,
      annualRatePercent: 8.5,
      remainingMonths: 240,
      prepaymentAmount: 5_00_000,
      mode: 'reduce-tenure',
    });
    expect(impact).not.toBeNull();
    expect(impact!.interestSaved).toBeGreaterThan(0);
    expect(impact!.monthsSaved).toBeGreaterThan(0);
  });

  it('computes balance transfer net savings as gross interest saved minus transfer cost', () => {
    const impact = estimateHomeLoanBalanceTransfer({
      outstanding: 50_00_000,
      currentRatePercent: 9,
      newRatePercent: 8,
      remainingMonths: 240,
      transferCost: 25_000,
    });
    expect(impact).not.toBeNull();
    expect(impact!.netSavings).toBeCloseTo(impact!.grossInterestSaved - impact!.transferCost, 4);
  });

  it('defines a ten-step home loan application timeline', () => {
    expect(HOME_LOAN_TIMELINE_STEPS[0]).toBe('Set Property Budget');
    expect(HOME_LOAN_TIMELINE_STEPS[3]).toBe('Compare Home Loans');
    expect(HOME_LOAN_TIMELINE_STEPS.at(-1)).toBe('Disbursement');
    expect(HOME_LOAN_TIMELINE_STEPS).toHaveLength(10);
  });

  it('estimates indicative home affordability from FOIR and reverse EMI', () => {
    const result = estimateHomeAffordability({
      monthlyIncome: 1_00_000,
      existingEmis: 15_000,
      availableDownPayment: 15_00_000,
      annualRatePercent: 8.5,
      tenureYears: 20,
      foirRatio: 0.4,
    });
    expect(result).not.toBeNull();
    expect(result!.comfortableEmi).toBe(25_000);
    expect(result!.loanCapacity).toBeGreaterThan(0);
    expect(result!.propertyBudget).toBe(result!.loanCapacity + 15_00_000);
  });

  it('returns null affordability when EMI capacity is zero', () => {
    const result = estimateHomeAffordability({
      monthlyIncome: 50_000,
      existingEmis: 25_000,
      availableDownPayment: 10_00_000,
      annualRatePercent: 8.5,
      tenureYears: 20,
      foirRatio: 0.4,
    });
    expect(result).toBeNull();
  });

  it('keeps EMI math consistent across common home-loan tenures', () => {
    for (const years of [10, 15, 20, 25, 30] as const) {
      const result = calculateEmi({
        principal: 60_00_000,
        annualRatePercent: 8.5,
        tenureMonths: years * 12,
      });
      expect(result).not.toBeNull();
      expect(result!.totalRepayment).toBeCloseTo(result!.monthlyEmi * years * 12, 4);
      expect(result!.totalInterest).toBeCloseTo(result!.totalRepayment - 60_00_000, 4);
    }
  });

  it('handles zero-interest EMI without fabricating values', () => {
    const result = calculateEmi({
      principal: 60_00_000,
      annualRatePercent: 0,
      tenureMonths: 240,
    });
    expect(result).not.toBeNull();
    expect(result!.monthlyEmi).toBeCloseTo(25_000, 4);
    expect(result!.totalInterest).toBeCloseTo(0, 4);
  });

  it('rejects prepayment greater than or equal to outstanding principal', () => {
    expect(
      estimateHomeLoanPrepaymentImpact({
        outstanding: 50_00_000,
        annualRatePercent: 8.5,
        remainingMonths: 240,
        prepaymentAmount: 50_00_000,
        mode: 'reduce-tenure',
      }),
    ).toBeNull();
    expect(
      estimateHomeLoanPrepaymentImpact({
        outstanding: 50_00_000,
        annualRatePercent: 8.5,
        remainingMonths: 240,
        prepaymentAmount: 55_00_000,
        mode: 'reduce-emi',
      }),
    ).toBeNull();
  });

  it('reports balance transfer net cost increase when new rate is higher', () => {
    const impact = estimateHomeLoanBalanceTransfer({
      outstanding: 50_00_000,
      currentRatePercent: 8,
      newRatePercent: 9,
      remainingMonths: 240,
      transferCost: 25_000,
    });
    expect(impact).not.toBeNull();
    expect(impact!.netSavings).toBeLessThan(0);
    expect(impact!.netSavings).toBeCloseTo(impact!.grossInterestSaved - impact!.transferCost, 4);
  });

  it('includes zero transfer fee in net savings math', () => {
    const impact = estimateHomeLoanBalanceTransfer({
      outstanding: 50_00_000,
      currentRatePercent: 9,
      newRatePercent: 8,
      remainingMonths: 120,
      transferCost: 0,
    });
    expect(impact).not.toBeNull();
    expect(impact!.transferCost).toBe(0);
    expect(impact!.netSavings).toBeCloseTo(impact!.grossInterestSaved, 4);
    expect(impact!.breakEvenMonths).toBe(0);
  });

  it('matches QA scenario A: ₹75L property, 20% down, 20-year tenure LTV', () => {
    const property = 75_00_000;
    const down = 15_00_000;
    const loan = homeLoanRequirement(property, down);
    expect(loan).toBe(60_00_000);
    expect(homeLoanLtvPercent(property, loan)).toBeCloseTo(80, 4);
    const emi = calculateEmi({
      principal: loan,
      annualRatePercent: 8.5,
      tenureMonths: 240,
    });
    expect(emi).not.toBeNull();
    expect(emi!.monthlyEmi).toBeGreaterThan(0);
  });

  it('matches QA scenario C: ₹1Cr property, 10% down keeps non-negative loan', () => {
    const property = 1_00_00_000;
    const down = clampHomeLoanDownPayment(property, 10_00_000);
    expect(down).toBe(10_00_000);
    expect(homeLoanRequirement(property, down)).toBe(90_00_000);
    expect(homeLoanRequirement(property, 1_20_00_000)).toBe(0);
  });
});
