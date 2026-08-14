import { describe, expect, it } from 'vitest';
import {
  calculateEmi,
  calculatePrincipalFromEmi,
  estimateAffordableEmi,
  ILLUSTRATIVE_FOIR_RATIO,
} from '@/lib/emi';
import {
  buildPersonalLoanEmiExampleRows,
  illustrativePersonalLoanOfferEmi,
  PERSONAL_LOAN_DECISION_HERO_ASSET,
  PERSONAL_LOAN_EMI_TABLE,
  PERSONAL_LOAN_INTRO,
  PERSONAL_LOAN_RELATED_CALCULATORS,
  PERSONAL_LOAN_TIMELINE_STEPS,
} from '@/lib/personal-loan-page';

describe('personal loan decision page helpers', () => {
  it('keeps intent-specific intro copy', () => {
    expect(PERSONAL_LOAN_INTRO).toContain('monthly EMI');
    expect(PERSONAL_LOAN_INTRO).toContain('available lenders');
  });

  it('uses a personal-loan decision hero asset', () => {
    expect(PERSONAL_LOAN_DECISION_HERO_ASSET).toContain('personal-loan-decision-hero');
  });

  it('builds EMI example rows from the shared engine', () => {
    const rows = buildPersonalLoanEmiExampleRows();
    expect(rows).toHaveLength(PERSONAL_LOAN_EMI_TABLE.amounts.length);
    for (const row of rows) {
      const expected = calculateEmi({
        principal: row.amount,
        annualRatePercent: PERSONAL_LOAN_EMI_TABLE.ratePercent,
        tenureMonths: PERSONAL_LOAN_EMI_TABLE.tenureMonths,
      });
      expect(expected).not.toBeNull();
      expect(row.result.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
    }
  });

  it('estimates affordable EMI without inventing FOIR beyond the illustrative ratio', () => {
    const emi = estimateAffordableEmi({
      monthlyIncome: 100_000,
      existingEmis: 10_000,
    });
    expect(emi).toBe(100_000 * ILLUSTRATIVE_FOIR_RATIO - 10_000);
  });

  it('reverses EMI to an indicative principal', () => {
    const forward = calculateEmi({
      principal: 5_00_000,
      annualRatePercent: 12,
      tenureMonths: 36,
    });
    expect(forward).not.toBeNull();
    const reverse = calculatePrincipalFromEmi({
      monthlyEmi: forward!.monthlyEmi,
      annualRatePercent: 12,
      tenureMonths: 36,
    });
    expect(reverse).not.toBeNull();
    expect(reverse!).toBeCloseTo(5_00_000, 0);
  });

  it('calculates illustrative offer EMI from selected amount and product rate', () => {
    const ok = illustrativePersonalLoanOfferEmi(
      {
        id: '1',
        name: 'Test PL',
        slug: 'test-pl',
        loanType: 'personal',
        interestRateMin: 10.5,
        loanAmountMin: 1_00_000,
        loanAmountMax: 10_00_000,
        tenureMin: 12,
        tenureMax: 60,
      },
      5_00_000,
      60,
    );
    expect(ok.status).toBe('ok');
    if (ok.status === 'ok') {
      const expected = calculateEmi({
        principal: 5_00_000,
        annualRatePercent: 10.5,
        tenureMonths: 60,
      });
      expect(ok.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
    }
  });

  it('does not invent EMI when amount is outside product range', () => {
    const result = illustrativePersonalLoanOfferEmi(
      {
        id: '1',
        name: 'Test PL',
        slug: 'test-pl',
        loanType: 'personal',
        interestRateMin: 11,
        loanAmountMin: 1_00_000,
        loanAmountMax: 3_00_000,
      },
      5_00_000,
      36,
    );
    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.message).toContain('outside displayed product range');
    }
  });

  it('does not invent EMI when rate is missing', () => {
    const result = illustrativePersonalLoanOfferEmi(
      {
        id: '1',
        name: 'Test PL',
        slug: 'test-pl',
        loanType: 'personal',
      },
      5_00_000,
      36,
    );
    expect(result.status).toBe('unavailable');
  });

  it('prioritises personal-loan calculators', () => {
    expect(PERSONAL_LOAN_RELATED_CALCULATORS.map((c) => c.href)).toEqual([
      '/calculators/personal-loan-emi',
      '/calculators/loan-eligibility',
      '/calculators/loan-prepayment',
      '/calculators/debt-planner',
    ]);
  });

  it('defines a personal-loan application timeline', () => {
    expect(PERSONAL_LOAN_TIMELINE_STEPS[0]).toBe('Choose Amount');
    expect(PERSONAL_LOAN_TIMELINE_STEPS.at(-1)).toBe('Disbursement');
    expect(PERSONAL_LOAN_TIMELINE_STEPS).toHaveLength(8);
  });
});
