import { describe, expect, it } from 'vitest';
import {
  RCC_PRELIMINARY_STEEL_KG_PER_M3,
  RCC_STRUCTURAL_DISCLAIMER,
  calculateBeamVolume,
  calculateColumnVolume,
  calculateFootingVolume,
  calculateRccQuantity,
} from '../src/rcc-calculator';

describe('calculateRccQuantity', () => {
  it('computes slab volume, materials and no steel by default', () => {
    const r = calculateRccQuantity({
      element: 'slab',
      length: 5,
      width: 4,
      thickness: 150,
      thicknessUnit: 'mm',
      quantity: 1,
      grade: 'M20',
      wastagePercent: 5,
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
    });
    expect(r.wetVolumeM3).toBeCloseTo(3, 4);
    expect(r.planAreaM2).toBeCloseTo(20, 4);
    expect(r.planAreaOneM2).toBeCloseTo(20, 4);
    expect(r.dimensionsM?.thickness).toBeCloseTo(0.15, 4);
    expect(r.columnShape).toBeNull();
    expect(r.footingShape).toBeNull();
    expect(r.pcc).toBeNull();
    expect(r.orderVolumeM3).toBeCloseTo(3.15, 3);
    expect(r.materials?.mixLabel).toMatch(/1:1.5:3|M20/i);
    expect(r.steel).toBeNull();
    expect(r.structuralDisclaimer).toBe(RCC_STRUCTURAL_DISCLAIMER);
  });

  it('multiplies by quantity for rectangular columns', () => {
    const r = calculateRccQuantity({
      element: 'column',
      columnShape: 'rectangular',
      length: 0.3,
      width: 0.3,
      height: 3,
      quantity: 8,
      grade: 'M25',
      wastagePercent: 0,
      includeMaterialBreakdown: false,
    });
    expect(r.columnShape).toBe('rectangular');
    expect(r.wetVolumeOneM3).toBeCloseTo(0.27, 4);
    expect(r.wetVolumeM3).toBeCloseTo(2.16, 3);
  });

  it('computes circular column volume with π r² H', () => {
    const r = calculateRccQuantity({
      element: 'column',
      columnShape: 'circular',
      diameter: 300,
      diameterUnit: 'mm',
      height: 3,
      heightUnit: 'm',
      quantity: 4,
      wastagePercent: 0,
      includeMaterialBreakdown: false,
    });
    const one = Math.PI * 0.15 * 0.15 * 3;
    expect(r.columnShape).toBe('circular');
    expect(r.dimensionsM?.diameter).toBeCloseTo(0.3, 4);
    expect(r.wetVolumeOneM3).toBeCloseTo(one, 4);
    expect(r.wetVolumeM3).toBeCloseTo(one * 4, 3);
    expect(r.formula).toMatch(/π/);
  });

  it('returns labelled preliminary steel ranges when enabled', () => {
    const r = calculateRccQuantity({
      element: 'beam',
      length: 4,
      width: 0.23,
      thickness: 0.45,
      thicknessUnit: 'm',
      quantity: 1,
      wastagePercent: 0,
      includeSteelEstimate: true,
      includeMaterialBreakdown: false,
    });
    const band = RCC_PRELIMINARY_STEEL_KG_PER_M3.beam;
    expect(r.steel?.kgPerM3Min).toBe(band.min);
    expect(r.steel?.kgPerM3Max).toBe(band.max);
    expect(r.steel?.warning).toMatch(/qualified engineer/i);
    expect(r.steel?.ratioSource).toMatch(/preliminary/i);
    expect(
      r.assumptions.some((a) => /PRELIMINARY ONLY|structural engineering design/i.test(a)),
    ).toBe(true);
  });

  it('supports footing and custom steel ratios', () => {
    const r = calculateRccQuantity({
      element: 'footing',
      length: 1.5,
      width: 1.5,
      thickness: 0.3,
      thicknessUnit: 'm',
      quantity: 2,
      wastagePercent: 0,
      includeSteelEstimate: true,
      steelKgPerM3: 70,
      steelKgPerM3Min: 60,
      steelKgPerM3Max: 80,
      includeMaterialBreakdown: true,
      grade: 'M20',
    });
    expect(r.wetVolumeM3).toBeCloseTo(1.35, 3);
    expect(r.footingShape).toBe('rectangular');
    expect(r.steel?.kgPerM3Typical).toBe(70);
    expect(r.steel?.steelKgTypical).toBeCloseTo(1.35 * 70, 0);
  });
});

