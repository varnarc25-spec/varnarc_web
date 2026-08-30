import { describe, expect, it } from 'vitest';
import {
  bandFromPercentile,
  calculateMaterialPricePosition,
  calculateProjectPriceImpact,
  empiricalPercentile,
  MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
} from '../src/material-price-position';

const now = new Date('2026-08-21T12:00:00.000Z');

function obs(price: number, daysAgo: number, id?: string) {
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id: id ?? `o-${daysAgo}`,
    price,
    unit: 'kg',
    currency: 'INR',
    claimed: 'VERIFIED' as const,
    verifiedAt: d.toISOString(),
    effectiveFrom: d.toISOString(),
  };
}

describe('empiricalPercentile / band', () => {
  it('ranks mid values as moderate', () => {
    expect(empiricalPercentile([10, 20, 30, 40, 50], 30)).toBeGreaterThan(30);
    expect(bandFromPercentile(20)).toBe('low');
    expect(bandFromPercentile(50)).toBe('moderate');
    expect(bandFromPercentile(80)).toBe('high');
  });
});

describe('calculateMaterialPricePosition', () => {
  it('returns insufficient when too few points', () => {
    const r = calculateMaterialPricePosition(
      { materialKey: 'steel', locationSlug: 'hyderabad' },
      [obs(50, 5), obs(52, 10)],
      now,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/need at least/i);
  });

  it('computes current, range, percentile, position sentence, trend without buy/forecast language', () => {
    const observations = [
      obs(40, 80),
      obs(42, 60),
      obs(45, 45),
      obs(50, 30),
      obs(55, 15),
      obs(58, 2),
    ];
    const r = calculateMaterialPricePosition(
      {
        materialKey: 'steel',
        locationSlug: 'hyderabad',
        windowDays: MATERIAL_PRICE_POSITION_DEFAULT_WINDOW_DAYS,
        projectQuantity: 5000,
        projectQuantityUnit: 'kg',
        illustrativeUnitChangeInr: 2,
      },
      observations,
      now,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.currentPrice).toBe(58);
    expect(r.recentRange.low).toBe(40);
    expect(r.recentRange.high).toBe(58);
    expect(r.positionSentence).toMatch(/relative to the last 90 days/i);
    expect(r.positionBand).toBe('high');
    expect(r.windowLabel).toBe('Last 90 days');
    expect(r.dataFreshness.label.length).toBeGreaterThan(0);
    expect(r.recentTrend).toBe('higher');
    expect(r.recentTrendLabel).not.toMatch(/will rise|buy now/i);
    expect(r.forbiddenClaims.some((c) => /buy now/i.test(c))).toBe(true);
    expect(r.projectImpact?.estimatedCostDeltaInr).toBe(10_000);
    expect(r.projectImpact?.copy).toMatch(/requires approximately 5,000 kg/i);
    expect(r.projectImpact?.copy).toMatch(/alter estimated material cost/i);
    expect(r.methodology).toMatch(/never forecast/i);
  });

  it('labels low position when current is near bottom of range', () => {
    const observations = [obs(60, 70), obs(58, 50), obs(55, 35), obs(52, 20), obs(50, 5)];
    const r = calculateMaterialPricePosition(
      { materialKey: 'cement', locationSlug: 'bengaluru', windowDays: 90 },
      observations,
      now,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.positionBand).toBe('low');
    expect(r.positionSentence).toMatch(/^Low relative/i);
    expect(r.recentTrend).toBe('lower');
  });
});

describe('calculateProjectPriceImpact', () => {
  it('multiplies quantity by unit change', () => {
    const i = calculateProjectPriceImpact({
      quantity: 100,
      quantityUnit: 'bags',
      unitChangeInr: 15,
    });
    expect(i.estimatedCostDeltaInr).toBe(1500);
    expect(i.copy).toContain('100 bags');
    expect(i.copy).toContain('₹15');
  });
});
