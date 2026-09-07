import { describe, expect, it } from 'vitest';
import {
  buildConstructionCostAreaLanding,
  computeConstructionCostAreaEstimate,
  isConstructionCostAreaSlug,
  listConstructionCostAreaSlugs,
  listIndexableConstructionCostAreaLandings,
} from '../src/construction-cost-area';

describe('construction cost by area landings', () => {
  it('publishes the curated house sizes only', () => {
    expect(listConstructionCostAreaSlugs()).toEqual([
      '500-sq-ft',
      '600-sq-ft',
      '800-sq-ft',
      '1000-sq-ft',
      '1200-sq-ft',
      '1500-sq-ft',
      '1800-sq-ft',
      '2000-sq-ft',
      '2500-sq-ft',
      '3000-sq-ft',
    ]);
    expect(isConstructionCostAreaSlug('1500-sq-ft')).toBe(true);
    expect(isConstructionCostAreaSlug('1234-sq-ft')).toBe(false);
  });

  it('builds a 1500 sq ft India landing from the cost engine', () => {
    const landing = buildConstructionCostAreaLanding('1500-sq-ft');
    expect(landing).not.toBeNull();
    if (!landing) return;
    expect(landing.h1).toContain('1,500 sq ft');
    expect(landing.canonicalPath).toBe('/construction/cost/1500-sq-ft');
    expect(landing.estimate.areaSqft).toBe(1500);
    expect(landing.estimate.qualityRows).toHaveLength(4);
    expect(landing.estimate.materials.cementBags).toBeGreaterThan(0);
    expect(landing.estimate.materialLines.length).toBeGreaterThanOrEqual(7);
    expect(landing.estimate.materialCost).toBeGreaterThan(0);
    expect(landing.estimate.labourCost).toBeGreaterThan(0);
    expect(landing.estimate.breakdown.some((row) => row.id === 'foundation')).toBe(true);
    expect(landing.sizeNote.length).toBeGreaterThanOrEqual(80);
    expect(landing.estimate.rangeLow).toBeLessThan(landing.estimate.rangeHigh);
  });

  it('recalculates when city or quality changes', () => {
    const hyd = computeConstructionCostAreaEstimate({
      areaSqft: 1500,
      floors: 2,
      quality: 'standard',
      location: 'Hyderabad',
    });
    const mum = computeConstructionCostAreaEstimate({
      areaSqft: 1500,
      floors: 2,
      quality: 'standard',
      location: 'Mumbai',
    });
    const lux = computeConstructionCostAreaEstimate({
      areaSqft: 1500,
      floors: 2,
      quality: 'luxury',
      location: 'Hyderabad',
    });
    expect(mum.estimatedTotal).toBeGreaterThan(hyd.estimatedTotal);
    expect(lux.estimatedTotal).toBeGreaterThan(hyd.estimatedTotal);
  });

  it('indexes every curated size', () => {
    expect(listIndexableConstructionCostAreaLandings()).toHaveLength(10);
  });
});
