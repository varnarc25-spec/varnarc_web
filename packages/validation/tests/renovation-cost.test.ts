import { describe, expect, it } from 'vitest';
import {
  RENOVATION_RANGE_SPREAD,
  RENOVATION_WORK_RATES,
  ageMultiplier,
  calculateRenovationCost,
  computeWorkAmount,
  defaultRenovationWorkItems,
} from '../src/renovation-cost';

const baseWork = defaultRenovationWorkItems().map((w) => ({
  ...w,
  enabled: true,
  quality: 'standard' as const,
}));

const baseInput = {
  location: 'Hyderabad',
  propertyType: 'apartment' as const,
  renovationArea: 1000,
  areaUnit: 'sqft' as const,
  propertyAgeYears: 10,
  workItems: baseWork,
  contingencyPercent: 12,
};

describe('renovation helpers', () => {
  it('increases age multiplier for older properties', () => {
    expect(ageMultiplier(3)).toBe(1);
    expect(ageMultiplier(10)).toBeGreaterThan(1);
    expect(ageMultiplier(40)).toBeGreaterThan(ageMultiplier(10));
  });

  it('computes per-sqft and fixed package amounts', () => {
    const paint = RENOVATION_WORK_RATES.find((w) => w.id === 'painting')!;
    expect(computeWorkAmount(paint, 'standard', 1000)).toBe(28_000);
    const kitchen = RENOVATION_WORK_RATES.find((w) => w.id === 'kitchen')!;
    expect(computeWorkAmount(kitchen, 'standard', 1200)).toBe(320_000);
  });
});

describe('calculateRenovationCost', () => {
  it('returns total, range, cost per sq ft and contingency', () => {
    const result = calculateRenovationCost(baseInput);
    expect(result.estimatedTotal).toBeGreaterThan(0);
    expect(result.rangeLow).toBe(Math.round(result.estimatedTotal * (1 - RENOVATION_RANGE_SPREAD)));
    expect(result.rangeHigh).toBe(
      Math.round(result.estimatedTotal * (1 + RENOVATION_RANGE_SPREAD)),
    );
    expect(result.costPerSqft).toBe(Math.round(result.estimatedTotal / 1000));
    expect(result.contingencyAmount).toBeGreaterThan(0);
    expect(result.disclaimer.toLowerCase()).toMatch(/not a quotation|indicative/);
  });

  it('applies quality tiers within a category', () => {
    const mk = (quality: 'basic' | 'standard' | 'premium') =>
      calculateRenovationCost({
        ...baseInput,
        workItems: [
          { id: 'painting', enabled: true, quality },
          { id: 'flooring', enabled: false, quality: 'standard' },
        ],
      });
    expect(mk('basic').estimatedTotal).toBeLessThan(mk('standard').estimatedTotal);
    expect(mk('premium').estimatedTotal).toBeGreaterThan(mk('standard').estimatedTotal);
  });

  it('excludes disabled work and updates when toggled', () => {
    const withFloor = calculateRenovationCost({
      ...baseInput,
      workItems: [
        { id: 'painting', enabled: true, quality: 'standard' },
        { id: 'flooring', enabled: true, quality: 'standard' },
      ],
    });
    const noFloor = calculateRenovationCost({
      ...baseInput,
      workItems: [
        { id: 'painting', enabled: true, quality: 'standard' },
        { id: 'flooring', enabled: false, quality: 'standard' },
      ],
    });
    expect(withFloor.estimatedTotal).toBeGreaterThan(noFloor.estimatedTotal);
    expect(noFloor.workBreakdown.find((l) => l.id === 'flooring')?.amount).toBe(0);
  });

  it('highlights top three cost drivers among enabled work', () => {
    const result = calculateRenovationCost(baseInput);
    expect(result.topCostDrivers.length).toBeLessThanOrEqual(3);
    expect(result.topCostDrivers.length).toBeGreaterThan(0);
    const amounts = result.topCostDrivers.map((d) => d.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('applies location and age multipliers', () => {
    const hyd = calculateRenovationCost({ ...baseInput, location: 'Hyderabad' });
    const mumbai = calculateRenovationCost({ ...baseInput, location: 'Mumbai' });
    expect(mumbai.estimatedTotal).toBeGreaterThan(hyd.estimatedTotal);

    const young = calculateRenovationCost({ ...baseInput, propertyAgeYears: 2 });
    const old = calculateRenovationCost({ ...baseInput, propertyAgeYears: 40 });
    expect(old.estimatedTotal).toBeGreaterThan(young.estimatedTotal);
  });

  it('requires at least one enabled work item', () => {
    expect(() =>
      calculateRenovationCost({
        ...baseInput,
        workItems: [{ id: 'painting', enabled: false, quality: 'standard' }],
      }),
    ).toThrow(/at least one/i);
  });
});
