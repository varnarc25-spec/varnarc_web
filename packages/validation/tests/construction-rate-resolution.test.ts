import { describe, expect, it } from 'vitest';
import {
  applyUserOverride,
  publicRateLabel,
  rangeFromExpected,
  resolveRate,
  validateRateBand,
  type ResolvableRate,
} from '../src/construction-rate-resolution';

const city: ResolvableRate = {
  id: 'city',
  locationId: 'hyd',
  locationType: 'CITY',
  minRate: 90,
  averageRate: 100,
  maxRate: 110,
  unit: '50kg bag',
  sourceType: 'OFFICIAL_MARKET_SURVEY',
  confidence: 'HIGH',
  isDerived: false,
  lastVerifiedAt: '2024-01-01',
  effectiveFrom: '2024-01-01',
  sourceName: 'State survey',
};

const national: ResolvableRate = {
  id: 'nat',
  locationId: null,
  locationType: 'NATIONAL',
  minRate: 70,
  averageRate: 80,
  maxRate: 90,
  unit: '50kg bag',
  sourceType: 'ESTIMATED_FALLBACK',
  confidence: 'LOW',
  isDerived: true,
  derivationMethod: 'national-planning-baseline',
  effectiveFrom: '2020-01-01',
};

describe('rate resolution', () => {
  it('prefers city over national', () => {
    const resolved = resolveRate({
      candidates: [national, city],
      ancestry: [
        { id: 'hyd', type: 'CITY' },
        { id: 'tg', type: 'STATE' },
        { id: 'in', type: 'NATIONAL' },
      ],
    });
    expect(resolved?.rate).toBe(100);
    expect(resolved?.locationLevel).toBe('CITY');
    expect(resolved?.publicLabel).toBe('Official schedule / survey rate');
  });

  it('falls back to national planning baseline', () => {
    const resolved = resolveRate({
      candidates: [national],
      ancestry: [{ id: 'hyd', type: 'CITY' }],
    });
    expect(resolved?.rate).toBe(80);
    expect(resolved?.isDerived).toBe(true);
    expect(resolved?.publicLabel).toBe('Indicative planning rate');
  });

  it('applies user override without mutating global data', () => {
    const base = resolveRate({
      candidates: [city],
      ancestry: [{ id: 'hyd', type: 'CITY' }],
    })!;
    const over = applyUserOverride(base, 125, '50kg bag');
    expect(over.sourceType).toBe('USER_OVERRIDE');
    expect(over.rate).toBe(125);
    expect(base.rate).toBe(100);
  });

  it('rejects inverted bands', () => {
    expect(validateRateBand(120, 100, 90).length).toBeGreaterThan(0);
  });

  it('returns low expected high', () => {
    expect(rangeFromExpected(1000, 0.1)).toEqual({ low: 900, expected: 1000, high: 1100 });
  });

  it('labels derived rates honestly', () => {
    expect(publicRateLabel({ sourceType: 'DERIVED', isDerived: true })).toContain('Derived');
    expect(publicRateLabel({ sourceType: 'ESTIMATED_FALLBACK', isDerived: true })).toContain(
      'Indicative',
    );
  });
});
