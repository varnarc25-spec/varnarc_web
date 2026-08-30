import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AGGREGATE_DENSITY_KG_PER_M3,
  calculateAggregateQuantity,
} from '../src/aggregate-calculator';
import { CONCRETE_DRY_FACTOR } from '../src/cement-calculator/rates';
import { M3_TO_FT3 } from '../src/concrete-calculator/rates';

describe('calculateAggregateQuantity — concrete', () => {
  it('computes aggregate share for M20 with wastage', () => {
    const r = calculateAggregateQuantity({
      useCase: 'concrete',
      volume: 1,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 5,
      densityKgPerM3: 1500,
    });
    const before = CONCRETE_DRY_FACTOR * (3 / 5.5);
    expect(r.aggregateVolumeBeforeWastageM3).toBeCloseTo(before, 3);
    expect(r.aggregateVolumeM3).toBeCloseTo(before * 1.05, 3);
    expect(r.aggregateVolumeFt3).toBeCloseTo(r.aggregateVolumeM3 * M3_TO_FT3, 2);
    expect(r.estimatedKg).toBeCloseTo(r.aggregateVolumeM3 * 1500, 1);
    expect(r.estimatedTonnes).toBeCloseTo(r.estimatedKg / 1000, 3);
    expect(r.assumptions.some((a) => a.includes('1500'))).toBe(true);
  });
});

describe('calculateAggregateQuantity — generic fill', () => {
  it('uses L×W×D', () => {
    const r = calculateAggregateQuantity({
      useCase: 'generic_fill',
      length: 5,
      width: 2,
      depth: 0.4,
      lengthUnit: 'm',
      widthUnit: 'm',
      depthUnit: 'm',
      wastagePercent: 0,
      densityKgPerM3: 1500,
    });
    expect(r.aggregateVolumeM3).toBeCloseTo(4, 4);
    expect(r.dryVolumeFactor).toBeNull();
  });

  it('uses direct volume with litre conversion', () => {
    const r = calculateAggregateQuantity({
      useCase: 'generic_fill',
      volume: 2000,
      volumeUnit: 'liter',
      wastagePercent: 0,
    });
    expect(r.aggregateVolumeM3).toBeCloseTo(2, 6);
  });
});

describe('calculateAggregateQuantity — area × depth', () => {
  it('computes volume from area and depth', () => {
    const r = calculateAggregateQuantity({
      useCase: 'area_depth',
      area: 100,
      areaUnit: 'm2',
      thickness: 150,
      thicknessUnit: 'mm',
      wastagePercent: 10,
      densityKgPerM3: DEFAULT_AGGREGATE_DENSITY_KG_PER_M3,
      ratePerM3Inr: 1800,
    });
    // wet = 15; with 10% = 16.5
    expect(r.aggregateVolumeBeforeWastageM3).toBeCloseTo(15, 4);
    expect(r.aggregateVolumeM3).toBeCloseTo(16.5, 4);
    expect(r.estimatedCostInr).toBe(Math.round(16.5 * 1800));
    expect(r.rateBasis).toBe('m3');
  });

  it('supports cost by tonne', () => {
    const r = calculateAggregateQuantity({
      useCase: 'area_depth',
      area: 10,
      areaUnit: 'm2',
      thickness: 0.1,
      thicknessUnit: 'm',
      wastagePercent: 0,
      densityKgPerM3: 1500,
      ratePerTonneInr: 800,
    });
    // 1 m3 → 1.5 t → 1200
    expect(r.estimatedTonnes).toBeCloseTo(1.5, 4);
    expect(r.estimatedCostInr).toBe(1200);
  });
});
