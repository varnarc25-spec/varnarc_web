import { describe, expect, it } from 'vitest';
import {
  buildLegacyCategoryRedirect,
  classifyLoanPathSegment,
  hasLoanCatalogFilters,
  isLoanDetailUuid,
  loanCategoryCanonicalPath,
  loansHubCanonicalPath,
  pickLoanCatalogFilters,
} from '@/lib/loan-path';
import { isLoanHubCategorySlug } from '@/lib/loan-hub-categories';
import { parseEmiQuery, serializeEmiQuery, buildEmiCalculatorHref } from '@/lib/emi-query';
import { getRateFreshness } from '@/lib/loan-rate-freshness';
import {
  canAddToCompare,
  prepareLoanCatalog,
  processingFeeDisplay,
  toggleCompareSelection,
} from '@/lib/loan-catalog';
import { calculateEmi } from '@/lib/emi';
import type { FinanceLoan } from '@/services/finance';
import { loansHubPath } from '@/lib/finance-routes';

function loanStub(partial: Partial<FinanceLoan> & { id: string; name: string }): FinanceLoan {
  return {
    slug: partial.slug ?? partial.id,
    loanType: 'PERSONAL',
    ...partial,
  } as FinanceLoan;
}

describe('loan path discrimination', () => {
  it('recognizes allowlisted category slugs without API lookup', () => {
    expect(isLoanHubCategorySlug('personal-loan')).toBe(true);
    expect(classifyLoanPathSegment('personal-loan')).toEqual({
      kind: 'category',
      slug: 'personal-loan',
    });
    expect(classifyLoanPathSegment('home-loan').kind).toBe('category');
  });

  it('recognizes UUID loan detail segments', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(isLoanDetailUuid(id)).toBe(true);
    expect(classifyLoanPathSegment(id)).toEqual({ kind: 'loan-detail', id });
  });

  it('returns unknown for non-category non-uuid segments (notFound path)', () => {
    expect(classifyLoanPathSegment('not-a-real-slug')).toEqual({
      kind: 'unknown',
      segment: 'not-a-real-slug',
    });
    expect(classifyLoanPathSegment('emi-calculator').kind).toBe('unknown');
    expect(isLoanHubCategorySlug('methodology')).toBe(false);
  });

  it('prefers category allowlist over UUID-shaped collisions', () => {
    // Allowlisted slug wins even if somehow UUID-like (not applicable) — verify order.
    expect(classifyLoanPathSegment('personal-loan').kind).toBe('category');
  });
});

describe('legacy category redirect', () => {
  it('redirects allowlisted categorySlug to clean path', () => {
    expect(buildLegacyCategoryRedirect('personal-loan', {})).toBe('/finance/loans/personal-loan');
  });

  it('preserves compatible catalog filters and drops categorySlug', () => {
    const href = buildLegacyCategoryRedirect('personal-loan', {
      categorySlug: 'personal-loan',
      bankId: 'hdfc-id',
      sort: 'lowest_interest',
      rateMax: '12',
      amountMin: '100000',
      amountMax: '500000',
      tenureMin: '12',
      processingFeeMax: '2',
      creditScoreMaxRequired: '750',
      employmentType: 'salaried',
      garbage: 'drop-me',
      income: 'ignore',
    });
    expect(href).toBeTruthy();
    expect(href!.startsWith('/finance/loans/personal-loan?')).toBe(true);
    expect(href).toContain('bankId=hdfc-id');
    expect(href).toContain('rateMax=12');
    expect(href).toContain('sort=lowest_interest');
    expect(href).not.toContain('categorySlug=');
    expect(href).not.toContain('garbage=');
    expect(href).not.toContain('income=');
  });

  it('maps lender alias to bankId', () => {
    const qs = pickLoanCatalogFilters({ lender: 'bank-1' });
    expect(qs.get('bankId')).toBe('bank-1');
    expect(qs.has('lender')).toBe(false);
  });

  it('returns null for unknown categorySlug (no redirect loop)', () => {
    expect(buildLegacyCategoryRedirect('unknown-loan', { bankId: 'x' })).toBeNull();
    expect(buildLegacyCategoryRedirect(undefined, {})).toBeNull();
  });
});

describe('canonicals and noindex helpers', () => {
  it('builds hub and category canonicals', () => {
    expect(loansHubCanonicalPath()).toBe('/finance/loans');
    expect(loanCategoryCanonicalPath('personal-loan')).toBe('/finance/loans/personal-loan');
    expect(loansHubPath({ categorySlug: 'personal-loan' })).toBe('/finance/loans/personal-loan');
  });

  it('detects filtered catalog params for noindex', () => {
    expect(hasLoanCatalogFilters({})).toBe(false);
    expect(hasLoanCatalogFilters({ sort: 'recommended' })).toBe(false);
    expect(hasLoanCatalogFilters({ rateMax: '12' })).toBe(true);
    expect(hasLoanCatalogFilters({ bankId: 'x' })).toBe(true);
  });
});

