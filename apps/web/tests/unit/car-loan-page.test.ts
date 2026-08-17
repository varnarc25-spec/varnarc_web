import { describe, expect, it } from 'vitest';
import { calculateEmi } from '@/lib/emi';
import {
  CAR_LOAN_DECISION_HERO_ASSET,
  CAR_LOAN_DEFAULT_GUIDES,
  CAR_LOAN_TENURE_YEARS,
  carLoanFinancingPercent,
  carLoanRequirement,
  clampCarLoanDownPayment,
  estimateCarAffordability,
  estimateCarLoanPrepaymentImpact,
  illustrativeCarLoanOfferEmi,
} from '@/lib/car-loan-page';
import {
  filterCarLoanCatalog,
  formatCarFinancingPercentLabel,
  formatCarVehicleConditionLabel,
  resolveCarLoanProductFields,
} from '@/lib/car-loan-product';
import { resolveCarLoanGuideTopicImage } from '@/lib/loan-visual-assets';
describe('car loan decision page helpers', () => {
  it('computes loan requirement from vehicle price and down payment', () => {
    expect(carLoanRequirement(12_00_000, 2_40_000)).toBe(9_60_000);
    expect(carLoanRequirement(8_00_000, 10_00_000)).toBe(0);
  });

  it('clamps down payment to vehicle price', () => {
    expect(clampCarLoanDownPayment(12_00_000, 15_00_000)).toBe(12_00_000);
    expect(clampCarLoanDownPayment(12_00_000, -1)).toBe(0);
    expect(clampCarLoanDownPayment(0, 5_00_000)).toBe(0);
  });

  it('computes financing percent as loan divided by vehicle price times 100', () => {
    expect(carLoanFinancingPercent(12_00_000, 9_60_000)).toBeCloseTo(80, 4);
    expect(carLoanFinancingPercent(10_00_000, 8_00_000)).toBeCloseTo(80, 4);
    expect(carLoanFinancingPercent(0, 5_00_000)).toBeNull();
    expect(carLoanFinancingPercent(10_00_000, -1)).toBeNull();
  });

  it('calculates illustrative offer EMI from loan requirement and product rate', () => {
    const ok = illustrativeCarLoanOfferEmi(
      {
        id: '1',
        name: 'Test CL',
        slug: 'test-cl',
        loanType: 'car',
        interestRateMin: 9.5,
        loanAmountMin: 1_00_000,
        loanAmountMax: 25_00_000,
        tenureMin: 12,
        tenureMax: 84,
      },
      9_60_000,
      60,
    );
    expect(ok.status).toBe('ok');
    if (ok.status === 'ok') {
      const expected = calculateEmi({
        principal: 9_60_000,
        annualRatePercent: 9.5,
        tenureMonths: 60,
      });
      expect(ok.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
    }
  });

  it('does not invent offer EMI when amount is outside product range', () => {
    const result = illustrativeCarLoanOfferEmi(
      {
        id: '2',
        name: 'Test CL Small',
        slug: 'test-cl-small',
        loanType: 'car',
        interestRateMin: 9.5,
        loanAmountMin: 1_00_000,
        loanAmountMax: 5_00_000,
      },
      9_60_000,
      60,
    );
    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.message).toContain('outside displayed product range');
    }
  });

  it('rejects prepayment greater than or equal to outstanding principal', () => {
    expect(
      estimateCarLoanPrepaymentImpact({
        outstanding: 9_60_000,
        annualRatePercent: 9.5,
        remainingMonths: 60,
        prepaymentAmount: 9_60_000,
        mode: 'reduce-tenure',
      }),
    ).toBeNull();
    expect(
      estimateCarLoanPrepaymentImpact({
        outstanding: 9_60_000,
        annualRatePercent: 9.5,
        remainingMonths: 60,
        prepaymentAmount: 12_00_000,
        mode: 'reduce-emi',
      }),
    ).toBeNull();
  });

  it('returns prepayment interest saved when inputs are valid', () => {
    const impact = estimateCarLoanPrepaymentImpact({
      outstanding: 9_60_000,
      annualRatePercent: 9.5,
      remainingMonths: 60,
      prepaymentAmount: 1_00_000,
      mode: 'reduce-tenure',
    });
    expect(impact).not.toBeNull();
    expect(impact!.interestSaved).toBeGreaterThan(0);
    expect(impact!.monthsSaved).toBeGreaterThan(0);
  });

  it('handles 0% and 100% down payment edge cases without NaN', () => {
    expect(carLoanRequirement(10_00_000, 0)).toBe(10_00_000);
    expect(carLoanRequirement(10_00_000, 10_00_000)).toBe(0);
    expect(carLoanFinancingPercent(10_00_000, 10_00_000)).toBeCloseTo(100, 4);
    expect(carLoanFinancingPercent(10_00_000, 0)).toBeCloseTo(0, 4);

    const fullCash = calculateEmi({
      principal: 0,
      annualRatePercent: 9.5,
      tenureMonths: 60,
    });
    expect(fullCash === null || fullCash.monthlyEmi === 0).toBe(true);
  });

  it('keeps EMI math consistent across common car-loan tenures', () => {
    for (const years of CAR_LOAN_TENURE_YEARS) {
      const result = calculateEmi({
        principal: 9_60_000,
        annualRatePercent: 9.5,
        tenureMonths: years * 12,
      });
      expect(result).not.toBeNull();
      expect(result!.totalRepayment).toBeCloseTo(result!.monthlyEmi * years * 12, 4);
      expect(result!.totalInterest).toBeCloseTo(result!.totalRepayment - 9_60_000, 4);
    }
  });

  it('uses a car-loan decision hero asset with cache bust', () => {
    expect(CAR_LOAN_DECISION_HERO_ASSET).toContain('car-loan-decision-hero');
    expect(CAR_LOAN_DECISION_HERO_ASSET).toContain('v=1');
  });

  it('does not invent offer EMI when rate is missing', () => {
    const result = illustrativeCarLoanOfferEmi(
      {
        id: '3',
        name: 'Test CL No Rate',
        slug: 'test-cl-no-rate',
        loanType: 'car',
        loanAmountMin: 1_00_000,
        loanAmountMax: 25_00_000,
        tenureMin: 12,
        tenureMax: 84,
      },
      9_60_000,
      60,
    );
    expect(result.status).toBe('unavailable');
  });

  it('reduces EMI when prepayment mode is reduce-emi', () => {
    const impact = estimateCarLoanPrepaymentImpact({
      outstanding: 9_60_000,
      annualRatePercent: 9.5,
      remainingMonths: 60,
      prepaymentAmount: 1_00_000,
      mode: 'reduce-emi',
    });
    expect(impact).not.toBeNull();
    expect(impact!.mode).toBe('reduce-emi');
    expect(impact!.monthsSaved).toBe(0);
    expect(impact!.revised.monthlyEmi).toBeLessThan(impact!.original.monthlyEmi);
    expect(impact!.interestSaved).toBeGreaterThanOrEqual(0);
  });

  it('estimates car affordability from income and down payment', () => {
    const estimate = estimateCarAffordability({
      monthlyIncome: 80_000,
      existingEmis: 10_000,
      availableDownPayment: 2_40_000,
      annualRatePercent: 9.5,
      tenureYears: 5,
      foirRatio: 0.4,
    });
    expect(estimate).not.toBeNull();
    expect(estimate!.comfortableEmi).toBe(22_000);
    expect(estimate!.loanCapacity).toBeGreaterThan(0);
    expect(estimate!.vehicleBudget).toBeGreaterThan(estimate!.loanCapacity);
  });

  it('resolves car product fields from metadata without inventing values', () => {
    const resolved = resolveCarLoanProductFields({
      id: '1',
      name: 'CL',
      slug: 'cl',
      loanType: 'car',
      metadata: {
        vehicleCondition: 'used',
        financingPercentageMax: 85,
        vehicleAgeMax: 7,
      },
    });
    expect(resolved.vehicleCondition).toBe('used');
    expect(resolved.financingPercentageMax).toBe(85);
    expect(formatCarVehicleConditionLabel(resolved.vehicleCondition)).toBe('Used');
    expect(formatCarFinancingPercentLabel(resolved)).toBe('Up to 85%');
    expect(formatCarVehicleConditionLabel(null)).toBe('Not currently available');
  });

  it('filters car catalog by vehicle condition and financing %', () => {
    const loans = [
      {
        id: 'a',
        name: 'New only',
        slug: 'a',
        loanType: 'car',
        metadata: { vehicleCondition: 'new', financingPercentageMax: 90 },
      },
      {
        id: 'b',
        name: 'Used',
        slug: 'b',
        loanType: 'car',
        metadata: { vehicleCondition: 'used', financingPercentageMax: 70 },
      },
      {
        id: 'c',
        name: 'No meta',
        slug: 'c',
        loanType: 'car',
      },
    ];
    expect(filterCarLoanCatalog(loans, { vehicleCondition: 'used' }).map((l) => l.id)).toEqual([
      'b',
    ]);
    expect(filterCarLoanCatalog(loans, { financingPercentMin: '80' }).map((l) => l.id)).toEqual([
      'a',
    ]);
  });

  it('ships default car loan guide cards with illustration family', () => {
    expect(CAR_LOAN_DEFAULT_GUIDES.length).toBeGreaterThanOrEqual(6);
    expect(
      CAR_LOAN_DEFAULT_GUIDES.every((g) => g.imageUrl.includes('/hub/finance/car-loan-guides/')),
    ).toBe(true);
  });
});

