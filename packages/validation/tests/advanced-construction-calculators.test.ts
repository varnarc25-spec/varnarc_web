import { describe, expect, it } from 'vitest';
import {
  ADVANCED_CONSTRUCTION_CALCULATORS,
  STRUCTURAL_PLANNING_DISCLAIMER,
  calculateExcavation,
  calculateFalseCeiling,
  calculateRoofing,
  calculateStaircase,
  calculateWallArea,
  calculateWaterTank,
} from '../src/advanced-construction-calculators';

describe('advanced construction calculators', () => {
  it('lists seven hub calculators with canonical routes', () => {
    expect(ADVANCED_CONSTRUCTION_CALCULATORS).toHaveLength(7);
    expect(ADVANCED_CONSTRUCTION_CALCULATORS.map((c) => c.href)).toContain(
      '/construction/aac-block-calculator',
    );
  });

  it('estimates false-ceiling boards from room area', () => {
    const r = calculateFalseCeiling({ length: 4, width: 3, lengthUnit: 'm', widthUnit: 'm' });
    expect(r.netAreaM2).toBe(12);
    expect(r.boardsRequired).toBeGreaterThan(0);
  });

  it('plans staircase geometry without claiming structural design', () => {
    const r = calculateStaircase({
      floorHeight: 3,
      riserHeight: 0.175,
      treadDepth: 0.28,
      stairWidth: 1,
      waistThickness: 0.15,
      dimensionUnit: 'm',
    });
    expect(r.risers).toBeGreaterThan(10);
    expect(r.treads).toBe(r.risers - 1);
    expect(r.disclaimer).toBe(STRUCTURAL_PLANNING_DISCLAIMER);
  });

  it('converts tank volume to litres', () => {
    const r = calculateWaterTank({
      shape: 'rectangular',
      length: 2,
      width: 1,
      height: 1,
      dimensionUnit: 'm',
    });
    expect(r.capacityLitres).toBe(2000);
  });

  it('increases roof area with pitch', () => {
    const flat = calculateRoofing({
      planLength: 10,
      planWidth: 8,
      pitchDegrees: 0,
      dimensionUnit: 'm',
    });
    const pitched = calculateRoofing({
      planLength: 10,
      planWidth: 8,
      pitchDegrees: 30,
      dimensionUnit: 'm',
    });
    expect(pitched.roofAreaM2).toBeGreaterThan(flat.roofAreaM2);
  });

  it('deducts openings from wall area', () => {
    const r = calculateWallArea({
      wallLength: 5,
      wallHeight: 3,
      wallCount: 1,
      openingWidth: 1,
      openingHeight: 2,
      openingCount: 1,
      dimensionUnit: 'm',
      openingUnit: 'm',
    });
    expect(r.grossAreaM2).toBe(15);
    expect(r.netAreaM2).toBe(13);
  });

  it('applies excavation bulking to loose volume', () => {
    const r = calculateExcavation({
      length: 10,
      width: 4,
      depth: 1.5,
      bulkingPercent: 20,
      dimensionUnit: 'm',
    });
    expect(r.inSituVolumeM3).toBe(60);
    expect(r.looseVolumeM3).toBe(72);
  });
});
