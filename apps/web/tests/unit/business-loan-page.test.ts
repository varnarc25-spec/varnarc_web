import { describe, expect, it } from 'vitest';
import { calculateEmi } from '@/lib/emi';
import {
  BUSINESS_LOAN_DECISION_HERO_ASSET,
  BUSINESS_LOAN_DEFAULT_GUIDES,
  assessBusinessCashFlow,
  breakEvenAdditionalSales,
  breakEvenValidationMessage,
  calculateIllustrativeDscr,
  clampBusinessFunding,
  clampBusinessRate,
  clampBusinessTenureYears,
  estimateBusinessLoanEmi,
  estimateBusinessLoanEmiMonths,
  estimateBusinessLoanPrepaymentImpact,
  estimateTotalBorrowingCost,
  facilityHintForPurpose,
  formatCompactFundingInr,
  stressTestBusinessCashFlow,
  turnoverLoanRatio,
  vintageTimelineStepId,
} from '@/lib/business-loan-page';
import {
  BUSINESS_LOAN_DEFAULT_SCHEMES,
  businessSchemeEffectiveWindow,
  evaluateBusinessSchemeEligibility,
  governmentSchemeFreshness,
  resolveBusinessGovernmentSchemes,
  schemeEligibilityStatusLabel,
  type BusinessGovernmentScheme,
} from '@/lib/business-loan-schemes';

