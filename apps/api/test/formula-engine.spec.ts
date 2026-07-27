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
});
