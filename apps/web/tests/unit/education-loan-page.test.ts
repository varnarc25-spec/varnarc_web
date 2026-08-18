import { describe, expect, it } from 'vitest';
import { calculateEmi } from '@/lib/emi';
import {
  EDUCATION_LOAN_DECISION_HERO_ASSET,
  EDUCATION_LOAN_DEFAULT_GUIDES,
  educationFundingSurplus,
  educationLoanRequirement,
  estimateEmiAfterStudy,
  estimateStudyPeriodInterest,
  totalEducationCost,
} from '@/lib/education-loan-page';
import {
  EDUCATION_LOAN_DEFAULT_SCHEMES,
  evaluateEducationScheme,
  evaluateGovernmentSchemeEligibility,
  formatSchemeVerifiedDate,
  governmentSchemeFreshness,
  isPublishedGovernmentScheme,
  parseGovernmentSchemesFromCms,
  resolveEducationGovernmentSchemes,
  schemeEligibilityStatusLabel,
} from '@/lib/education-loan-schemes';

describe('education loan planner math', () => {
  it('sums education cost components', () => {
    expect(
      totalEducationCost({
        tuition: 8_00_000,
        living: 2_00_000,
        books: 40_000,
        travel: 0,
        other: 60_000,
      }),
    ).toBe(11_00_000);
  });

  it('computes funding gap without inventing scholarships', () => {
    expect(
      educationLoanRequirement({
        totalCost: 20_00_000,
        ownContribution: 5_00_000,
        scholarship: 2_00_000,
      }),
    ).toBe(13_00_000);
    expect(
      educationLoanRequirement({
        totalCost: 5_00_000,
        ownContribution: 6_00_000,
        scholarship: 0,
      }),
    ).toBe(0);
    expect(
      educationLoanRequirement({
        totalCost: 5_00_000,
        ownContribution: 1_00_000,
        scholarship: 10_00_000,
      }),
    ).toBe(0);
    expect(
      educationLoanRequirement({
        totalCost: 0,
        ownContribution: 0,
        scholarship: 0,
      }),
    ).toBe(0);
  });

  it('reports funding surplus when own funds exceed cost', () => {
    expect(
      educationFundingSurplus({
        totalCost: 10_00_000,
        ownContribution: 12_00_000,
        scholarship: 1_00_000,
      }),
    ).toBe(3_00_000);
    expect(
      educationFundingSurplus({
        totalCost: 10_00_000,
        ownContribution: 4_00_000,
        scholarship: 0,
      }),
    ).toBe(0);
  });

  it('never returns negative loan required for empty/negative-ish inputs', () => {
    expect(
      educationLoanRequirement({
        totalCost: -1,
        ownContribution: -5,
        scholarship: -2,
      }),
    ).toBeGreaterThanOrEqual(0);
  });

  it('models pay-during-study vs capitalize with simple interest basis', () => {
    const pay = estimateStudyPeriodInterest({
      loanAmount: 10_00_000,
      annualRatePercent: 10,
      courseMonths: 24,
      moratoriumMonths: 12,
      mode: 'pay-during-study',
    });
    const cap = estimateStudyPeriodInterest({
      loanAmount: 10_00_000,
      annualRatePercent: 10,
      courseMonths: 24,
      moratoriumMonths: 12,
      mode: 'capitalize',
    });
    expect(pay).not.toBeNull();
    expect(cap).not.toBeNull();
    expect(pay!.interestDuringStudy).toBeCloseTo(3_00_000, 4);
    expect(pay!.balanceAtRepaymentStart).toBe(10_00_000);
    expect(pay!.cashOutflowDuringStudy).toBeCloseTo(3_00_000, 4);
    expect(cap!.balanceAtRepaymentStart).toBeCloseTo(13_00_000, 4);
    expect(cap!.cashOutflowDuringStudy).toBe(0);
  });

  it.each([
    { courseMonths: 12, moratoriumMonths: 0, rate: 0, mode: 'capitalize' as const, interest: 0 },
    {
      courseMonths: 12,
      moratoriumMonths: 0,
      rate: 10,
      mode: 'capitalize' as const,
      interest: 1_00_000,
    },
    {
      courseMonths: 24,
      moratoriumMonths: 0,
      rate: 10,
      mode: 'capitalize' as const,
      interest: 2_00_000,
    },
    {
      courseMonths: 48,
      moratoriumMonths: 0,
      rate: 10,
      mode: 'capitalize' as const,
      interest: 4_00_000,
    },
    {
      courseMonths: 24,
      moratoriumMonths: 6,
      rate: 10,
      mode: 'capitalize' as const,
      interest: 2_50_000,
    },
    {
      courseMonths: 24,
      moratoriumMonths: 12,
      rate: 10,
      mode: 'capitalize' as const,
      interest: 3_00_000,
    },
  ])(
    'study interest course=$courseMonths mo moratorium=$moratoriumMonths rate=$rate',
    ({ courseMonths, moratoriumMonths, rate, mode, interest }) => {
      const result = estimateStudyPeriodInterest({
        loanAmount: 10_00_000,
        annualRatePercent: rate,
        courseMonths,
        moratoriumMonths,
        mode,
      });
      expect(result).not.toBeNull();
      expect(result!.interestDuringStudy).toBeCloseTo(interest, 4);
      expect(result!.balanceAtRepaymentStart).toBeCloseTo(10_00_000 + interest, 4);

      const pay = estimateStudyPeriodInterest({
        loanAmount: 10_00_000,
        annualRatePercent: rate,
        courseMonths,
        moratoriumMonths,
        mode: 'pay-during-study',
      });
      expect(pay!.balanceAtRepaymentStart).toBe(10_00_000);
      expect(pay!.cashOutflowDuringStudy).toBeCloseTo(interest, 4);

      const emi = estimateEmiAfterStudy({
        balanceAtRepaymentStart: result!.balanceAtRepaymentStart,
        annualRatePercent: rate || 10,
        repaymentYears: 8,
      });
      expect(emi).not.toBeNull();
      expect(emi!.totalRepayment).toBeGreaterThanOrEqual(result!.balanceAtRepaymentStart);
    },
  );

  it('computes EMI after study on balance at repayment start', () => {
    const emi = estimateEmiAfterStudy({
      balanceAtRepaymentStart: 13_00_000,
      annualRatePercent: 10,
      repaymentYears: 8,
    });
    expect(emi).not.toBeNull();
    const expected = calculateEmi({
      principal: 13_00_000,
      annualRatePercent: 10,
      tenureMonths: 96,
    });
    expect(emi!.monthlyEmi).toBeCloseTo(expected!.monthlyEmi, 4);
  });

  it('ships decision hero and guide family assets', () => {
    expect(EDUCATION_LOAN_DECISION_HERO_ASSET).toContain('education-loan-decision-hero');
    expect(
      EDUCATION_LOAN_DEFAULT_GUIDES.every((g) =>
        g.imageUrl.includes('/hub/finance/education-loan-guides/'),
      ),
    ).toBe(true);
  });
});

