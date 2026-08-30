import { describe, expect, it } from 'vitest';
import {
  CATEGORY_SHARES,
  LOCATION_MULTIPLIERS,
  NATIONAL_BASE_RATE_PER_SQFT,
  PHASE_SHARES,
  QUALITY_MULTIPLIERS,
  RANGE_SPREAD,
  calculateConstructionCost,
  normalizeLocationKey,
  toSqft,
} from '../src/construction-cost';

const baseInput = {
  location: 'Hyderabad',
  propertyType: 'independent_house' as const,
  builtUpArea: 1500,
  areaUnit: 'sqft' as const,
  floors: 2,
  quality: 'standard' as const,
  contingencyPercent: 10,
};

describe('construction cost helpers', () => {
  it('normalizes location keys and soft-matches', () => {
    expect(normalizeLocationKey('Bengaluru')).toBe('bengaluru');
    expect(normalizeLocationKey('Bangalore NCR')).toBe('bangalore');
    expect(normalizeLocationKey('Unknownville')).toBe('default');
  });

  it('converts sqm to sqft', () => {
    expect(toSqft(100, 'sqm')).toBeCloseTo(1076.39, 1);
    expect(toSqft(1500, 'sqft')).toBe(1500);
  });

  it('keeps category and phase shares summing to 1', () => {
    const cat = CATEGORY_SHARES.reduce((s, c) => s + c.share, 0);
    const phase = PHASE_SHARES.reduce((s, c) => s + c.share, 0);
    expect(cat).toBeCloseTo(1, 10);
    expect(phase).toBeCloseTo(1, 10);
  });
});

describe('calculateConstructionCost — rate application', () => {
  it('applies quality multipliers relative to standard', () => {
    const standard = calculateConstructionCost({ ...baseInput, quality: 'standard' });
    const basic = calculateConstructionCost({ ...baseInput, quality: 'basic' });
    const premium = calculateConstructionCost({ ...baseInput, quality: 'premium' });
    const luxury = calculateConstructionCost({ ...baseInput, quality: 'luxury' });

    expect(basic.costPerSqft).toBeLessThan(standard.costPerSqft);
    expect(premium.costPerSqft).toBeGreaterThan(standard.costPerSqft);
    expect(luxury.costPerSqft).toBeGreaterThan(premium.costPerSqft);
    expect(luxury.qualityMultiplier).toBe(QUALITY_MULTIPLIERS.luxury);
  });

  it('applies location multipliers vs national base', () => {
    const hyderabad = calculateConstructionCost({ ...baseInput, location: 'Hyderabad' });
    const mumbai = calculateConstructionCost({ ...baseInput, location: 'Mumbai' });
    expect(mumbai.locationMultiplier).toBe(LOCATION_MULTIPLIERS.mumbai!.multiplier);
    expect(mumbai.costPerSqft).toBeGreaterThan(hyderabad.costPerSqft);
    expect(hyderabad.baseRatePerSqft).toBe(NATIONAL_BASE_RATE_PER_SQFT);
  });

  it('applies floor multiplier for multi-storey builds', () => {
    const one = calculateConstructionCost({ ...baseInput, floors: 1 });
    const three = calculateConstructionCost({ ...baseInput, floors: 3 });
    expect(three.floorMultiplier).toBeCloseTo(1.08, 5);
    expect(three.costPerSqft).toBeGreaterThan(one.costPerSqft);
  });

  it('honours base rate override with multipliers', () => {
    const result = calculateConstructionCost({
      ...baseInput,
      floors: 1,
      quality: 'standard',
      location: 'Hyderabad',
      overrides: { baseRatePerSqft: 2000 },
    });
    expect(result.baseRatePerSqft).toBe(2000);
    expect(result.costPerSqft).toBe(2000);
  });

  it('uses custom cost per sqft as all-in rate (no extra location/quality multiply)', () => {
    const result = calculateConstructionCost({
      ...baseInput,
      location: 'Mumbai',
      quality: 'luxury',
      customCostPerSqft: 2500,
      basement: false,
      parkingSlots: 0,
      lift: false,
      compoundWall: false,
      modularKitchen: false,
    });
    expect(result.costPerSqft).toBe(2500);
    // shell only before contingency features
    expect(result.estimatedTotal).toBeGreaterThan(2500 * 1500);
  });

  it('adds optional feature costs', () => {
    const plain = calculateConstructionCost({ ...baseInput, lift: false });
    const withLift = calculateConstructionCost({ ...baseInput, lift: true });
    expect(withLift.estimatedTotal).toBeGreaterThan(plain.estimatedTotal);
    expect(withLift.featureCosts.some((f) => f.id === 'lift')).toBe(true);
  });

  it('respects contingency percent and cost-split overrides', () => {
    const low = calculateConstructionCost({
      ...baseInput,
      contingencyPercent: 5,
      overrides: { materialPercent: 60, labourPercent: 30, miscPercent: 10 },
    });
    const high = calculateConstructionCost({
      ...baseInput,
      contingencyPercent: 20,
      overrides: { materialPercent: 60, labourPercent: 30, miscPercent: 10 },
    });
    expect(low.contingencyPercent).toBe(5);
    expect(high.contingencyAmount).toBeGreaterThan(low.contingencyAmount);
    expect(
      low.materialCost / (low.materialCost + low.labourCost + low.miscellaneousCost),
    ).toBeCloseTo(0.6, 2);
  });
});

