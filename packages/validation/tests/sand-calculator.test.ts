import { describe, expect, it } from 'vitest';
import { DEFAULT_SAND_DENSITY_KG_PER_M3, calculateSandQuantity } from '../src/sand-calculator';
import { CONCRETE_DRY_FACTOR, MORTAR_DRY_FACTOR } from '../src/cement-calculator/rates';
import { M3_TO_FT3 } from '../src/concrete-calculator/rates';

describe('calculateSandQuantity — concrete', () => {
  it('computes sand share for M20 with wastage', () => {
    const r = calculateSandQuantity({
      useCase: 'concrete',
      volume: 1,
      volumeUnit: 'm3',
      mixPreset: 'M20',
      wastagePercent: 5,
      densityKgPerM3: 1600,
    });
    const dry = CONCRETE_DRY_FACTOR;
    const before = dry * (1.5 / 5.5);
    expect(r.sandVolumeBeforeWastageM3).toBeCloseTo(before, 3);
    expect(r.sandVolumeM3).toBeCloseTo(before * 1.05, 3);
    expect(r.sandVolumeFt3).toBeCloseTo(r.sandVolumeM3 * M3_TO_FT3, 2);
    expect(r.estimatedTonnes).toBeCloseTo((r.sandVolumeM3 * 1600) / 1000, 3);
    expect(r.densityKgPerM3).toBe(1600);
    expect(r.assumptions.some((a) => a.includes('1600'))).toBe(true);
  });
});

describe('calculateSandQuantity — masonry / plaster', () => {
  it('uses mortar dry factor and mix fraction', () => {
    const r = calculateSandQuantity({
      useCase: 'plaster',
      area: 100,
      areaUnit: 'm2',
      thickness: 12,
      thicknessUnit: 'mm',
      mixPreset: 'mortar_1_4',
      wastagePercent: 0,
      densityKgPerM3: 1600,
    });
    // wet = 1.2; dry = 1.2 * 1.33; sand = dry * 4/5
    const wet = 1.2;
    const dry = wet * MORTAR_DRY_FACTOR;
    expect(r.wetVolumeM3).toBeCloseTo(wet, 4);
    expect(r.sandVolumeM3).toBeCloseTo(dry * (4 / 5), 3);
  });

  it('computes masonry mortar sand', () => {
    const r = calculateSandQuantity({
      useCase: 'masonry',
      area: 50,
      areaUnit: 'm2',
      thickness: 10,
      thicknessUnit: 'mm',
      mixPreset: 'mortar_1_6',
      wastagePercent: 10,
    });
    expect(r.useCase).toBe('masonry');
    expect(r.sandVolumeM3).toBeGreaterThan(0);
    expect(r.wastageExtraM3).toBeGreaterThan(0);
  });
});

describe('calculateSandQuantity — filling / generic', () => {
  it('filling from L×W×D', () => {
    const r = calculateSandQuantity({
      useCase: 'filling',
      length: 10,
      width: 4,
      depth: 0.3,
      lengthUnit: 'm',
      widthUnit: 'm',
      depthUnit: 'm',
      wastagePercent: 0,
      densityKgPerM3: 1600,
    });
    expect(r.sandVolumeM3).toBeCloseTo(12, 4);
    expect(r.dryVolumeFactor).toBeNull();
  });

  it('generic volume with litre conversion', () => {
    const r = calculateSandQuantity({
      useCase: 'generic_volume',
      volume: 1000,
      volumeUnit: 'liter',
      wastagePercent: 0,
      densityKgPerM3: DEFAULT_SAND_DENSITY_KG_PER_M3,
    });
    expect(r.sandVolumeM3).toBeCloseTo(1, 6);
  });

  it('estimates cost by m³ or tonne', () => {
    const byM3 = calculateSandQuantity({
      useCase: 'generic_volume',
      volume: 2,
      volumeUnit: 'm3',
      wastagePercent: 0,
      densityKgPerM3: 1600,
      ratePerM3Inr: 2000,
    });
    expect(byM3.estimatedCostInr).toBe(4000);
    expect(byM3.rateBasis).toBe('m3');

    const byT = calculateSandQuantity({
      useCase: 'generic_volume',
      volume: 2,
      volumeUnit: 'm3',
      wastagePercent: 0,
      densityKgPerM3: 1600,
      ratePerTonneInr: 1000,
    });
    // 2 m3 * 1600 = 3200 kg = 3.2 t → 3200
    expect(byT.estimatedCostInr).toBe(3200);
    expect(byT.rateBasis).toBe('tonne');
  });

  it('lets user change density assumption', () => {
    const light = calculateSandQuantity({
      useCase: 'generic_volume',
      volume: 1,
      volumeUnit: 'm3',
      wastagePercent: 0,
      densityKgPerM3: 1400,
    });
    const heavy = calculateSandQuantity({
      useCase: 'generic_volume',
      volume: 1,
      volumeUnit: 'm3',
      wastagePercent: 0,
      densityKgPerM3: 1800,
    });
    expect(heavy.estimatedTonnes).toBeGreaterThan(light.estimatedTonnes);
  });
});
