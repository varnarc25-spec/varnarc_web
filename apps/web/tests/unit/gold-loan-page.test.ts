import { describe, expect, it } from 'vitest';
import { calculateEmi } from '@/lib/emi';
import {
  GOLD_LOAN_DECISION_HERO_ASSET,
  GOLD_LOAN_DEFAULT_GUIDES,
  comparePurityForWeight,
  estimateBorrowingCapacity,
  estimateGoldLoanEmi,
  estimateGoldRepayment,
  estimateGoldRequired,
  estimateGoldTotalCost,
  estimateGoldValue,
  purityFactorFromKarat,
  stressGoldValueLtv,
} from '@/lib/gold-loan-page';
import {
  GOLD_LOAN_DEFAULT_SCHEMES,
  evaluateGoldSchemeRelevance,
  resolveGoldGovernmentSchemes,
} from '@/lib/gold-loan-schemes';

describe('gold purity conversion', () => {
  it('converts karat to fine-gold factor', () => {
    expect(purityFactorFromKarat(24)).toBeCloseTo(1, 8);
    expect(purityFactorFromKarat(22)).toBeCloseTo(22 / 24, 8);
    expect(purityFactorFromKarat(18)).toBeCloseTo(0.75, 8);
  });

  it('rejects invalid karat', () => {
    expect(purityFactorFromKarat(0)).toBeNull();
    expect(purityFactorFromKarat(-1)).toBeNull();
    expect(purityFactorFromKarat(25)).toBeNull();
    expect(purityFactorFromKarat(NaN)).toBeNull();
  });
});

describe('gold value calculation', () => {
  it('estimates value from weight × purity × reference rate', () => {
    const result = estimateGoldValue({
      grossWeightG: 10,
      karat: 24,
      referenceRatePerG: 7000,
    });
    expect(result).not.toBeNull();
    expect(result!.estimatedGoldValue).toBeCloseTo(70_000, 4);
    expect(result!.eligibleWeightG).toBe(10);
  });

  it('applies eligible-weight fraction for deductions', () => {
    const result = estimateGoldValue({
      grossWeightG: 20,
      karat: 24,
      referenceRatePerG: 5000,
      eligibleWeightFraction: 0.8,
    });
    expect(result!.eligibleWeightG).toBeCloseTo(16, 6);
    expect(result!.estimatedGoldValue).toBeCloseTo(80_000, 4);
  });

  it('handles zero / negative / malformed inputs', () => {
    expect(estimateGoldValue({ grossWeightG: 0, karat: 22, referenceRatePerG: 7000 })).toBeNull();
    expect(estimateGoldValue({ grossWeightG: -5, karat: 22, referenceRatePerG: 7000 })).toBeNull();
    expect(estimateGoldValue({ grossWeightG: 10, karat: 22, referenceRatePerG: 0 })).toBeNull();
  });
});

describe('LTV / borrowing capacity', () => {
  it('computes indicative capacity and headroom', () => {
    const cap = estimateBorrowingCapacity({
      estimatedGoldValue: 1_00_000,
      illustrativeLtvPercent: 75,
      requestedLoan: 50_000,
    });
    expect(cap!.indicativeMaxLoan).toBeCloseTo(75_000, 4);
    expect(cap!.headroom).toBeCloseTo(25_000, 4);
    expect(cap!.exceedsCapacity).toBe(false);
  });

  it('flags when requested exceeds capacity', () => {
    const cap = estimateBorrowingCapacity({
      estimatedGoldValue: 1_00_000,
      illustrativeLtvPercent: 75,
      requestedLoan: 80_000,
    });
    expect(cap!.exceedsCapacity).toBe(true);
  });
});

describe('reverse gold required', () => {
  it('estimates grams needed for a required loan', () => {
    // loan 75k, LTV 75% → need 100k gold value; 24K @ 10k/g → 10g
    const grams = estimateGoldRequired({
      requiredLoan: 75_000,
      karat: 24,
      referenceRatePerG: 10_000,
      illustrativeLtvPercent: 75,
    });
    expect(grams).toBeCloseTo(10, 4);
  });

  it('rejects invalid reverse inputs', () => {
    expect(
      estimateGoldRequired({
        requiredLoan: 0,
        karat: 22,
        referenceRatePerG: 7000,
        illustrativeLtvPercent: 75,
      }),
    ).toBeNull();
    expect(
      estimateGoldRequired({
        requiredLoan: 1_00_000,
        karat: 22,
        referenceRatePerG: 7000,
        illustrativeLtvPercent: 0,
      }),
    ).toBeNull();
  });
});

describe('purity comparison', () => {
  it('shows higher value for higher karat at same weight', () => {
    const rows = comparePurityForWeight({
      grossWeightG: 20,
      referenceRatePerG: 6000,
    });
    expect(rows).toHaveLength(4);
    expect(rows[0]!.karat).toBe(18);
    expect(rows[3]!.karat).toBe(24);
    expect(rows[3]!.estimatedGoldValue).toBeGreaterThan(rows[0]!.estimatedGoldValue);
  });
});

