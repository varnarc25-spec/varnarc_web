import { describe, expect, it } from 'vitest';
import { executeFormula } from '../src/modules/calculator/formula-engine';

describe('formula-engine', () => {
  it('computes standard EMI', async () => {
    const formula = JSON.stringify({
      outputs: {
        monthlyRate: 'annualRate / 12 / 100',
        emi: 'principal * monthlyRate * pow(1 + monthlyRate, tenureMonths) / (pow(1 + monthlyRate, tenureMonths) - 1)',
      },
    });
    const outputs = await executeFormula(formula, {
      principal: 1_000_000,
      annualRate: 12,
      tenureMonths: 60,
    });
    expect(outputs.emi).toBeGreaterThan(22_000);
    expect(outputs.emi).toBeLessThan(23_000);
  });

  it('computes tenure from desired EMI using ln', async () => {
    const formula = JSON.stringify({
      outputs: {
        monthlyRate: 'annualRate / 12 / 100',
        tenureMonths:
          'ln(desiredEmi / max(desiredEmi - loanAmount * monthlyRate, 0.01)) / ln(1 + monthlyRate)',
      },
    });
    const outputs = await executeFormula(formula, {
      loanAmount: 1_000_000,
      annualRate: 10,
      desiredEmi: 25_000,
    });
    expect(outputs.tenureMonths).toBeGreaterThan(40);
    expect(outputs.tenureMonths).toBeLessThan(55);
  });

  it('resolves derived outputs regardless of declaration order', async () => {
    const formula = JSON.stringify({
      outputs: {
        maturity: 'annualDeposit * ((pow(1 + rate, years) - 1) / rate) * (1 + rate)',
        rate: 'interestRate / 100',
        invested: 'annualDeposit * years',
      },
    });
    const outputs = await executeFormula(formula, {
      annualDeposit: 150_000,
      interestRate: 7.1,
      years: 15,
    });
    expect(outputs.maturity).toBeGreaterThan(outputs.invested);
    expect(outputs.rate).toBeCloseTo(0.071);
  });

  it('computes age from date of birth and end date', async () => {
    const formula = JSON.stringify({ type: 'age', outputs: {} });
    const outputs = await executeFormula(formula, {
      dateOfBirth: '1990-06-15',
      endDate: '2026-07-27',
    });
    expect(outputs.ageYears).toBe(36);
    expect(outputs.ageMonths).toBe(36 * 12 + 1);
    expect(outputs.ageDays).toBe(12);
    expect(outputs.totalDays).toBeGreaterThan(13_000);
    expect(outputs.nextBirthdayDays).toBeGreaterThan(0);
  });
});
