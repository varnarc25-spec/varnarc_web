import { describe, expect, it } from 'vitest';
import { CEMENT_DENSITY_KG_PER_M3, MORTAR_DRY_FACTOR } from '../src/cement-calculator/rates';
import {
  PLASTER_SURFACE_PRESETS,
  calculatePlasterQuantity,
  getPlasterPresetDefaults,
} from '../src/plaster-calculator';

describe('plaster surface presets', () => {
  it('exposes transparent interior/exterior/ceiling defaults', () => {
    expect(PLASTER_SURFACE_PRESETS.interior_wall.thicknessMm).toBe(12);
    expect(PLASTER_SURFACE_PRESETS.exterior_wall.thicknessMm).toBe(15);
    expect(PLASTER_SURFACE_PRESETS.ceiling.mixPreset).toBe('mortar_1_4');
    expect(getPlasterPresetDefaults('custom')).toBeNull();
    expect(getPlasterPresetDefaults('interior_wall')!.assumptions.length).toBeGreaterThan(0);
  });
});

describe('calculatePlasterQuantity — metric', () => {
  it('computes wet/dry volume, cement bags and sand', () => {
    const r = calculatePlasterQuantity({
      surface: 'wall',
      surfacePreset: 'custom',
      area: 100,
      areaUnit: 'm2',
      thickness: 12,
      thicknessUnit: 'mm',
      openingArea: 4,
      openingAreaUnit: 'm2',
      mixPreset: 'mortar_1_4',
      wastagePercent: 10,
      bagSizeKg: 50,
      bagPriceInr: 400,
      sandRatePerM3Inr: 2000,
    });
    // net = 96; wet = 96 * 0.012 = 1.152; dry = 1.152 * 1.33
    expect(r.netAreaM2).toBeCloseTo(96, 4);
    expect(r.wetVolumeM3).toBeCloseTo(1.152, 4);
    expect(r.dryVolumeM3).toBeCloseTo(1.152 * MORTAR_DRY_FACTOR, 4);
    const dry = r.dryVolumeM3;
    const cementBefore = dry * (1 / 5) * CEMENT_DENSITY_KG_PER_M3;
    expect(r.cementKg).toBeCloseTo(cementBefore * 1.1, 1);
    expect(r.cementBags).toBe(Math.ceil(r.cementKg / 50 - 1e-9));
    expect(r.sandVolumeM3).toBeCloseTo(dry * (4 / 5) * 1.1, 3);
    expect(r.estimatedCostInr).toBeGreaterThan(0);
    expect(r.formula).toMatch(/V_wet/);
    expect(r.steps.length).toBeGreaterThan(4);
  });
});

describe('calculatePlasterQuantity — imperial / mixed units', () => {
  it('converts ft² area and inch thickness', () => {
    const r = calculatePlasterQuantity({
      surface: 'wall',
      area: 1000,
      areaUnit: 'ft2',
      thickness: 0.5,
      thicknessUnit: 'inch',
      mixPreset: 'mortar_1_6',
      wastagePercent: 0,
      bagSizeKg: 50,
    });
    expect(r.grossAreaM2).toBeCloseTo(1000 * 0.09290304, 3);
    expect(r.thicknessM).toBeCloseTo(0.5 * 0.0254, 5);
    expect(r.wetVolumeM3).toBeCloseTo(r.netAreaM2 * r.thicknessM, 3);
    expect(r.cementKg).toBeGreaterThan(0);
  });

  it('supports length × height in feet with openings in metres', () => {
    const r = calculatePlasterQuantity({
      surface: 'ceiling',
      length: 20,
      height: 15,
      lengthUnit: 'ft',
      heightUnit: 'ft',
      thickness: 10,
      thicknessUnit: 'mm',
      openingCount: 1,
      openingWidth: 1,
      openingHeight: 1,
      openingWidthUnit: 'm',
      openingHeightUnit: 'm',
      mixPreset: 'mortar_1_4',
      wastagePercent: 5,
    });
    const gross = 20 * 0.3048 * 15 * 0.3048;
    expect(r.grossAreaM2).toBeCloseTo(gross, 3);
    expect(r.openingAreaM2).toBeCloseTo(1, 4);
    expect(r.netAreaM2).toBeCloseTo(gross - 1, 3);
  });

  it('supports yard² area', () => {
    const r = calculatePlasterQuantity({
      surface: 'wall',
      area: 50,
      areaUnit: 'yard2',
      thickness: 12,
      thicknessUnit: 'mm',
      mixPreset: 'mortar_1_5',
      wastagePercent: 0,
    });
    expect(r.grossAreaM2).toBeCloseTo(50 * 0.83612736, 3);
  });
});

describe('presets do not lock thickness/mix', () => {
  it('uses entered thickness even when preset is interior_wall', () => {
    const r = calculatePlasterQuantity({
      surface: 'wall',
      surfacePreset: 'interior_wall',
      area: 10,
      areaUnit: 'm2',
      thickness: 20,
      thicknessUnit: 'mm',
      mixPreset: 'mortar_1_3',
      wastagePercent: 0,
    });
    expect(r.thicknessMm).toBeCloseTo(20, 1);
    expect(r.mixLabel).toMatch(/1:3/);
    expect(r.presetAssumptions.some((a) => /12 mm/.test(a))).toBe(true);
  });
});