describe('gold repayment structures', () => {
  it('EMI matches shared calculateEmi', () => {
    const repayment = estimateGoldRepayment({
      principal: 3_00_000,
      annualRatePercent: 10,
      tenureMonths: 12,
      mode: 'emi',
    });
    const expected = calculateEmi({
      principal: 3_00_000,
      annualRatePercent: 10,
      tenureMonths: 12,
    });
    expect(repayment).not.toBeNull();
    expect(expected).not.toBeNull();
    expect(repayment!.periodicPayment).toBeCloseTo(expected!.monthlyEmi, 6);
    expect(repayment!.totalInterest).toBeCloseTo(expected!.totalInterest, 4);
    expect(repayment!.totalRepayment).toBeCloseTo(expected!.totalRepayment, 4);
    expect(repayment!.principalAtEnd).toBe(0);
  });

  it('models interest-only and bullet educational structures', () => {
    const interestOnly = estimateGoldRepayment({
      principal: 1_20_000,
      annualRatePercent: 12,
      tenureMonths: 12,
      mode: 'interest_only',
    });
    expect(interestOnly!.periodicPayment).toBeCloseTo(1_200, 4);
    expect(interestOnly!.totalInterest).toBeCloseTo(14_400, 4);
    expect(interestOnly!.principalAtEnd).toBe(1_20_000);

    const bullet = estimateGoldRepayment({
      principal: 1_00_000,
      annualRatePercent: 12,
      tenureMonths: 12,
      mode: 'bullet',
    });
    expect(bullet!.periodicPayment).toBeNull();
    expect(bullet!.totalInterest).toBeCloseTo(12_000, 4);
    expect(bullet!.totalRepayment).toBeCloseTo(1_12_000, 4);
  });

  it('rejects invalid repayment inputs', () => {
    expect(
      estimateGoldRepayment({
        principal: 0,
        annualRatePercent: 10,
        tenureMonths: 12,
        mode: 'emi',
      }),
    ).toBeNull();
    expect(
      estimateGoldRepayment({
        principal: 1_00_000,
        annualRatePercent: -1,
        tenureMonths: 12,
        mode: 'emi',
      }),
    ).toBeNull();
  });
});

describe('total cost and unknown fees', () => {
  it('adds known fees to total repayment', () => {
    const cost = estimateGoldTotalCost({
      principal: 1_00_000,
      annualRatePercent: 12,
      tenureMonths: 12,
      mode: 'bullet',
      knownFees: 1_000,
    });
    expect(cost!.feesKnown).toBe(true);
    expect(cost!.knownFees).toBe(1_000);
    expect(cost!.totalRepayment).toBeCloseTo(1_13_000, 4);
  });

  it('does not treat unknown fees as ₹0', () => {
    const cost = estimateGoldTotalCost({
      principal: 1_00_000,
      annualRatePercent: 12,
      tenureMonths: 12,
      mode: 'bullet',
      knownFees: null,
    });
    expect(cost!.feesKnown).toBe(false);
    expect(cost!.knownFees).toBeNull();
    expect(cost!.totalRepayment).toBeCloseTo(1_12_000, 4);
  });
});

describe('value-change / resulting LTV scenarios', () => {
  it('recalculates illustrative LTV for stress scenarios', () => {
    const rows = stressGoldValueLtv({
      currentGoldValue: 1_00_000,
      outstandingLoan: 70_000,
      customMultiplier: 0.8,
    });
    expect(rows.find((r) => r.id === 'current')!.resultingLtvPercent).toBeCloseTo(70, 4);
    expect(rows.find((r) => r.id === 'minus10')!.resultingLtvPercent).toBeCloseTo(
      (70_000 / 90_000) * 100,
      4,
    );
    expect(rows.find((r) => r.id === 'custom')!.resultingLtvPercent).toBeCloseTo(87.5, 4);
  });

  it('handles zero gold value without inventing LTV', () => {
    const rows = stressGoldValueLtv({
      currentGoldValue: 0,
      outstandingLoan: 50_000,
    });
    expect(rows[0]!.resultingLtvPercent).toBeNull();
  });
});

describe('gold loan EMI wrapper', () => {
  it('matches shared EMI engine', () => {
    const emi = estimateGoldLoanEmi({
      loanAmount: 2_00_000,
      annualRatePercent: 10,
      tenureMonths: 24,
    });
    const expected = calculateEmi({
      principal: 2_00_000,
      annualRatePercent: 10,
      tenureMonths: 24,
    });
    expect(emi!.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 6);
  });
});

describe('gold loan regulatory seed architecture', () => {
  it('resolves default schemes without inventing numeric LTV caps in seed copy', () => {
    const schemes = resolveGoldGovernmentSchemes(null);
    expect(schemes.length).toBeGreaterThan(0);
    expect(GOLD_LOAN_DEFAULT_SCHEMES[0]!.officialSourceUrl).toMatch(/^https?:\/\//);
    expect(GOLD_LOAN_DEFAULT_SCHEMES[0]!.lastVerifiedAt).toBeTruthy();
    const joined = schemes.map((s) => `${s.description} ${(s.keyRules ?? []).join(' ')}`).join(' ');
    expect(joined).not.toMatch(/\b\d{2}%\s*LTV\b/i);
  });

  it('evaluates relevance without approval language', () => {
    const scheme = GOLD_LOAN_DEFAULT_SCHEMES[0]!;
    const result = evaluateGoldSchemeRelevance(scheme, {
      locationIndia: true,
      hasGoldToPledge: true,
      karatKnown: true,
      requiredLoanInr: 3_00_000,
    });
    expect(['potential_match', 'may_be_relevant', 'insufficient_information']).toContain(
      result.status,
    );
    expect(result.status).not.toBe('not_matched');
  });
});

describe('gold loan visual defaults', () => {
  it('uses first-party hero and guide assets', () => {
    expect(GOLD_LOAN_DECISION_HERO_ASSET).toContain('gold-loan-decision-hero');
    expect(
      GOLD_LOAN_DEFAULT_GUIDES.every((g) => g.imageUrl.includes('/hub/finance/gold-loan-guides/')),
    ).toBe(true);
  });
});
