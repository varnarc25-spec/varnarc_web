import { describe, expect, it } from 'vitest';
import {
  CONCRETE_DRY_FACTOR,
  CEMENT_DENSITY_KG_PER_M3,
  M3_TO_FT3,
  SHAPE_FORMULAS,
  calculateConcreteQuantity,
  computeWetVolumeM3,
  concreteCalculatorInputSchema,
} from '../src/concrete-calculator';

describe('SHAPE_FORMULAS', () => {
  it('defines a formula for every supported shape', () => {
    expect(SHAPE_FORMULAS.slab).toBe('V = L × W × T');
    expect(SHAPE_FORMULAS.circular_column).toMatch(/π/);
    expect(SHAPE_FORMULAS.custom_rectangular).toBe('V = L × W × H');
  });
});

describe('computeWetVolumeM3 — shape formulas', () => {
  it('slab: L × W × T', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'slab',
      length: 5,
      width: 4,
      thickness: 150,
      lengthUnit: 'm',
      widthUnit: 'm',
      thicknessUnit: 'mm',
    });
    const { wetVolumeM3 } = computeWetVolumeM3(input);
    expect(wetVolumeM3).toBeCloseTo(5 * 4 * 0.15, 6);
  });

  it('rectangular footing: L × W × D', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'rectangular_footing',
      length: 2,
      width: 1.5,
      depth: 0.45,
      lengthUnit: 'm',
      widthUnit: 'm',
      depthUnit: 'm',
    });
    const { wetVolumeM3 } = computeWetVolumeM3(input);
    expect(wetVolumeM3).toBeCloseTo(2 * 1.5 * 0.45, 6);
  });

  it('column: L × W × H', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'column',
      length: 0.3,
      width: 0.45,
      height: 3,
      lengthUnit: 'm',
      widthUnit: 'm',
      heightUnit: 'm',
    });
    const { wetVolumeM3 } = computeWetVolumeM3(input);
    expect(wetVolumeM3).toBeCloseTo(0.3 * 0.45 * 3, 6);
  });

  it('wall: L × H × T', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'wall',
      length: 10,
      height: 3,
      thickness: 200,
      lengthUnit: 'm',
      heightUnit: 'm',
      thicknessUnit: 'mm',
    });
    const { wetVolumeM3 } = computeWetVolumeM3(input);
    expect(wetVolumeM3).toBeCloseTo(10 * 3 * 0.2, 6);
  });

  it('circular column from diameter: π r² H', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'circular_column',
      diameter: 0.4,
      height: 3,
      diameterUnit: 'm',
      heightUnit: 'm',
    });
    const { wetVolumeM3, dimensionsM } = computeWetVolumeM3(input);
    expect(dimensionsM.radius).toBeCloseTo(0.2, 6);
    expect(wetVolumeM3).toBeCloseTo(Math.PI * 0.2 * 0.2 * 3, 6);
  });

  it('circular column from radius', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'circular_column',
      radius: 0.25,
      height: 4,
      radiusUnit: 'm',
      heightUnit: 'm',
    });
    const { wetVolumeM3 } = computeWetVolumeM3(input);
    expect(wetVolumeM3).toBeCloseTo(Math.PI * 0.25 * 0.25 * 4, 6);
  });

  it('custom rectangular: L × W × H', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'custom_rectangular',
      length: 1,
      width: 2,
      height: 3,
      lengthUnit: 'm',
      widthUnit: 'm',
      heightUnit: 'm',
    });
    const { wetVolumeM3 } = computeWetVolumeM3(input);
    expect(wetVolumeM3).toBeCloseTo(6, 6);
  });
});

describe('unit conversion', () => {
  it('converts imperial slab dimensions to metres', () => {
    const input = concreteCalculatorInputSchema.parse({
      shape: 'slab',
      length: 10,
      width: 12,
      thickness: 6,
      lengthUnit: 'ft',
      widthUnit: 'ft',
      thicknessUnit: 'inch',
    });
    const { wetVolumeM3, dimensionsM } = computeWetVolumeM3(input);
    expect(dimensionsM.length).toBeCloseTo(10 * 0.3048, 4);
    expect(dimensionsM.width).toBeCloseTo(12 * 0.3048, 4);
    expect(dimensionsM.thickness).toBeCloseTo(6 * 0.0254, 4);
    expect(wetVolumeM3).toBeCloseTo(
      dimensionsM.length! * dimensionsM.width! * dimensionsM.thickness!,
      4,
    );
  });
});