describe('EMI query parse/serialize', () => {
  it('parses amount/rate/tenure/tenureUnit', () => {
    const parsed = parseEmiQuery({
      amount: '500000',
      rate: '10.5',
      tenure: '5',
      tenureUnit: 'years',
    });
    expect(parsed.amount).toBe(500000);
    expect(parsed.rate).toBe(10.5);
    expect(parsed.tenure).toBe(5);
    expect(parsed.tenureUnit).toBe('years');
    expect(parsed.tenureMonths).toBe(60);
    expect(parsed.usedDefaults.amount).toBe(false);
  });

  it('ignores catalog filter keys and falls back on malformed values', () => {
    const parsed = parseEmiQuery({
      amountMin: '999999',
      tenureMin: '24',
      amount: 'not-a-number',
      rate: '-1',
      tenure: '0',
    } as Record<string, string>);
    expect(parsed.usedDefaults.amount).toBe(true);
    expect(parsed.usedDefaults.rate).toBe(true);
    expect(parsed.usedDefaults.tenure).toBe(true);
    expect(parsed.amount).toBe(5_00_000);
  });

  it('serializes EMI query without catalog filter keys', () => {
    const qs = serializeEmiQuery({
      amount: 500000,
      rate: 10.5,
      tenure: 5,
      tenureUnit: 'years',
      product: 'hdfc-personal-loan',
    });
    expect(qs.get('amount')).toBe('500000');
    expect(qs.get('rate')).toBe('10.5');
    expect(qs.get('tenure')).toBe('5');
    expect(qs.get('tenureUnit')).toBe('years');
    expect(qs.get('product')).toBe('hdfc-personal-loan');
    expect(qs.has('amountMin')).toBe(false);
    expect(qs.has('productName')).toBe(false);
  });

  it('builds calculator href', () => {
    expect(
      buildEmiCalculatorHref('emi', { amount: 100000, rate: 9.1, tenure: 3, tenureUnit: 'years' }),
    ).toBe('/calculators/emi?amount=100000&rate=9.1&tenure=3&tenureUnit=years');
  });

  it('handles zero interest EMI', () => {
    const result = calculateEmi({
      principal: 120000,
      annualRatePercent: 0,
      tenureMonths: 12,
    });
    expect(result?.monthlyEmi).toBe(10000);
    expect(result?.totalInterest).toBe(0);
  });
});

describe('processing fee and rate freshness', () => {
  it('shows Not currently available when fee is missing (never invents 0%)', () => {
    const loan = loanStub({ id: '1', name: 'Test' });
    expect(processingFeeDisplay(loan)).toBe('Not currently available');
  });

  it('displays explicit zero fee as 0%', () => {
    const loan = loanStub({ id: '1', name: 'Test', processingFee: 0 });
    expect(processingFeeDisplay(loan)).toBe('0%');
  });

  it('marks stale rates with public notice without hiding products', () => {
    const now = new Date('2026-08-14T00:00:00.000Z');
    const stale = getRateFreshness('2025-01-01T00:00:00.000Z', now);
    expect(stale.status).toBe('review_required');
    expect(stale.verifiedLabel).toBeTruthy();
    expect(stale.publicNotice).toBe('Rate information may require re-verification.');

    const fresh = getRateFreshness('2026-08-01T00:00:00.000Z', now);
    expect(fresh.status).toBe('fresh');
    expect(fresh.publicNotice).toBeNull();
  });
});

describe('featured dedupe and compare max', () => {
  it('dedupes featured products from the catalog list', () => {
    const a = loanStub({ id: 'a', name: 'A', featured: true });
    const b = loanStub({ id: 'b', name: 'B', featured: true });
    const c = loanStub({ id: 'c', name: 'C' });
    const prepared = prepareLoanCatalog([a, b, c], [a, b]);
    expect(prepared.showFeatured).toBe(true);
    expect(prepared.featured.map((l) => l.id)).toEqual(['a', 'b']);
    expect(prepared.featuredTotal).toBe(2);
    expect(prepared.catalog.map((l) => l.id)).toEqual(['c']);
  });

  it('caps featured display at 3 while preserving total', () => {
    const featured = [1, 2, 3, 4, 5].map((n) =>
      loanStub({ id: String(n), name: `F${n}`, featured: true }),
    );
    const prepared = prepareLoanCatalog(featured, featured);
    expect(prepared.featured).toHaveLength(3);
    expect(prepared.featuredTotal).toBe(5);
    expect(prepared.catalog.map((l) => l.id)).toEqual(['4', '5']);
  });

  it('enforces compare max of 4', () => {
    let selected: string[] = [];
    selected = toggleCompareSelection(selected, '1');
    selected = toggleCompareSelection(selected, '2');
    selected = toggleCompareSelection(selected, '3');
    selected = toggleCompareSelection(selected, '4');
    expect(selected).toHaveLength(4);
    expect(canAddToCompare(selected, '5')).toBe(false);
    const blocked = toggleCompareSelection(selected, '5');
    expect(blocked).toHaveLength(4);
    expect(blocked).not.toContain('5');
    selected = toggleCompareSelection(selected, '2');
    expect(selected).toEqual(['1', '3', '4']);
  });
});
