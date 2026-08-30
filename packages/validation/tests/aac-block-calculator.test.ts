import { describe, expect, it } from 'vitest';
import {
  AAC_BLOCK_PRESETS,
  calculateAacBlockQuantity,
  resolveAacBlockSizeMm,
} from '../src/aac-block-calculator';
import { calculateBrickQuantity } from '../src/brick-calculator';

describe('AAC presets', () => {
  it('includes common thicknesses', () => {
    expect(AAC_BLOCK_PRESETS.aac_600x200x200.width).toBe(200);
    expect(resolveAacBlockSizeMm('aac_600x200x100').label).toMatch(/100/);
  });
});

describe('calculateAacBlockQuantity', () => {
  it('computes blocks, net area, volume, adhesive and cost', () => {
    const r = calculateAacBlockQuantity({
      mode: 'forward',
      wallLength: 10,
      wallHeight: 3,
      wallThickness: 200,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      openingArea: 4,
      openingAreaUnit: 'm2',
      blockPreset: 'aac_600x200x200',
      jointThickness: 3,
      jointThicknessUnit: 'mm',
      wastagePercent: 5,
      includeAdhesiveEstimate: true,
      pricePerBlockInr: 65,
    });
    expect(r.grossWallAreaM2).toBeCloseTo(30, 4);
    expect(r.netWallAreaM2).toBeCloseTo(26, 4);
    expect(r.netWallVolumeM3).toBeCloseTo(5.2, 4);
    expect(r.blocksRequired).toBeGreaterThan(0);
    expect(r.wastageBlocks).toBeGreaterThanOrEqual(0);
    expect(r.adhesive).not.toBeNull();
    expect(r.adhesive!.adhesiveKg).toBeGreaterThan(0);
    expect(r.estimatedCostInr).toBe(r.blocksRequired * 65);
    expect(r.steps.some((s) => s.includes('AAC block'))).toBe(true);
  });

  it('supports reverse coverage from X blocks', () => {
    const r = calculateAacBlockQuantity({
      mode: 'reverse',
      availableBlocks: 200,
      wallThickness: 150,
      wallThicknessUnit: 'mm',
      blockPreset: 'aac_600x200x150',
      jointThickness: 3,
      wastagePercent: 5,
      includeAdhesiveEstimate: false,
    });
    expect(r.mode).toBe('reverse');
    expect(r.buildableAreaM2).toBeGreaterThan(0);
    expect(r.buildableVolumeM3).toBeGreaterThan(0);
  });

  it('supports custom block dimensions', () => {
    const r = calculateAacBlockQuantity({
      mode: 'forward',
      wallLength: 5,
      wallHeight: 2.5,
      wallThickness: 100,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      blockPreset: 'custom',
      blockLength: 600,
      blockWidth: 100,
      blockHeight: 200,
      blockSizeUnit: 'mm',
      jointThickness: 2,
      wastagePercent: 0,
      includeAdhesiveEstimate: false,
    });
    expect(r.blockLabel).toMatch(/Custom AAC/);
    expect(r.blocksRequired).toBeGreaterThan(0);
  });
});

describe('shared engine — AAC vs brick same wall', () => {
  it('uses the same masonry-wall math for equal modular volumes', () => {
    // Force identical modular volumes via custom sizes & zero joint
    const aac = calculateAacBlockQuantity({
      mode: 'forward',
      wallLength: 4,
      wallHeight: 2,
      wallThickness: 100,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      blockPreset: 'custom',
      blockLength: 200,
      blockWidth: 100,
      blockHeight: 100,
      blockSizeUnit: 'mm',
      jointThickness: 0,
      wastagePercent: 0,
      includeAdhesiveEstimate: false,
    });
    const brick = calculateBrickQuantity({
      mode: 'forward',
      wallLength: 4,
      wallHeight: 2,
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
      wastagePercent: 0,
      includeMortarEstimate: false,
    });
    expect(aac.netWallVolumeM3).toBeCloseTo(brick.netWallVolumeM3!, 6);
    expect(aac.blocksRequired).toBe(brick.bricksRequired);
  });
});
