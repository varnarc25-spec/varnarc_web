import { describe, expect, it } from 'vitest';
import {
  calculateMasonryUnitQuantity,
  modularUnitSizeMm,
  unitVolumesM3,
} from '../src/masonry-wall';

describe('masonry-wall geometry', () => {
  it('builds modular sizes and volumes', () => {
    const m = modularUnitSizeMm({ length: 600, width: 200, height: 200 }, 3);
    expect(m).toEqual({ length: 603, width: 203, height: 203 });
    const v = unitVolumesM3({ length: 600, width: 200, height: 200 }, m);
    expect(v.solid).toBeCloseTo(0.6 * 0.2 * 0.2, 8);
  });
});

describe('calculateMasonryUnitQuantity', () => {
  it('forward path is shared for any unit noun', () => {
    const r = calculateMasonryUnitQuantity({
      mode: 'forward',
      wallLength: 10,
      wallHeight: 3,
      wallThickness: 200,
      wallLengthUnit: 'm',
      wallHeightUnit: 'm',
      wallThicknessUnit: 'mm',
      openings: { openingArea: 2, openingAreaUnit: 'm2' },
      unit: { length: 600, width: 200, height: 200, label: 'Test block' },
      jointMm: 3,
      wastagePercent: 5,
      includeJointMaterial: true,
      jointMaterial: { kind: 'adhesive', densityKgPerM3: 1500, bagSizeKg: 40 },
      unitNoun: 'block',
      version: 'test',
      disclaimer: 'test',
    });
    expect(r.netWallAreaM2).toBeCloseTo(28, 4);
    expect(r.unitsRequired).toBeGreaterThan(0);
    expect(r.jointMaterial?.kind).toBe('adhesive');
    expect(r.jointMaterial?.adhesiveKg).toBeGreaterThan(0);
  });

  it('reverse path estimates coverage', () => {
    const r = calculateMasonryUnitQuantity({
      mode: 'reverse',
      wallThickness: 200,
      wallThicknessUnit: 'mm',
      availableUnits: 500,
      unit: { length: 600, width: 200, height: 200, label: 'Test' },
      jointMm: 3,
      wastagePercent: 0,
      unitNoun: 'block',
      version: 'test',
      disclaimer: 'test',
    });
    expect(r.buildableAreaM2).toBeGreaterThan(0);
    expect(r.buildableVolumeM3).toBeCloseTo(500 * r.modularUnitVolumeM3, 4);
  });
});
