import { describe, expect, it } from 'vitest';
import {
  CEMENT_DENSITY_KG_PER_M3,
  CONCRETE_DRY_FACTOR,
  MORTAR_DRY_FACTOR,
  calculateCementQuantity,
  resolveMixRatio,
} from '../src/cement-calculator';

describe('resolveMixRatio', () => {
  it('resolves concrete and mortar presets', () => {
    expect(resolveMixRatio('M20').label).toMatch(/M20/);
    expect(resolveMixRatio('mortar_1_4')).toEqual(
      expect.objectContaining({ cement: 1, sand: 4, aggregate: 0 }),
    );
  });

  it('supports custom ratios', () => {
    const m = resolveMixRatio('custom', {
      cementParts: 1,
      sandParts: 2,
      aggregateParts: 4,
    });
    expect(m.cement).toBe(1);
    expect(m.sand).toBe(2);
    expect(m.aggregate).toBe(4);
  });
});

describe('calculateCementQuantity — concrete', () => {
  it('computes cement kg and bags for 1 m³ M20 with 5% wastage', () => {
    const r = calculateCementQuantity({
      useCase: 'concrete',
      volume: 1,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 5,
      bagSizeKg: 50,
    });
    // dry = 1.54; fraction = 1/5.5; kg before = 1.54 * (1/5.5) * 1440
    const before = CONCRETE_DRY_FACTOR * (1 / 5.5) * CEMENT_DENSITY_KG_PER_M3;
    expect(r.cementKgBeforeWastage).toBeCloseTo(before, 1);
    expect(r.cementKg).toBeCloseTo(before * 1.05, 1);
    expect(r.bags).toBe(Math.ceil(r.cementKg / 50 - 1e-9));
    expect(r.sandVolumeM3).not.toBeNull();
    expect(r.aggregateVolumeM3).not.toBeNull();
    expect(r.steps.length).toBeGreaterThan(3);
    expect(r.formula).toMatch(/cement_kg/);
  });

  it('converts imperial concrete volume (cu ft)', () => {
    const r = calculateCementQuantity({
      useCase: 'concrete',
      volume: 35.3147,
      volumeUnit: 'ft3',
      mixPreset: 'M15',
      wastagePercent: 0,
      bagSizeKg: 50,
    });
    expect(r.wetVolumeM3).toBeCloseTo(1, 2);
  });

  it('converts litre volume to m³', () => {
    const r = calculateCementQuantity({
      useCase: 'concrete',
      volume: 1000,
      volumeUnit: 'liter',
      mixPreset: 'M20',
      wastagePercent: 0,
      bagSizeKg: 50,
    });
    expect(r.wetVolumeM3).toBeCloseTo(1, 6);
  });

  it('estimates cost when bag price provided', () => {
    const r = calculateCementQuantity({
      useCase: 'concrete',
      volume: 1,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 0,
      bagSizeKg: 50,
      bagPriceInr: 400,
    });
    expect(r.estimatedCostInr).toBe(r.bags * 400);
  });

  it('lists common bag size conversions', () => {
    const r = calculateCementQuantity({
      useCase: 'concrete',
      volume: 2,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 5,
      bagSizeKg: 50,
    });
    expect(r.bagSizes.map((b) => b.sizeKg)).toEqual([25, 40, 50]);
    expect(r.bagSizes.every((b) => b.bags > 0)).toBe(true);
  });
});

describe('calculateCementQuantity — plaster / masonry / screed', () => {
  it('computes plaster from area and thickness (metric)', () => {
    const r = calculateCementQuantity({
      useCase: 'plastering',
      area: 100,
      areaUnit: 'm2',
      thickness: 12,
      thicknessUnit: 'mm',
      mixPreset: 'mortar_1_4',
      wastagePercent: 10,
      bagSizeKg: 50,
    });
    // wet = 100 * 0.012 = 1.2 m3; dry = 1.2 * 1.33
    expect(r.wetVolumeM3).toBeCloseTo(1.2, 4);
    expect(r.dryVolumeFactor).toBe(MORTAR_DRY_FACTOR);
    expect(r.aggregateVolumeM3).toBeNull();
    expect(r.sandVolumeM3).not.toBeNull();
    expect(r.cementKg).toBeGreaterThan(0);
  });

  it('supports imperial area and thickness for masonry', () => {
    const r = calculateCementQuantity({
      useCase: 'masonry',
      area: 100,
      areaUnit: 'ft2',
      thickness: 0.5,
      thicknessUnit: 'inch',
      mixPreset: 'mortar_1_5',
      wastagePercent: 5,
      bagSizeKg: 50,
    });
    expect(r.wetVolumeM3).toBeGreaterThan(0);
    expect(r.bags).toBeGreaterThan(0);
  });

  it('computes floor screed', () => {
    const r = calculateCementQuantity({
      useCase: 'floor_screed',
      area: 50,
      areaUnit: 'm2',
      thickness: 40,
      thicknessUnit: 'mm',
      mixPreset: 'mortar_1_3',
      wastagePercent: 5,
      bagSizeKg: 50,
    });
    expect(r.useCase).toBe('floor_screed');
    expect(r.wastageExtraKg).toBeGreaterThan(0);
  });

  it('requires area/thickness for non-concrete', () => {
    expect(() =>
      calculateCementQuantity({
        useCase: 'plastering',
        volume: 1,
        volumeUnit: 'm3',
        mixPreset: 'mortar_1_4',
      }),
    ).toThrow();
  });

  it('requires volume for concrete', () => {
    expect(() =>
      calculateCementQuantity({
        useCase: 'concrete',
        area: 10,
        areaUnit: 'm2',
        thickness: 10,
        thicknessUnit: 'mm',
        mixPreset: 'M20',
      }),
    ).toThrow();
  });
});

describe('wastage impact', () => {
  it('increases cement when wastage rises', () => {
    const low = calculateCementQuantity({
      useCase: 'concrete',
      volume: 1,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 0,
      bagSizeKg: 50,
    });
    const high = calculateCementQuantity({
      useCase: 'concrete',
      volume: 1,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 20,
      bagSizeKg: 50,
    });
    expect(high.cementKg).toBeGreaterThan(low.cementKg);
    expect(high.wastageExtraKg).toBeGreaterThan(low.wastageExtraKg);
  });
});
