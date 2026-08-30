import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAINT_COVERAGE_M2_PER_L,
  M2_TO_FT2,
  calculatePaintQuantity,
  planPaintPackages,
} from '../src/paint-calculator';

describe('planPaintPackages', () => {
  it('covers need with larger tins first', () => {
    const { packages, purchaseLitres } = planPaintPackages(23, [1, 4, 10, 20]);
    expect(purchaseLitres).toBeGreaterThanOrEqual(23);
    expect(packages.find((p) => p.sizeLitres === 20)?.count).toBe(1);
  });
});

describe('calculatePaintQuantity — forward room', () => {
  it('computes wall area minus openings with coats and wastage', () => {
    // 4×3×3 room → walls 2*(4+3)*3 = 42; 1 door 0.9*2.1=1.89; 2 windows 1.2*1.2*2=2.88
    const r = calculatePaintQuantity({
      mode: 'forward',
      scope: 'room',
      length: 4,
      width: 3,
      height: 3,
      doors: 1,
      windows: 2,
      includeCeiling: false,
      coats: 2,
      coveragePerLitre: 10,
      coverageUnit: 'm2_per_l',
      wastagePercent: 10,
      packageSizesLitres: [1, 4, 10, 20],
    });
    expect(r.wallNetM2).toBeCloseTo(42 - 1.89 - 2.88, 2);
    expect(r.paintLitres).toBeCloseTo(((r.netPaintableAreaM2 * 2) / 10) * 1.1, 2);
    expect(r.paintPurchaseLitres).toBeGreaterThanOrEqual(r.paintLitres);
    expect(r.formula).toMatch(/A_net/);
    expect(r.steps.length).toBeGreaterThan(3);
  });

  it('includes ceiling, primer and putty when selected', () => {
    const r = calculatePaintQuantity({
      mode: 'forward',
      scope: 'room',
      length: 5,
      width: 4,
      height: 3,
      doors: 0,
      windows: 0,
      includeCeiling: true,
      coats: 2,
      coveragePerLitre: 10,
      includePrimer: true,
      primerCoats: 1,
      primerCoveragePerLitre: 12,
      includePutty: true,
      puttyKgPerM2: 1.1,
      wastagePercent: 0,
      paintPricePerLitreInr: 400,
      primerPricePerLitreInr: 300,
      puttyPricePerKgInr: 40,
    });
    expect(r.ceilingM2).toBeCloseTo(20, 4);
    expect(r.primerLitres).toBeGreaterThan(0);
    expect(r.puttyKg).toBeCloseTo(r.netPaintableAreaM2 * 1.1, 1);
    expect(r.estimatedCostInr).toBeGreaterThan(0);
  });
});

describe('room-by-room and whole-house', () => {
  it('sums multiple rooms', () => {
    const r = calculatePaintQuantity({
      mode: 'forward',
      scope: 'rooms',
      rooms: [
        {
          name: 'Bedroom',
          length: 4,
          width: 3,
          height: 3,
          doors: 1,
          windows: 1,
          includeCeiling: false,
        },
        {
          name: 'Living',
          length: 6,
          width: 4,
          height: 3,
          doors: 2,
          windows: 2,
          includeCeiling: true,
        },
      ],
      coats: 2,
      coveragePerLitre: 10,
      wastagePercent: 0,
    });
    expect(r.rooms).toHaveLength(2);
    expect(r.netPaintableAreaM2).toBeCloseTo(
      r.rooms[0]!.netPaintableM2 + r.rooms[1]!.netPaintableM2,
      3,
    );
  });

  it('accepts house scope with room list', () => {
    const r = calculatePaintQuantity({
      mode: 'forward',
      scope: 'house',
      rooms: [{ length: 10, width: 8, height: 3, doors: 4, windows: 6, includeCeiling: false }],
      coats: 2,
      coveragePerLitre: 10,
      wastagePercent: 5,
    });
    expect(r.scope).toBe('house');
    expect(r.paintLitres).toBeGreaterThan(0);
  });
});

describe('direct area and coverage override', () => {
  it('uses direct wall area in ft² with ft²/L coverage', () => {
    const r = calculatePaintQuantity({
      mode: 'forward',
      scope: 'direct_area',
      wallArea: 1000,
      wallAreaUnit: 'ft2',
      doors: 0,
      windows: 0,
      coats: 1,
      coveragePerLitre: 100,
      coverageUnit: 'ft2_per_l',
      wastagePercent: 0,
    });
    expect(r.netPaintableAreaM2).toBeCloseTo(1000 / M2_TO_FT2, 2);
    expect(r.coverageWasOverridden).toBe(true);
    // 100 ft²/L ≈ 100/10.76 m²/L; litres ≈ area_ft2 / 100
    expect(r.paintLitres).toBeCloseTo(10, 1);
  });

  it('marks default coverage as not overridden', () => {
    const r = calculatePaintQuantity({
      mode: 'forward',
      scope: 'direct_area',
      wallArea: 50,
      wallAreaUnit: 'm2',
      doors: 0,
      windows: 0,
      coats: 1,
      coveragePerLitre: DEFAULT_PAINT_COVERAGE_M2_PER_L,
      coverageUnit: 'm2_per_l',
      wastagePercent: 0,
    });
    expect(r.coverageWasOverridden).toBe(false);
  });
});

describe('reverse mode', () => {
  it('estimates coverable area from litres', () => {
    const r = calculatePaintQuantity({
      mode: 'reverse',
      availableLitres: 20,
      coats: 2,
      coveragePerLitre: 10,
      coverageUnit: 'm2_per_l',
      wastagePercent: 10,
    });
    // (20*10/2)/1.1 = 90.909...
    expect(r.netPaintableAreaM2).toBeCloseTo(90.909, 2);
    expect(r.reverseAreaOneCoatM2).toBeCloseTo(200, 2);
    expect(r.paintPackages).toHaveLength(0);
  });
});