describe('calculateBeamVolume', () => {
  it('returns individual and total volume via shared RCC utilities', () => {
    const r = calculateBeamVolume({
      length: 4,
      width: 230,
      thickness: 450,
      widthUnit: 'mm',
      thicknessUnit: 'mm',
      lengthUnit: 'm',
      quantity: 3,
      wastagePercent: 5,
      grade: 'M20',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
      ratePerM3Inr: 6000,
    });
    expect(r.element).toBe('beam');
    expect(r.wetVolumeOneM3).toBeCloseTo(0.414, 3);
    expect(r.wetVolumeM3).toBeCloseTo(1.242, 3);
    expect(r.orderVolumeM3).toBeCloseTo(1.242 * 1.05, 3);
    expect(r.materials).not.toBeNull();
    expect(r.steel).toBeNull();
    expect(r.estimatedCostInr).toBeGreaterThan(0);
  });

  it('does not generate steel design when steel estimate is off', () => {
    const r = calculateBeamVolume({
      length: 3,
      width: 0.2,
      thickness: 0.4,
      quantity: 1,
      wastagePercent: 0,
      includeSteelEstimate: false,
      includeMaterialBreakdown: false,
    });
    expect(r.steel).toBeNull();
  });
});

describe('calculateColumnVolume', () => {
  it('rectangular columns: individual, total, materials and cost', () => {
    const r = calculateColumnVolume({
      columnShape: 'rectangular',
      length: 230,
      width: 450,
      height: 3,
      lengthUnit: 'mm',
      widthUnit: 'mm',
      heightUnit: 'm',
      quantity: 6,
      wastagePercent: 5,
      grade: 'M25',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
      ratePerM3Inr: 5500,
    });
    expect(r.element).toBe('column');
    expect(r.columnShape).toBe('rectangular');
    expect(r.wetVolumeOneM3).toBeCloseTo(0.23 * 0.45 * 3, 3);
    expect(r.wetVolumeM3).toBeCloseTo(0.23 * 0.45 * 3 * 6, 3);
    expect(r.materials).not.toBeNull();
    expect(r.estimatedCostInr).toBeGreaterThan(0);
    expect(r.disclaimer).toMatch(/not a structural design|load-capacity/i);
  });

  it('circular columns reuse shared mix utilities', () => {
    const r = calculateColumnVolume({
      columnShape: 'circular',
      diameter: 400,
      diameterUnit: 'mm',
      height: 3.2,
      quantity: 2,
      wastagePercent: 0,
      grade: 'M20',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
    });
    const one = Math.PI * 0.2 * 0.2 * 3.2;
    expect(r.wetVolumeOneM3).toBeCloseTo(one, 3);
    expect(r.wetVolumeM3).toBeCloseTo(one * 2, 3);
    expect(r.materials?.cementBags).toBeGreaterThan(0);
  });
});

describe('calculateFootingVolume', () => {
  it('square footing uses L×L×D and skips load-based sizing', () => {
    const r = calculateFootingVolume({
      footingShape: 'square',
      length: 1.5,
      thickness: 0.3,
      thicknessUnit: 'm',
      quantity: 4,
      wastagePercent: 0,
      grade: 'M20',
      includeMaterialBreakdown: true,
      includeSteelEstimate: false,
      includePccLayer: false,
    });
    expect(r.footingShape).toBe('square');
    expect(r.dimensionsM?.width).toBeCloseTo(1.5, 4);
    expect(r.wetVolumeOneM3).toBeCloseTo(1.5 * 1.5 * 0.3, 4);
    expect(r.wetVolumeM3).toBeCloseTo(1.5 * 1.5 * 0.3 * 4, 3);
    expect(r.pcc).toBeNull();
    expect(r.disclaimer).toMatch(/footing sizing from building loads/i);
  });

  it('rectangular footing with PCC returns separate PCC volume and materials', () => {
    const r = calculateFootingVolume({
      footingShape: 'rectangular',
      length: 2,
      width: 1.5,
      thickness: 0.4,
      thicknessUnit: 'm',
      quantity: 2,
      wastagePercent: 5,
      grade: 'M25',
      includeMaterialBreakdown: true,
      includePccLayer: true,
      pccThickness: 75,
      pccThicknessUnit: 'mm',
      pccMix: 'M7.5',
      ratePerM3Inr: 6000,
      pccRatePerM3Inr: 4500,
      includeSteelEstimate: false,
    });
    expect(r.wetVolumeOneM3).toBeCloseTo(2 * 1.5 * 0.4, 4);
    expect(r.pcc).not.toBeNull();
    expect(r.pcc!.wetVolumeOneM3).toBeCloseTo(2 * 1.5 * 0.075, 4);
    expect(r.pcc!.wetVolumeM3).toBeCloseTo(2 * 1.5 * 0.075 * 2, 4);
    expect(r.pcc!.orderVolumeM3).toBeCloseTo(2 * 1.5 * 0.075 * 2 * 1.05, 3);
    expect(r.pcc!.materials?.mixLabel).toMatch(/1:4:8|M7\.5/i);
    expect(r.materials).not.toBeNull();
    expect(r.estimatedCostInr).toBeGreaterThan(0);
    expect(r.pcc!.estimatedCostInr).toBeGreaterThan(0);
    expect(r.totalEstimatedCostInr).toBe(
      (r.estimatedCostInr ?? 0) + (r.pcc!.estimatedCostInr ?? 0),
    );
  });
});
