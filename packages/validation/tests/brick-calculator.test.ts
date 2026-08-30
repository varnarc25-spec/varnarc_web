import { describe, expect, it } from 'vitest';
import {
  BRICK_SIZE_PRESETS,
  calculateBrickQuantity,
  modularBrickSizeMm,
  brickVolumesM3,
  resolveBrickSizeMm,
} from '../src/brick-calculator';

describe('brick presets', () => {
  it('lists common Indian and English sizes', () => {
    expect(BRICK_SIZE_PRESETS.indian_modular).toEqual(
      expect.objectContaining({ length: 190, width: 90, height: 90 }),
    );
    expect(resolveBrickSizeMm('english_standard').label).toMatch(/English/);
  });

  it('supports custom sizes', () => {
    const b = resolveBrickSizeMm('custom', { length: 200, width: 100, height: 100 });
    expect(b.length).toBe(200);
    expect(b.label).toMatch(/Custom/);
  });
});

describe('modularBrickSizeMm / volumes', () => {
  it('adds joint to each dimension', () => {
    const m = modularBrickSizeMm({ length: 190, width: 90, height: 90 }, 10);
    expect(m).toEqual({ length: 200, width: 100, height: 100 });
  });

  it('computes solid and modular volumes in m³', () => {
    const brick = { length: 190, width: 90, height: 90 };
    const modular = modularBrickSizeMm(brick, 10);
    const v = brickVolumesM3(brick, modular);
    expect(v.solid).toBeCloseTo(0.19 * 0.09 * 0.09, 8);
    expect(v.modular).toBeCloseTo(0.2 * 0.1 * 0.1, 8);
  });
});

describe('calculateBrickQuantity — forward', () => {
  it('computes bricks for a wall with openings and wastage', () => {
    const r = calculateBrickQuantity({
      mode: 'forward',
      wallLength: 10,
      wallHeight: 3,
      wallThickness: 200,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      openingArea: 4,
      openingAreaUnit: 'm2',
      brickPreset: 'indian_modular',
      mortarJoint: 10,
      mortarJointUnit: 'mm',
      wastagePercent: 5,
      includeMortarEstimate: true,
    });
    expect(r.grossWallAreaM2).toBeCloseTo(30, 4);
    expect(r.openingAreaM2).toBeCloseTo(4, 4);
    expect(r.netWallAreaM2).toBeCloseTo(26, 4);
    expect(r.netWallVolumeM3).toBeCloseTo(26 * 0.2, 4);
    // modular 200×100×100 mm = 0.002 m3
    const modular = 0.2 * 0.1 * 0.1;
    const before = Math.ceil(r.netWallVolumeM3! / modular - 1e-9);
    expect(r.bricksBeforeWastage).toBe(before);
    expect(r.bricksRequired).toBeGreaterThanOrEqual(before);
    expect(r.wastageBricks).toBe(r.bricksRequired - r.bricksBeforeWastage);
    expect(r.mortar).not.toBeNull();
    expect(r.mortar!.mortarVolumeM3).toBeGreaterThan(0);
    expect(r.formula).toMatch(/V_modular/);
    expect(r.steps.length).toBeGreaterThan(4);
  });

  it('deducts openings from count × size', () => {
    const r = calculateBrickQuantity({
      mode: 'forward',
      wallLength: 8,
      wallHeight: 3,
      wallThickness: 230,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      openingCount: 2,
      openingWidth: 1,
      openingHeight: 2.1,
      openingWidthUnit: 'm',
      openingHeightUnit: 'm',
      brickPreset: 'indian_traditional',
      wastagePercent: 0,
      includeMortarEstimate: false,
    });
    expect(r.openingAreaM2).toBeCloseTo(2 * 1 * 2.1, 4);
    expect(r.netWallAreaM2).toBeCloseTo(24 - 4.2, 4);
  });

  it('supports custom brick dimensions and cost', () => {
    const r = calculateBrickQuantity({
      mode: 'forward',
      wallLength: 5,
      wallHeight: 2.5,
      wallThickness: 100,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      brickPreset: 'custom',
      brickLength: 200,
      brickWidth: 100,
      brickHeight: 100,
      brickSizeUnit: 'mm',
      mortarJoint: 0,
      mortarJointUnit: 'mm',
      wastagePercent: 0,
      pricePerBrickInr: 8,
      includeMortarEstimate: false,
    });
    expect(r.brickLabel).toMatch(/Custom/);
    expect(r.estimatedCostInr).toBe(r.bricksRequired * 8);
  });

  it('converts imperial wall dimensions', () => {
    const r = calculateBrickQuantity({
      mode: 'forward',
      wallLength: 20,
      wallHeight: 10,
      wallThickness: 4,
      wallLengthUnit: 'ft',
      wallHeightUnit: 'ft',
      wallThicknessUnit: 'inch',
      brickPreset: 'english_standard',
      wastagePercent: 0,
      includeMortarEstimate: false,
    });
    expect(r.grossWallAreaM2).toBeCloseTo(20 * 0.3048 * 10 * 0.3048, 3);
    expect(r.bricksRequired).toBeGreaterThan(0);
  });

  it('rejects openings larger than wall', () => {
    expect(() =>
      calculateBrickQuantity({
        mode: 'forward',
        wallLength: 2,
        wallHeight: 2,
        wallThickness: 200,
        wallLengthUnit: 'm',
        wallHeightUnit: 'm',
        wallThicknessUnit: 'mm',
        openingArea: 10,
        brickPreset: 'indian_modular',
      }),
    ).toThrow(/Opening area/);
  });

  it('requires wall dimensions in forward mode', () => {
    expect(() =>
      calculateBrickQuantity({
        mode: 'forward',
        brickPreset: 'indian_modular',
      }),
    ).toThrow();
  });
});

describe('calculateBrickQuantity — reverse', () => {
  it('estimates buildable wall area from available bricks', () => {
    const r = calculateBrickQuantity({
      mode: 'reverse',
      availableBricks: 1000,
      wallThickness: 200,
      wallThicknessUnit: 'mm',
      brickPreset: 'indian_modular',
      mortarJoint: 10,
      mortarJointUnit: 'mm',
      wastagePercent: 5,
      includeMortarEstimate: false,
    });
    expect(r.mode).toBe('reverse');
    expect(r.buildableAreaM2).not.toBeNull();
    expect(r.buildableVolumeM3).not.toBeNull();
    expect(r.buildableAreaM2!).toBeGreaterThan(0);
    // usable = 1000/1.05; volume = usable * 0.002; area = volume/0.2
    const usable = 1000 / 1.05;
    const vol = usable * 0.002;
    expect(r.buildableVolumeM3).toBeCloseTo(vol, 3);
    expect(r.buildableAreaM2).toBeCloseTo(vol / 0.2, 3);
  });

  it('requires available bricks in reverse mode', () => {
    expect(() =>
      calculateBrickQuantity({
        mode: 'reverse',
        wallThickness: 200,
        wallThicknessUnit: 'mm',
        brickPreset: 'indian_modular',
      }),
    ).toThrow();
  });
});
