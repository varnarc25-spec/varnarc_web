import { describe, expect, it } from 'vitest';
import {
  LOAN_CATEGORY_PAGE_DEFAULTS,
  resolveCategoryBreadcrumbLabel,
  resolveCategoryEducationSections,
  resolveCategoryH1,
  resolveCategoryIntro,
  resolveCategoryRelatedCalculators,
  resolveCategorySeo,
} from '@/lib/loan-category-page';
import { computeLoanCategoryStats } from '@/lib/loan-category-stats';
import { pickLoanCategoryFaqs } from '@/lib/loan-category-faqs';
import { LOAN_HUB_CATEGORY_SLUGS, isLoanHubCategorySlug } from '@/lib/loan-hub-categories';
import { buildLegacyCategoryRedirect, loanCategoryCanonicalPath } from '@/lib/loan-path';
import type { FinanceLoan } from '@/services/finance';

describe('dedicated loan category pages', () => {
  it('defines page defaults for every hub category slug', () => {
    for (const slug of LOAN_HUB_CATEGORY_SLUGS) {
      expect(isLoanHubCategorySlug(slug)).toBe(true);
      const defaults = LOAN_CATEGORY_PAGE_DEFAULTS[slug];
      expect(defaults.h1.startsWith('Compare')).toBe(true);
      expect(defaults.breadcrumbLabel.length).toBeGreaterThan(3);
      expect(defaults.intro.length).toBeGreaterThan(20);
      expect(defaults.sections.length).toBeGreaterThan(3);
      expect(defaults.relatedCalculators.length).toBeGreaterThan(0);
      expect(loanCategoryCanonicalPath(slug)).toBe(`/finance/loans/${slug}`);
    }
  });

  it('uses Personal Loan H1/intro/breadcrumb copy', () => {
    expect(resolveCategoryH1('personal-loan')).toBe('Compare Personal Loans');
    expect(resolveCategoryBreadcrumbLabel('personal-loan')).toBe('Personal Loans');
    expect(resolveCategoryIntro('personal-loan')).toContain(
      'personal loan interest rates, loan amounts, repayment tenure, fees',
    );
    expect(resolveCategoryIntro('personal-loan', { introduction: 'CMS intro' })).toBe('CMS intro');
  });

  it('ships the reusable Personal Loan education + calculator set', () => {
    const defaults = LOAN_CATEGORY_PAGE_DEFAULTS['personal-loan'];
    const keys = defaults.sections.map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'whatIs',
        'howItWorks',
        'interestRates',
        'rateFactors',
        'eligibility',
        'documents',
        'fees',
        'emiCalculation',
        'creditScore',
        'tenure',
        'prepayment',
        'alternatives',
        'vsLap',
        'advantages',
        'mistakes',
        'howToApply',
      ]),
    );
    expect(defaults.sections.some((s) => s.layout === 'stepper')).toBe(true);
    expect(defaults.sections.some((s) => s.layout === 'compare-table')).toBe(true);
    expect(defaults.relatedCalculators.map((c) => c.href)).toEqual([
      '/calculators/personal-loan-emi',
      '/calculators/loan-eligibility',
      '/calculators/loan-prepayment',
      '/calculators/debt-planner',
      '/calculators/emi-rate-compare',
    ]);
    expect(defaults.defaultFaqs.length).toBeGreaterThanOrEqual(5);
  });

  it('merges CMS education overrides without inventing empty content', () => {
    const merged = resolveCategoryEducationSections('personal-loan', {
      whatIs: 'CMS what is copy',
      howItWorks: null,
    });
    expect(merged.find((s) => s.key === 'whatIs')?.body).toBe('CMS what is copy');
    expect(merged.find((s) => s.key === 'howItWorks')?.body.length).toBeGreaterThan(10);
    expect(merged.find((s) => s.key === 'howItWorks')?.layout).toBe('stepper');
  });

  it('resolves SEO from CMS or defaults', () => {
    const seo = resolveCategorySeo('home-loan', {
      metaTitle: 'Custom Home Title',
      metaDescription: 'Custom home description',
    });
    expect(seo.title).toBe('Custom Home Title');
    expect(seo.description).toBe('Custom home description');
    expect(resolveCategorySeo('car-loan').title).toContain('Car Loans');
  });

  it('allows CMS calculator slug overrides with known calculators only', () => {
    const links = resolveCategoryRelatedCalculators('personal-loan', {
      relatedCalculatorSlugs: ['personal-loan-emi', 'not-a-real-calc', 'loan-prepayment'],
    });
    expect(links.map((l) => l.href)).toEqual([
      '/calculators/personal-loan-emi',
      '/calculators/loan-prepayment',
    ]);
  });

  it('computes stats only from available verified product data', () => {
    const loans: FinanceLoan[] = [
      {
        id: '1',
        name: 'A',
        slug: 'a',
        loanType: 'PERSONAL',
        interestRateMin: 10.5,
        rateLastVerifiedAt: '2026-08-01T00:00:00.000Z',
        loanAmountMax: 500000,
        tenureMax: 60,
        bank: { id: 'b1', name: 'Bank 1', slug: 'bank-1' },
      },
      {
        id: '2',
        name: 'B',
        slug: 'b',
        loanType: 'PERSONAL',
        interestRateMin: 9.1,
        rateLastVerifiedAt: '2026-08-01T00:00:00.000Z',
        maxAmount: 800000,
        tenureMax: 48,
        bank: { id: 'b2', name: 'Bank 2', slug: 'bank-2' },
      },
      {
        id: '3',
        name: 'Unverified',
        slug: 'c',
        loanType: 'PERSONAL',
        interestRateMin: 8,
        // no rateLastVerifiedAt — must not invent starting rate from this
        bank: { id: 'b1', name: 'Bank 1', slug: 'bank-1' },
      },
    ];

    const stats = computeLoanCategoryStats(loans);
    expect(stats.find((s) => s.key === 'startingRate')?.value).toContain('9.1');
    expect(stats.find((s) => s.key === 'maxAmount')?.value).toBeTruthy();
    expect(stats.find((s) => s.key === 'maxTenure')?.value).toContain('5 years');
    expect(stats.find((s) => s.key === 'lenderCount')?.value).toBe('2');

    expect(computeLoanCategoryStats([])).toEqual([]);
    expect(
      computeLoanCategoryStats([
        { id: 'x', name: 'X', slug: 'x', loanType: 'PERSONAL' } as FinanceLoan,
      ]),
    ).toEqual([]);
  });

  it('prefers category FAQs then falls back to defaults', () => {
    const defaults = pickLoanCategoryFaqs([], 'gold-loan', 'cat-1');
    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults[0]?.question.length).toBeGreaterThan(5);

    const cms = pickLoanCategoryFaqs(
      [
        {
          id: 'f1',
          question: 'CMS gold Q?',
          answer: 'CMS gold A',
          entityType: 'loan_category',
          entityId: 'cat-1',
          sortOrder: 1,
        },
      ],
      'gold-loan',
      'cat-1',
    );
    expect(cms).toHaveLength(1);
    expect(cms[0]?.question).toBe('CMS gold Q?');
  });

  it('keeps permanent legacy redirect target stable', () => {
    expect(buildLegacyCategoryRedirect('education-loan', { rateMax: '11' })).toBe(
      '/finance/loans/education-loan?rateMax=11',
    );
  });
});