describe('calculateConcreteQuantity', () => {
  it('applies wastage to wet volume', () => {
    const r = calculateConcreteQuantity({
      shape: 'custom_rectangular',
      length: 1,
      width: 1,
      height: 1,
      lengthUnit: 'm',
      widthUnit: 'm',
      heightUnit: 'm',
      wastagePercent: 5,
      includeMaterialBreakdown: false,
    });
    expect(r.wetVolumeM3).toBeCloseTo(1, 4);
    expect(r.orderVolumeM3).toBeCloseTo(1.05, 4);
    expect(r.wastageExtraM3).toBeCloseTo(0.05, 4);
    expect(r.wetVolumeFt3).toBeCloseTo(M3_TO_FT3, 2);
  });

  it('builds material breakdown for M20', () => {
    const r = calculateConcreteQuantity({
      shape: 'custom_rectangular',
      length: 1,
      width: 1,
      height: 1,
      lengthUnit: 'm',
      widthUnit: 'm',
      heightUnit: 'm',
      mixPreset: 'M20',
      wastagePercent: 0,
      includeMaterialBreakdown: true,
      waterCementRatio: 0.45,
    });
    expect(r.materials).not.toBeNull();
    const dry = 1 * CONCRETE_DRY_FACTOR;
    const cementKg = dry * (1 / 5.5) * CEMENT_DENSITY_KG_PER_M3;
    expect(r.materials!.cementKg).toBeCloseTo(cementKg, 1);
    expect(r.materials!.sandVolumeM3).toBeCloseTo(dry * (1.5 / 5.5), 3);
    expect(r.materials!.aggregateVolumeM3).toBeCloseTo(dry * (3 / 5.5), 3);
    expect(r.materials!.waterLitres).toBeCloseTo(cementKg * 0.45, 1);
    expect(r.materials!.cementBags50kg).toBe(Math.ceil(cementKg / 50 - 1e-9));
  });

  it('estimates cost from custom rate per m³', () => {
    const r = calculateConcreteQuantity({
      shape: 'slab',
      length: 10,
      width: 10,
      thickness: 100,
      lengthUnit: 'm',
      widthUnit: 'm',
      thicknessUnit: 'mm',
      wastagePercent: 0,
      ratePerM3Inr: 5000,
      includeMaterialBreakdown: false,
    });
    // wet = 10*10*0.1 = 10 m3
    expect(r.orderVolumeM3).toBeCloseTo(10, 4);
    expect(r.estimatedCostInr).toBe(50_000);
  });

  it('includes formula and steps', () => {
    const r = calculateConcreteQuantity({
      shape: 'wall',
      length: 5,
      height: 2.5,
      thickness: 150,
      lengthUnit: 'm',
      heightUnit: 'm',
      thicknessUnit: 'mm',
      wastagePercent: 5,
    });
    expect(r.formula).toBe('V = L × H × T');
    expect(r.steps.length).toBeGreaterThan(2);
    expect(r.assumptions.length).toBeGreaterThan(2);
  });

  it('rejects missing dimensions for slab', () => {
    expect(() =>
      calculateConcreteQuantity({
        shape: 'slab',
        length: 5,
        width: 4,
      }),
    ).toThrow();
  });

  it('rejects circular column without diameter or radius', () => {
    expect(() =>
      calculateConcreteQuantity({
        shape: 'circular_column',
        height: 3,
        heightUnit: 'm',
      }),
    ).toThrow();
  });

  it('supports custom mix parts', () => {
    const r = calculateConcreteQuantity({
      shape: 'column',
      length: 0.23,
      width: 0.45,
      height: 3,
      lengthUnit: 'm',
      widthUnit: 'm',
      heightUnit: 'm',
      mixPreset: 'custom',
      cementParts: 1,
      sandParts: 2,
      aggregateParts: 4,
      wastagePercent: 0,
    });
    expect(r.materials?.mixLabel).toMatch(/Custom/);
    expect(r.materials?.cementParts).toBe(1);
    expect(r.materials?.sandParts).toBe(2);
    expect(r.materials?.aggregateParts).toBe(4);
  });
});