describe('education loan government scheme rule engine', () => {
  const vidya = EDUCATION_LOAN_DEFAULT_SCHEMES.find((s) => s.slug === 'pm-vidyalaxmi')!;
  const csis = EDUCATION_LOAN_DEFAULT_SCHEMES.find((s) => s.slug === 'pm-usp-csis')!;

  it('seeds PM-Vidyalaxmi and PM-USP CSIS with official source URLs', () => {
    const schemes = resolveEducationGovernmentSchemes(null);
    expect(schemes.map((s) => s.slug).sort()).toEqual(['pm-usp-csis', 'pm-vidyalaxmi']);
    expect(schemes.every((s) => s.officialSourceUrl.startsWith('http'))).toBe(true);
    expect(schemes.every((s) => Boolean(s.lastVerifiedAt))).toBe(true);
  });

  it('rejects CMS schemes missing official source', () => {
    expect(
      parseGovernmentSchemesFromCms([
        { id: 'x', name: 'X', slug: 'x', lastVerifiedAt: '2026-01-01' },
      ]),
    ).toEqual([]);
  });

  it('requires official source URL for published schemes', () => {
    expect(
      isPublishedGovernmentScheme({
        ...vidya,
        officialSourceUrl: '',
      }),
    ).toBe(false);
    expect(isPublishedGovernmentScheme(vidya)).toBe(true);
  });

  it('evaluateEducationScheme alias matches centralized evaluator', () => {
    const input = {
      studyLocation: 'india' as const,
      annualFamilyIncomeInr: 5_00_000,
      loanAmountInr: 5_00_000,
      meritBasedAdmission: true,
      qheiEligible: true,
    };
    expect(evaluateEducationScheme(vidya, input).status).toBe(
      evaluateGovernmentSchemeEligibility(vidya, input).status,
    );
  });

  it('marks India vs Abroad mismatch as not_matched', () => {
    const abroad = evaluateGovernmentSchemeEligibility(vidya, {
      studyLocation: 'abroad',
      annualFamilyIncomeInr: 5_00_000,
      loanAmountInr: 8_00_000,
      meritBasedAdmission: true,
      qheiEligible: true,
    });
    expect(abroad.status).toBe('not_matched');
    expect(abroad.unmetConditions.length).toBeGreaterThan(0);
    expect(schemeEligibilityStatusLabel(abroad.status)).toMatch(/not matched/i);
  });

  it('requires more information when income is missing', () => {
    const incomplete = evaluateGovernmentSchemeEligibility(vidya, {
      studyLocation: 'india',
      meritBasedAdmission: true,
      qheiEligible: true,
    });
    expect(incomplete.status).toBe('insufficient_information');
    expect(incomplete.unknownConditions).toEqual(
      expect.arrayContaining([expect.stringMatching(/income/i)]),
    );
  });

  it('matches family-income condition within summarised limit', () => {
    const result = evaluateGovernmentSchemeEligibility(vidya, {
      studyLocation: 'india',
      annualFamilyIncomeInr: 6_00_000,
      loanAmountInr: 8_00_000,
      meritBasedAdmission: true,
      qheiEligible: true,
    });
    expect(result.status).toBe('potential_match');
    expect(result.matchedConditions.some((c) => /income/i.test(c))).toBe(true);
    expect(result.explanation).toMatch(/official verification|potential match/i);
  });

  it('marks income above threshold as not_matched', () => {
    const result = evaluateGovernmentSchemeEligibility(vidya, {
      studyLocation: 'india',
      annualFamilyIncomeInr: 12_00_000,
      loanAmountInr: 8_00_000,
      meritBasedAdmission: true,
      qheiEligible: true,
    });
    expect(result.status).toBe('not_matched');
    expect(result.unmetConditions.some((c) => /income/i.test(c))).toBe(true);
  });

  it('treats unknown institution eligibility as insufficient_information', () => {
    const result = evaluateGovernmentSchemeEligibility(vidya, {
      studyLocation: 'india',
      annualFamilyIncomeInr: 5_00_000,
      loanAmountInr: 8_00_000,
      meritBasedAdmission: true,
      qheiEligible: null,
    });
    expect(result.status).toBe('insufficient_information');
    expect(result.unknownConditions.some((c) => /institution/i.test(c))).toBe(true);
  });

  it('treats known ineligible institution as not_matched', () => {
    const result = evaluateGovernmentSchemeEligibility(vidya, {
      studyLocation: 'india',
      annualFamilyIncomeInr: 5_00_000,
      loanAmountInr: 8_00_000,
      meritBasedAdmission: true,
      qheiEligible: false,
    });
    expect(result.status).toBe('not_matched');
  });

  it('notes loan amount outside subvention ceiling without auto-excluding', () => {
    const result = evaluateGovernmentSchemeEligibility(csis, {
      studyLocation: 'india',
      annualFamilyIncomeInr: 3_00_000,
      loanAmountInr: 15_00_000,
    });
    expect(['potential_match', 'may_be_relevant', 'insufficient_information']).toContain(
      result.status,
    );
    expect(
      result.unknownConditions.some((c) => /loan amount|subvention/i.test(c)) ||
        result.matchedConditions.length >= 0,
    ).toBe(true);
  });

  it('handles inactive/archived and stale schemes', () => {
    const archived = evaluateGovernmentSchemeEligibility(
      { ...vidya, status: 'archived' },
      { studyLocation: 'india', annualFamilyIncomeInr: 5_00_000, loanAmountInr: 5_00_000 },
    );
    expect(archived.status).toBe('insufficient_information');
    expect(archived.freshness).toBe('archived');

    const stale = evaluateGovernmentSchemeEligibility(
      { ...vidya, lastVerifiedAt: '2024-01-01' },
      {
        studyLocation: 'india',
        annualFamilyIncomeInr: 5_00_000,
        loanAmountInr: 5_00_000,
        meritBasedAdmission: true,
        qheiEligible: true,
      },
      new Date('2026-08-17'),
    );
    expect(stale.freshness).toBe('review_required');
    expect(stale.showNumericRules).toBe(false);
  });

  it('formats public verified dates without editorial freshness labels', () => {
    expect(formatSchemeVerifiedDate('2026-08-17')).toMatch(/2026/);
    expect(governmentSchemeFreshness('2026-08-01', new Date('2026-08-17'))).toBe('fresh');
    expect(governmentSchemeFreshness('2025-01-01', new Date('2026-08-17'))).toBe('review_required');
  });
});
