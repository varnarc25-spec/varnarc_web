import { describe, expect, it } from 'vitest';

import {
  EDITORIAL_COMPARISONS,
  calculatePairCost,
  getEditorialComparison,
  resolveCompareHint,
} from '@/lib/construction/compare-hub/catalog';

describe('material comparison engine', () => {
  it('ships the required editorial pairs only', () => {
    const slugs = EDITORIAL_COMPARISONS.map((c) => c.slug);
    expect(slugs).toEqual([
      'aac-vs-brick',
      'opc-vs-ppc',
      'm-sand-vs-river-sand',
      'vitrified-vs-ceramic-tiles',
      'upvc-vs-aluminium-windows',
      'gypsum-vs-cement-plaster',
    ]);
  });

  it('includes trade-off sections without winner language requirements', () => {
    for (const cmp of EDITORIAL_COMPARISONS) {
      expect(cmp.left.bestSuitedFor.length).toBeGreaterThan(0);
      expect(cmp.left.advantages.length).toBeGreaterThan(0);
      expect(cmp.left.limitations.length).toBeGreaterThan(0);
      expect(cmp.left.costImplications.length).toBeGreaterThan(10);
      expect(cmp.left.thingsToVerify.length).toBeGreaterThan(0);
      expect(cmp.attributes.length).toBeGreaterThanOrEqual(4);
      expect(cmp.overview.length).toBeGreaterThan(80);
      expect(cmp.methodology.length).toBeGreaterThan(40);
    }
  });

  it('resolves known hints to editorial slugs', () => {
    expect(resolveCompareHint('aac,brick')).toBe('aac-vs-brick');
    expect(resolveCompareHint('opc,ppc')).toBe('opc-vs-ppc');
    expect(resolveCompareHint('vitrified,ceramic')).toBe('vitrified-vs-ceramic-tiles');
    expect(resolveCompareHint('cement,steel')).toBeNull();
  });

  it('calculates project quantity costs', () => {
    const aac = getEditorialComparison('aac-vs-brick')!;
    const result = calculatePairCost({
      quantity: 100,
      leftRate: aac.costModel.left.defaultRateInr,
      rightRate: aac.costModel.right.defaultRateInr,
      leftUnitsPerQuantity: aac.costModel.left.unitsPerQuantity,
      rightUnitsPerQuantity: aac.costModel.right.unitsPerQuantity,
    });
    expect(result.leftUnits).toBe(850);
    expect(result.rightUnits).toBe(5000);
    expect(result.leftTotal).toBe(850 * 55);
    expect(result.rightTotal).toBe(5000 * 8);
  });
});