describe('calculateConstructionCost — ranges & breakdown', () => {
  it('publishes a likely range around the mid estimate', () => {
    const result = calculateConstructionCost(baseInput);
    expect(result.rangeLow).toBe(Math.round(result.estimatedTotal * (1 - RANGE_SPREAD)));
    expect(result.rangeHigh).toBe(Math.round(result.estimatedTotal * (1 + RANGE_SPREAD)));
    expect(result.rangeLow).toBeLessThan(result.estimatedTotal);
    expect(result.rangeHigh).toBeGreaterThan(result.estimatedTotal);
  });

  it('includes required category lines with percent and amount', () => {
    const result = calculateConstructionCost(baseInput);
    const ids = result.categoryBreakdown.map((l) => l.id);
    for (const id of [
      'cement',
      'steel',
      'sand',
      'aggregate',
      'bricks',
      'flooring',
      'paint',
      'electrical',
      'plumbing',
      'doors_windows',
      'labour',
      'professional',
      'other',
      'contingency',
    ]) {
      expect(ids).toContain(id);
    }
    for (const line of result.categoryBreakdown) {
      expect(line.amount).toBeGreaterThanOrEqual(0);
      expect(line.percentOfTotal).toBeGreaterThanOrEqual(0);
    }
    const catSum = result.categoryBreakdown.reduce((s, l) => s + l.amount, 0);
    expect(catSum).toBeCloseTo(result.estimatedTotal, -1);
  });

  it('returns phase-wise, floor-wise, and monthly cash figures', () => {
    const result = calculateConstructionCost({ ...baseInput, floors: 3 });
    expect(result.phaseBreakdown.length).toBeGreaterThan(3);
    expect(result.floorBreakdown.some((l) => l.id === 'floor-0')).toBe(true);
    expect(result.floorBreakdown.some((l) => l.id === 'floor-2')).toBe(true);
    expect(result.monthlyCashRequirement).toBeGreaterThan(0);
    expect(result.confidence).toMatch(/low|medium|high/);
    expect(result.disclaimer.toLowerCase()).toMatch(/not a quotation|indicative/);
  });

  it('scales total with built-up area', () => {
    const small = calculateConstructionCost({ ...baseInput, builtUpArea: 1000 });
    const large = calculateConstructionCost({ ...baseInput, builtUpArea: 2000 });
    expect(large.estimatedTotal / small.estimatedTotal).toBeCloseTo(2, 1);
  });
});
