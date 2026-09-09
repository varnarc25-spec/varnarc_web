import { describe, expect, it } from 'vitest';
import { brandTitleOnce, isTemplatedCalculatorGuide } from '@/lib/seo-defaults';

describe('brandTitleOnce', () => {
  it('does not double the site name suffix', () => {
    expect(brandTitleOnce('Construction Cost Calculator — Estimate Build Cost | Varnarc')).toBe(
      'Construction Cost Calculator — Estimate Build Cost | Varnarc',
    );
  });

  it('adds the suffix when missing', () => {
    expect(brandTitleOnce('Solar & Energy')).toBe('Solar & Energy | Varnarc');
  });
});

describe('isTemplatedCalculatorGuide', () => {
  it('matches calculator seed titles', () => {
    expect(isTemplatedCalculatorGuide('Personal Loan EMI Calculator: Complete Guide')).toBe(true);
    expect(isTemplatedCalculatorGuide('Complete Guide to House Construction Cost in India')).toBe(
      false,
    );
  });
});