describe('car loan calculator regression', () => {
  it('Test A: loan required from 20% and amount-based down payment', () => {
    const vehicle = 12_00_000;
    const down20 = Math.round(vehicle * 0.2);
    expect(down20).toBe(2_40_000);
    expect(carLoanRequirement(vehicle, down20)).toBe(9_60_000);
    expect(carLoanRequirement(vehicle, 2_40_000)).toBe(9_60_000);
  });

  it('Test B: financing % edges never go negative', () => {
    expect(carLoanFinancingPercent(12_00_000, 9_60_000)).toBeCloseTo(80, 4);
    expect(carLoanFinancingPercent(0, 1)).toBeNull();
    expect(carLoanFinancingPercent(10_00_000, -100)).toBeNull();
    expect(carLoanFinancingPercent(10_00_000, 10_00_000)).toBeCloseTo(100, 4);
    expect(carLoanFinancingPercent(10_00_000, 0)).toBeCloseTo(0, 4);
    expect(carLoanRequirement(10_00_000, 15_00_000)).toBe(0);
  });

  it('Test C: EMI matrix across rates and tenures uses shared calculateEmi', () => {
    const principal = 9_60_000;
    const rates = [0, 5, 8, 10, 12.5];
    const tenures = [12, 36, 60, 84];
    for (const rate of rates) {
      for (const months of tenures) {
        const result = calculateEmi({
          principal,
          annualRatePercent: rate,
          tenureMonths: months,
        });
        expect(result).not.toBeNull();
        expect(Number.isFinite(result!.monthlyEmi)).toBe(true);
        expect(Number.isFinite(result!.totalInterest)).toBe(true);
        expect(Number.isFinite(result!.totalRepayment)).toBe(true);
        expect(result!.totalRepayment).toBeCloseTo(result!.monthlyEmi * months, 4);
        expect(result!.totalInterest).toBeCloseTo(result!.totalRepayment - principal, 4);
        if (rate === 0) {
          expect(result!.monthlyEmi).toBeCloseTo(principal / months, 6);
          expect(result!.totalInterest).toBeCloseTo(0, 6);
        }
      }
    }
  });

  it('Test D: down payment scenarios update loan, financing, EMI and interest', () => {
    const vehicle = 12_00_000;
    const rate = 9.5;
    const tenureMonths = 60;
    for (const percent of [10, 20, 30, 50]) {
      const down = Math.round((vehicle * percent) / 100);
      const loan = carLoanRequirement(vehicle, down);
      const financing = carLoanFinancingPercent(vehicle, loan);
      const emi = calculateEmi({
        principal: loan,
        annualRatePercent: rate,
        tenureMonths,
      });
      expect(loan).toBe(vehicle - down);
      expect(financing).toBeCloseTo(100 - percent, 4);
      if (loan === 0) {
        expect(emi === null || emi.monthlyEmi === 0).toBe(true);
      } else {
        expect(emi).not.toBeNull();
        expect(emi!.monthlyEmi).toBeGreaterThan(0);
        expect(emi!.totalInterest).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('Test E: affordability outputs remain indicative capacity metrics', () => {
    const estimate = estimateCarAffordability({
      monthlyIncome: 1_00_000,
      existingEmis: 15_000,
      availableDownPayment: 3_00_000,
      annualRatePercent: 9.5,
      tenureYears: 5,
      foirRatio: 0.4,
    });
    expect(estimate).not.toBeNull();
    expect(estimate!.comfortableEmi).toBeGreaterThan(0);
    expect(estimate!.loanCapacity).toBeGreaterThan(0);
    expect(estimate!.vehicleBudget).toBe(estimate!.loanCapacity + 3_00_000);
    expect(
      estimateCarAffordability({
        monthlyIncome: 0,
        existingEmis: 0,
        availableDownPayment: 0,
        annualRatePercent: 9.5,
        tenureYears: 5,
      }),
    ).toBeNull();
  });

  it('Test F: prepayment edges avoid negative balance or months', () => {
    expect(
      estimateCarLoanPrepaymentImpact({
        outstanding: 5_00_000,
        annualRatePercent: 9.5,
        remainingMonths: 36,
        prepaymentAmount: 0,
        mode: 'reduce-tenure',
      }),
    ).toBeNull();

    const small = estimateCarLoanPrepaymentImpact({
      outstanding: 5_00_000,
      annualRatePercent: 9.5,
      remainingMonths: 36,
      prepaymentAmount: 25_000,
      mode: 'reduce-tenure',
    });
    expect(small).not.toBeNull();
    expect(small!.interestSaved).toBeGreaterThanOrEqual(0);
    expect(small!.monthsSaved).toBeGreaterThanOrEqual(0);

    const zeroRate = estimateCarLoanPrepaymentImpact({
      outstanding: 5_00_000,
      annualRatePercent: 0,
      remainingMonths: 36,
      prepaymentAmount: 50_000,
      mode: 'reduce-emi',
    });
    expect(zeroRate).not.toBeNull();
    expect(zeroRate!.interestSaved).toBeGreaterThanOrEqual(0);
    expect(zeroRate!.revised.monthlyEmi).toBeLessThan(zeroRate!.original.monthlyEmi);

    const oneMonth = estimateCarLoanPrepaymentImpact({
      outstanding: 1_00_000,
      annualRatePercent: 10,
      remainingMonths: 1,
      prepaymentAmount: 10_000,
      mode: 'reduce-tenure',
    });
    if (oneMonth) {
      expect(oneMonth.monthsSaved).toBeGreaterThanOrEqual(0);
      expect(oneMonth.interestSaved).toBeGreaterThanOrEqual(0);
    }

    expect(
      estimateCarLoanPrepaymentImpact({
        outstanding: 2_00_000,
        annualRatePercent: 9.5,
        remainingMonths: 24,
        prepaymentAmount: 2_00_000,
        mode: 'reduce-tenure',
      }),
    ).toBeNull();
    expect(
      estimateCarLoanPrepaymentImpact({
        outstanding: 2_00_000,
        annualRatePercent: 9.5,
        remainingMonths: 24,
        prepaymentAmount: 2_50_000,
        mode: 'reduce-emi',
      }),
    ).toBeNull();
  });
});

describe('car loan guide imagery', () => {
  it('resolves topic-specific editorial assets and never returns empty', () => {
    expect(resolveCarLoanGuideTopicImage({ title: 'How Much Car Can I Afford?' })).toContain(
      'affordability.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'Car Loan Down Payment' })).toContain(
      'down-payment.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'Car Loan EMI Guide' })).toContain('emi.svg');
    expect(resolveCarLoanGuideTopicImage({ title: 'New vs Used Car Financing' })).toContain(
      'new-vs-used.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'Bank vs Dealer Finance' })).toContain(
      'bank-vs-dealer.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'Car Loan Prepayment' })).toContain(
      'prepayment.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'Vehicle Hypothecation' })).toContain(
      'hypothecation.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'How to Close a Car Loan' })).toContain(
      'loan-closure.svg',
    );
    expect(resolveCarLoanGuideTopicImage({ title: 'Unknown topic' })).toContain(
      'affordability.svg',
    );
  });
});
