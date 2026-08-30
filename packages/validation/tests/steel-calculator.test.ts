import { describe, expect, it } from 'vitest';
import {
  COMMON_REBAR_DIAMETERS_MM,
  REBAR_WEIGHT_DIVISOR,
  calculateRebarRowWeightKg,
  calculateRebarWeightPerMetre,
  calculateSteelWeight,
  rebarWeightFromDensityKgPerM,
} from '../src/steel-calculator';

describe('calculateRebarWeightPerMetre (d²/162)', () => {
  it('matches the standard formula for common diameters', () => {
    expect(calculateRebarWeightPerMetre(8)).toBeCloseTo(64 / 162, 6);
    expect(calculateRebarWeightPerMetre(10)).toBeCloseTo(100 / 162, 6);
    expect(calculateRebarWeightPerMetre(12)).toBeCloseTo(144 / 162, 6);
    expect(calculateRebarWeightPerMetre(16)).toBeCloseTo(256 / 162, 6);
    expect(calculateRebarWeightPerMetre(20)).toBeCloseTo(400 / 162, 6);
    expect(calculateRebarWeightPerMetre(25)).toBeCloseTo(625 / 162, 6);
    expect(calculateRebarWeightPerMetre(32)).toBeCloseTo(1024 / 162, 6);
  });

  it('is close to density-based π/4·ρ·d² for construction diameters', () => {
    for (const d of COMMON_REBAR_DIAMETERS_MM) {
      const approx = calculateRebarWeightPerMetre(d);
      const exact = rebarWeightFromDensityKgPerM(d);
      // d²/162 vs d²/162.28 — relative error under ~0.2%
      expect(Math.abs(approx - exact) / exact).toBeLessThan(0.003);
    }
  });

  it('rejects non-positive diameter', () => {
    expect(() => calculateRebarWeightPerMetre(0)).toThrow();
    expect(() => calculateRebarWeightPerMetre(-10)).toThrow();
  });

  it('uses divisor 162', () => {
    expect(REBAR_WEIGHT_DIVISOR).toBe(162);
  });
});

describe('calculateRebarRowWeightKg', () => {
  it('multiplies unit weight by length and quantity', () => {
    // 12 mm: 144/162 kg/m × 10 m × 5
    const w = calculateRebarRowWeightKg(12, 10, 5);
    expect(w).toBeCloseTo((144 / 162) * 10 * 5, 6);
  });
});

describe('calculateSteelWeight — multi-row', () => {
  it('sums multiple diameters and returns kg + tonnes', () => {
    const r = calculateSteelWeight({
      rows: [
        {
          id: '1',
          diameterMm: 12,
          length: 12,
          lengthUnit: 'm',
          quantity: 20,
        },
        {
          id: '2',
          diameterMm: 16,
          length: 10,
          lengthUnit: 'm',
          quantity: 10,
        },
      ],
      ratePerKgInr: 55,
    });
    const expected = (144 / 162) * 12 * 20 + (256 / 162) * 10 * 10;
    expect(r.totalWeightKg).toBeCloseTo(expected, 2);
    expect(r.totalWeightTonnes).toBeCloseTo(expected / 1000, 4);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]!.unitWeightKgPerM).toBeCloseTo(144 / 162, 3);
    expect(r.estimatedCostInr).toBeCloseTo(Math.round(r.totalWeightKg * 55), 0);
    expect(r.formula).toMatch(/d² \/ 162/);
    expect(r.steps.length).toBeGreaterThan(2);
  });

  it('supports total-length style row (qty = 1)', () => {
    const r = calculateSteelWeight({
      rows: [
        {
          id: 'tl',
          diameterMm: 10,
          length: 250,
          lengthUnit: 'm',
          quantity: 1,
          label: 'Total length',
        },
      ],
    });
    expect(r.totalLengthM).toBeCloseTo(250, 4);
    expect(r.totalWeightKg).toBeCloseTo((100 / 162) * 250, 2);
  });

  it('converts length units to metres', () => {
    const r = calculateSteelWeight({
      rows: [
        {
          id: 'ft',
          diameterMm: 8,
          length: 100,
          lengthUnit: 'ft',
          quantity: 1,
        },
      ],
    });
    expect(r.rows[0]!.lengthM).toBeCloseTo(100 * 0.3048, 3);
  });

  it('supports custom diameter', () => {
    const r = calculateSteelWeight({
      rows: [
        {
          id: 'c',
          diameterMm: 14,
          length: 5,
          lengthUnit: 'm',
          quantity: 2,
        },
      ],
    });
    expect(r.rows[0]!.unitWeightKgPerM).toBeCloseTo(196 / 162, 4);
    expect(r.totalWeightKg).toBeCloseTo((196 / 162) * 5 * 2, 3);
  });

  it('requires at least one row', () => {
    expect(() => calculateSteelWeight({ rows: [] })).toThrow();
  });
});
