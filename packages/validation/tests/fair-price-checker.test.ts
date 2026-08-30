import { describe, expect, it } from 'vitest';
import {
  buildObservedRange,
  classifyQuotedPrice,
  evaluateFairPriceCheck,
  FAIR_PRICE_CHECKER_QUALIFICATION,
  normalizeFairPriceUnit,
  unitsCompatible,
} from '../src/fair-price-checker';

const now = new Date('2026-08-21T12:00:00Z');

function obs(
  overrides: Partial<Parameters<typeof evaluateFairPriceCheck>[0]['observations'][0]> = {},
) {
  return {
    price: 400,
    minPrice: 380,
    maxPrice: 420,
    unit: 'bag',
    claimed: 'LIVE' as const,
    verifiedAt: '2026-08-18T00:00:00Z',
    effectiveFrom: '2026-08-18T00:00:00Z',
    locationSlug: 'hyderabad',
    locationType: 'CITY',
    ...overrides,
  };
}

describe('normalizeFairPriceUnit', () => {
  it('maps common aliases', () => {
    expect(normalizeFairPriceUnit('Bags')).toBe('bag');
    expect(normalizeFairPriceUnit('m³')).toBe('m3');
    expect(normalizeFairPriceUnit('sqm')).toBe('m2');
  });
});

describe('unitsCompatible', () => {
  it('matches bag aliases', () => {
    expect(unitsCompatible('bag', '50kg bag')).toBe(true);
    expect(unitsCompatible('kg', 'bag')).toBe(false);
  });
});

describe('classifyQuotedPrice', () => {
  it('classifies within / below / above', () => {
    expect(classifyQuotedPrice(400, 380, 420)).toBe('within_range');
    expect(classifyQuotedPrice(300, 380, 420)).toBe('below_range');
    expect(classifyQuotedPrice(500, 380, 420)).toBe('above_range');
  });
});

describe('buildObservedRange', () => {
  it('uses min/max bands', () => {
    expect(buildObservedRange([obs(), obs({ price: 410, minPrice: 400, maxPrice: 430 })])).toEqual({
      low: 380,
      high: 430,
      mid: 405,
    });
  });
});

describe('evaluateFairPriceCheck', () => {
  it('returns insufficient data with fewer than 2 fresh observations', () => {
    const result = evaluateFairPriceCheck({
      materialKey: 'cement',
      locationSlug: 'hyderabad',
      quotedUnit: 'bag',
      quotedPrice: 450,
      observations: [obs()],
      now,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('INSUFFICIENT_DATA');
      expect(result.reason).toMatch(/will not invent/i);
    }
  });

  it('classifies above observed range with neutral language', () => {
    const result = evaluateFairPriceCheck({
      materialKey: 'cement',
      locationSlug: 'hyderabad',
      quotedUnit: 'bag',
      quotedPrice: 480,
      quantity: 100,
      observations: [obs(), obs({ price: 405, minPrice: 390, maxPrice: 415 })],
      now,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.classification).toBe('above_range');
      expect(result.classificationLabel).toBe("Above Varnarc's recent observed range");
      expect(result.classificationLabel.toLowerCase()).not.toMatch(/fraud|unfair/);
      expect(result.quotedPrice).toBe(480);
      expect(result.observedRange.low).toBeLessThanOrEqual(result.observedRange.high);
      expect(result.dataCount).toBe(2);
      expect(result.methodology).toBeTruthy();
      expect(result.dataFreshness.label).toBeTruthy();
      expect(result.locationGranularityLabel).toBeTruthy();
      expect(result.quantityImpact?.quotedTotal).toBe(48000);
      expect(result.disclaimer).toBe(FAIR_PRICE_CHECKER_QUALIFICATION);
    }
  });

  it('rejects unit mismatch without inventing a range', () => {
    const result = evaluateFairPriceCheck({
      materialKey: 'cement',
      locationSlug: 'hyderabad',
      quotedUnit: 'kg',
      quotedPrice: 8,
      observations: [obs(), obs({ price: 410 })],
      now,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('UNIT_MISMATCH');
  });

  it('never uses stale ESTIMATED-only data as a range', () => {
    const result = evaluateFairPriceCheck({
      materialKey: 'cement',
      locationSlug: 'hyderabad',
      quotedUnit: 'bag',
      quotedPrice: 400,
      observations: [
        obs({ claimed: 'ESTIMATED' }),
        obs({ claimed: 'STALE', verifiedAt: '2025-01-01T00:00:00Z' }),
      ],
      now,
    });
    expect(result.ok).toBe(false);
  });
});
