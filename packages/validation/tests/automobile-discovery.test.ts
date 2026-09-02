import { describe, expect, it } from 'vitest';
import {
  formatAutomobileMileage,
  formatAutomobilePriceRange,
  getAutomobileDiscoveryByPath,
  listAutomobileDiscoveryPaths,
  scoreAutomobileRecommendation,
} from '../src';

describe('automobile discovery', () => {
  it('registers curated budget and combo paths', () => {
    const paths = listAutomobileDiscoveryPaths();
    expect(paths).toContain('/automobile/cars/under-10-lakh');
    expect(paths).toContain('/automobile/electric-cars');
    expect(paths).toContain('/automobile/suv/under-15-lakh');
    expect(
      getAutomobileDiscoveryByPath('/automobile/cng-cars/under-10-lakh')?.filter.maxPrice,
    ).toBe(1000000);
  });

  it('formats mileage without printing zero or inventing km/l for L/100 values', () => {
    expect(formatAutomobileMileage(0)).toBeNull();
    expect(formatAutomobileMileage(null)).toBeNull();
    expect(formatAutomobileMileage(4.5)).toContain('L/100km');
    expect(formatAutomobileMileage(22)).toContain('km/l');
  });

  it('hides empty price ranges', () => {
    expect(formatAutomobilePriceRange(null, null)).toBeNull();
    expect(formatAutomobilePriceRange(0, 0)).toBeNull();
    expect(formatAutomobilePriceRange(500000, 700000)).toContain('lakh');
  });

  it('scores recommendations with explainable reasons', () => {
    const { score, reasons } = scoreAutomobileRecommendation(
      {
        id: '1',
        name: 'Test',
        slug: 'test',
        exShowroomPrice: 800000,
        seatingCapacity: 5,
        fuelType: 'Petrol',
        transmission: 'AMT',
      },
      { budgetMax: 1000000, familySize: 4, fuel: 'Petrol', transmission: 'automatic' },
    );
    expect(score).toBeGreaterThan(50);
    expect(reasons.some((r) => r.toLowerCase().includes('budget'))).toBe(true);
  });
});