describe('business loan EMI regression', () => {
  const amounts = [1_00_000, 5_00_000, 10_00_000, 25_00_000, 50_00_000];
  const rates = [0, 5, 10, 15, 20];
  const tenures = [6, 12, 24, 36, 60, 84];

  it('matches shared calculateEmi across amounts, rates and month tenures', () => {
    for (const amount of amounts) {
      for (const rate of rates) {
        for (const months of tenures) {
          const emi = estimateBusinessLoanEmiMonths({
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
          expect(expected).not.toBeNull();
          expect(emi!.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 6);
          expect(emi!.totalInterest).toBeCloseTo(expected!.totalInterest, 4);
          expect(emi!.totalRepayment).toBeCloseTo(expected!.totalRepayment, 4);
        }
      }
    }
  });

  it('uses principal / months at 0%', () => {
    const emi = estimateBusinessLoanEmiMonths({
      loanAmount: 12_00_000,
      annualRatePercent: 0,
      tenureMonths: 24,
    });
    expect(emi!.monthlyEmi).toBeCloseTo(50_000, 6);
  });

  it('rejects invalid EMI inputs via shared engine', () => {
    expect(
      estimateBusinessLoanEmi({ loanAmount: 0, annualRatePercent: 10, tenureYears: 3 }),
    ).toBeNull();
    expect(
      estimateBusinessLoanEmiMonths({
        loanAmount: 1_00_000,
        annualRatePercent: -1,
        tenureMonths: 12,
      }),
    ).toBeNull();
  });
});

describe('business loan planner math', () => {
  it('assesses cash-flow regression case from QA checklist', () => {
    const result = assessBusinessCashFlow({
      monthlyRevenue: 10_00_000,
      monthlyOperatingExpenses: 7_00_000,
      existingMonthlyDebt: 50_000,
      proposedMonthlyEmi: 75_000,
    });
    expect(result.operatingSurplusBeforeEmi).toBe(2_50_000);
    expect(result.surplusAfterProposedEmi).toBe(1_75_000);
    expect(result.headroom).toBe('more_repayment_headroom');
  });

  it('handles expenses > revenue, EMI > surplus, zeros and negatives', () => {
    const overspent = assessBusinessCashFlow({
      monthlyRevenue: 2_00_000,
      monthlyOperatingExpenses: 2_50_000,
      existingMonthlyDebt: 0,
      proposedMonthlyEmi: 10_000,
    });
    expect(overspent.operatingSurplusBeforeEmi).toBe(-50_000);
    expect(overspent.surplusAfterProposedEmi).toBe(-60_000);
    expect(overspent.headroom).toBe('potential_cash_flow_pressure');

    const debtHeavy = assessBusinessCashFlow({
      monthlyRevenue: 3_00_000,
      monthlyOperatingExpenses: 1_00_000,
      existingMonthlyDebt: 2_50_000,
      proposedMonthlyEmi: 10_000,
    });
    expect(debtHeavy.operatingSurplusBeforeEmi).toBe(-50_000);

    const zeroed = assessBusinessCashFlow({
      monthlyRevenue: 0,
      monthlyOperatingExpenses: 0,
      existingMonthlyDebt: 0,
      proposedMonthlyEmi: 0,
    });
    expect(zeroed.operatingSurplusBeforeEmi).toBe(0);
    expect(zeroed.surplusAfterProposedEmi).toBe(0);

    const clamped = assessBusinessCashFlow({
      monthlyRevenue: -100,
      monthlyOperatingExpenses: -50,
      existingMonthlyDebt: -10,
      proposedMonthlyEmi: -5,
    });
    expect(clamped.operatingSurplusBeforeEmi).toBe(0);
    expect(clamped.surplusAfterProposedEmi).toBe(0);
  });

  it('runs revenue stress scenarios through full cash-flow formula', () => {
    const rows = stressTestBusinessCashFlow({
      monthlyRevenue: 10_00_000,
      monthlyOperatingExpenses: 6_00_000,
      existingMonthlyDebt: 40_000,
      proposedMonthlyEmi: 50_000,
      customRevenue: 7_00_000,
    });
    expect(rows).toHaveLength(4);
    expect(rows[1]!.revenue).toBe(9_00_000);
    expect(rows[1]!.operatingSurplusBeforeEmi).toBe(9_00_000 - 6_00_000 - 40_000);
    expect(rows[1]!.surplusAfterProposedEmi).toBe(9_00_000 - 6_00_000 - 40_000 - 50_000);
    expect(rows[2]!.revenue).toBe(8_00_000);
    expect(rows[2]!.surplusAfterProposedEmi).toBe(8_00_000 - 6_00_000 - 40_000 - 50_000);
    expect(rows[3]!.id).toBe('custom');
  });

  it('computes turnover ratio and DSCR regression case', () => {
    expect(turnoverLoanRatio(1_00_00_000, 15_00_000)).toBeCloseTo(15, 5);
    expect(turnoverLoanRatio(0, 15_00_000)).toBeNull();
    expect(formatCompactFundingInr(15_00_000)).toBe('₹15L');

    const dscr = calculateIllustrativeDscr({
      annualCashAvailableForDebtService: 15_00_000,
      annualExistingDebtPayments: 6_00_000,
      proposedAnnualLoanPayments: 4_00_000,
    });
    expect(dscr!.annualDebtService).toBe(10_00_000);
    expect(dscr!.dscr).toBeCloseTo(1.5, 5);

    expect(
      calculateIllustrativeDscr({
        annualCashAvailableForDebtService: 10,
        annualExistingDebtPayments: 0,
        proposedAnnualLoanPayments: 0,
      }),
    ).toBeNull();
  });

  it('computes break-even sales and validates 0% margin', () => {
    expect(
      breakEvenAdditionalSales({
        proposedMonthlyEmi: 25_000,
        contributionMarginPercent: 25,
      }),
    ).toBeCloseTo(1_00_000, 4);
    expect(
      breakEvenAdditionalSales({
        proposedMonthlyEmi: 25_000,
        contributionMarginPercent: 10,
      }),
    ).toBeCloseTo(2_50_000, 4);
    expect(
      breakEvenAdditionalSales({
        proposedMonthlyEmi: 25_000,
        contributionMarginPercent: 50,
      }),
    ).toBeCloseTo(50_000, 4);
    expect(
      breakEvenAdditionalSales({
        proposedMonthlyEmi: 25_000,
        contributionMarginPercent: 100,
      }),
    ).toBeCloseTo(25_000, 4);
    expect(
      breakEvenAdditionalSales({
        proposedMonthlyEmi: 25_000,
        contributionMarginPercent: 0,
      }),
    ).toBeNull();
    expect(breakEvenValidationMessage(0)).toMatch(/greater than 0/i);
    expect(breakEvenValidationMessage(25)).toBeNull();
  });

  it('treats unknown fees as not currently available', () => {
    const unknown = estimateTotalBorrowingCost({
      loanAmount: 10_00_000,
      annualRatePercent: 12,
      tenureYears: 3,
      knownFees: null,
    });
    expect(unknown!.feesKnown).toBe(false);
    expect(unknown!.knownFees).toBeNull();
    expect(unknown!.totalFinancingCost).toBeCloseTo(unknown!.totalInterest, 4);

    const known = estimateTotalBorrowingCost({
      loanAmount: 10_00_000,
      annualRatePercent: 12,
      tenureYears: 3,
      knownFees: 10_000,
    });
    expect(known!.feesKnown).toBe(true);
    expect(known!.knownFees).toBe(10_000);
    expect(known!.totalFinancingCost).toBeCloseTo(known!.totalInterest + 10_000, 4);
    expect(known!.totalRepayment).toBeCloseTo(known!.loanAmount + known!.totalFinancingCost, 4);
  });

  it('clamps invalid planner inputs', () => {
    expect(clampBusinessFunding(-10)).toBe(0);
    expect(clampBusinessRate(999)).toBe(50);
    expect(clampBusinessTenureYears(0)).toBe(1);
    expect(clampBusinessTenureYears(99)).toBe(15);
  });

  it('maps purposes and vintage timeline', () => {
    expect(facilityHintForPurpose('working_capital')).toBe('working_capital');
    expect(facilityHintForPurpose('equipment')).toBe('term_loan');
    expect(facilityHintForPurpose('other')).toBe('explore_both');
    expect(vintageTimelineStepId(0)).toBe('new');
    expect(vintageTimelineStepId(3)).toBe('3y');
    expect(vintageTimelineStepId(6)).toBe('5y');
  });

  it('estimates prepayment impact edge cases', () => {
    const base = {
      outstanding: 10_00_000,
      annualRatePercent: 12,
      remainingMonths: 36,
      mode: 'reduce-tenure' as const,
    };
    expect(estimateBusinessLoanPrepaymentImpact({ ...base, prepaymentAmount: 0 })).toBeNull();
    const partial = estimateBusinessLoanPrepaymentImpact({
      ...base,
      prepaymentAmount: 1_00_000,
    });
    expect(partial).not.toBeNull();
    expect(partial!.interestSaved).toBeGreaterThan(0);
    expect(
      estimateBusinessLoanPrepaymentImpact({ ...base, prepaymentAmount: 10_00_000 }),
    ).toBeNull();
    expect(
      estimateBusinessLoanPrepaymentImpact({ ...base, prepaymentAmount: 12_00_000 }),
    ).toBeNull();
  });

  it('ships decision hero and guide family assets', () => {
    expect(BUSINESS_LOAN_DECISION_HERO_ASSET).toContain('business-loan-decision-hero');
    expect(
      BUSINESS_LOAN_DEFAULT_GUIDES.every((g) =>
        g.imageUrl.includes('/hub/finance/business-loan-guides/'),
      ),
    ).toBe(true);
  });
});

describe('business loan government / MSME schemes', () => {
  const baseCgtmse = BUSINESS_LOAN_DEFAULT_SCHEMES.find((s) => s.slug === 'cgtmse')!;

  it('seeds Udyam and CGTMSE with official sources and last verified', () => {
    const schemes = resolveBusinessGovernmentSchemes(null);
    expect(schemes.map((s) => s.slug).sort()).toEqual(['cgtmse', 'udyam-registration']);
    expect(schemes.every((s) => s.officialSourceUrl.startsWith('http'))).toBe(true);
    expect(schemes.every((s) => Boolean(s.lastVerifiedAt))).toBe(true);
  });

  it('evaluates soft relevance without approval language', () => {
    const abroad = evaluateBusinessSchemeEligibility(baseCgtmse, {
      locationIndia: false,
      loanAmountInr: 10_00_000,
      enterpriseCategory: 'micro',
    });
    expect(abroad.status).toBe('not_matched');
    expect(schemeEligibilityStatusLabel(abroad.status)).not.toMatch(
      /approved|rejected|eligible|guaranteed/i,
    );

    const incomplete = evaluateBusinessSchemeEligibility(baseCgtmse, {
      locationIndia: true,
    });
    expect(incomplete.status).toBe('insufficient_information');
    expect(schemeEligibilityStatusLabel(incomplete.status)).toMatch(/more information/i);

    const maybe = evaluateBusinessSchemeEligibility(baseCgtmse, {
      locationIndia: true,
      loanAmountInr: 10_00_000,
      enterpriseCategory: 'micro',
      businessVintageYears: 3,
      fundingPurpose: 'working_capital',
    });
    expect(['potential_match', 'may_be_relevant']).toContain(maybe.status);
    expect(maybe.explanation).toMatch(/official|confirm/i);
  });

  it('rejects missing official source / last verified as unverified', () => {
    const missingSource: BusinessGovernmentScheme = {
      ...baseCgtmse,
      officialSourceUrl: '',
    };
    const result = evaluateBusinessSchemeEligibility(missingSource, {
      locationIndia: true,
      loanAmountInr: 10_00_000,
      enterpriseCategory: 'micro',
      businessVintageYears: 2,
    });
    expect(result.status).toBe('insufficient_information');
    expect(result.explanation).toMatch(/official source|last-verified/i);
  });

  it('handles expired, future and archived schemes', () => {
    const now = new Date('2026-08-18');
    const ended: BusinessGovernmentScheme = {
      ...baseCgtmse,
      effectiveFrom: '2020-01-01',
      effectiveTo: '2024-12-31',
    };
    expect(businessSchemeEffectiveWindow(ended, now)).toBe('ended');
    expect(evaluateBusinessSchemeEligibility(ended, { locationIndia: true }, now).status).toBe(
      'not_matched',
    );

    const future: BusinessGovernmentScheme = {
      ...baseCgtmse,
      effectiveFrom: '2027-01-01',
      effectiveTo: null,
    };
    expect(businessSchemeEffectiveWindow(future, now)).toBe('future');
    expect(evaluateBusinessSchemeEligibility(future, { locationIndia: true }, now).status).toBe(
      'insufficient_information',
    );

    const archived: BusinessGovernmentScheme = { ...baseCgtmse, status: 'archived' };
    expect(evaluateBusinessSchemeEligibility(archived, { locationIndia: true }, now).status).toBe(
      'insufficient_information',
    );

    expect(resolveBusinessGovernmentSchemes([ended])).toHaveLength(0);
  });

  it('marks stale schemes for public caution', () => {
    const stale = governmentSchemeFreshness('2020-01-01', new Date('2026-08-18'), 'published');
    expect(['review_soon', 'review_required', 'archived']).toContain(stale);
    const archived = governmentSchemeFreshness('2026-01-01', new Date('2026-08-18'), 'archived');
    expect(archived).toBe('archived');
  });
});
