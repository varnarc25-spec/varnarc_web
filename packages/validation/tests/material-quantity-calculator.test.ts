import { describe, expect, it } from 'vitest';
import {
  calculateMaterialQuantities,
  constructionMaterialFactors,
  materialRates,
} from '../src/material-quantity-calculator';

const base = {
  builtUpArea: 1500,
  areaUnit: 'sqft' as const,
  floors: 1,
  quality: 'standard' as const,
  location: 'India',
  wastagePercent: 0,
};

describe('calculateMaterialQuantities', () => {
  it('matches published 1500 sq ft standard factors at 0% wastage', () => {
    const r = calculateMaterialQuantities(base);
    const byId = Object.fromEntries(r.lines.map((l) => [l.id, l]));
    expect(byId.cement?.quantity).toBe(620);
    expect(byId.steel?.quantity).toBe(5800);
    expect(byId.sand?.quantity).toBe(42);
    expect(byId.aggregate?.quantity).toBe(56);
    expect(byId.masonry?.quantity).toBe(12_000);
    expect(byId.tiles?.quantity).toBe(1650);
    expect(byId.paint?.quantity).toBe(220);
    expect(byId.cement?.estimatedCost).toBe(620 * materialRates.cementPerBag);
    expect(r.disclaimer).toMatch(/Indicative estimate/);
  });

  it('scales 1000 sq ft linearly vs 1500 sq ft', () => {
    const a = calculateMaterialQuantities({ ...base, builtUpArea: 1000 });
    const b = calculateMaterialQuantities(base);
    const cementA = a.lines.find((l) => l.id === 'cement')!.quantity;
    const cementB = b.lines.find((l) => l.id === 'cement')!.quantity;
    expect(cementA / cementB).toBeCloseTo(1000 / 1500, 2);
    expect(cementA).toBe(Math.round(1000 * constructionMaterialFactors.cementBags));
  });

  it('increases structural quantities on multi-floor vs same area', () => {
    const one = calculateMaterialQuantities({ ...base, floors: 1 });
    const two = calculateMaterialQuantities({ ...base, floors: 2 });
    const steel = (r: typeof one) => r.lines.find((l) => l.id === 'steel')!.quantity;
    const tiles = (r: typeof one) => r.lines.find((l) => l.id === 'tiles')!.quantity;
    expect(steel(two)).toBeGreaterThan(steel(one));
    expect(tiles(two)).toBe(tiles(one));
  });

  it('scales Basic < Standard vs Premium quantities', () => {
    const basic = calculateMaterialQuantities({ ...base, quality: 'basic' });
    const standard = calculateMaterialQuantities(base);
    const premium = calculateMaterialQuantities({ ...base, quality: 'premium' });
    const cement = (r: typeof basic) => r.lines.find((l) => l.id === 'cement')!.quantity;
    expect(cement(basic)).toBeLessThan(cement(standard));
    expect(cement(premium)).toBeGreaterThan(cement(standard));
  });

  it('converts sq m to sq ft', () => {
    const sqft = calculateMaterialQuantities(base);
    const sqm = calculateMaterialQuantities({
      ...base,
      builtUpArea: 139.3545,
      areaUnit: 'sqm',
    });
    expect(sqm.areaSqft).toBeCloseTo(1500, 0);
    const c1 = sqft.lines.find((l) => l.id === 'cement')!.quantity;
    const c2 = sqm.lines.find((l) => l.id === 'cement')!.quantity;
    expect(c2).toBe(c1);
  });

  it('applies custom rates to cost without changing quantity', () => {
    const def = calculateMaterialQuantities(base);
    const custom = calculateMaterialQuantities({
      ...base,
      customRates: { cementPerBag: 500 },
    });
    const a = def.lines.find((l) => l.id === 'cement')!;
    const b = custom.lines.find((l) => l.id === 'cement')!;
    expect(b.quantity).toBe(a.quantity);
    expect(b.rate).toBe(500);
    expect(b.estimatedCost).toBe(a.quantity * 500);
    expect(b.estimatedCost).not.toBe(a.estimatedCost);
  });

  it('rejects zero and invalid values', () => {
    expect(() => calculateMaterialQuantities({ ...base, builtUpArea: 0 })).toThrow();
    expect(() => calculateMaterialQuantities({ ...base, builtUpArea: -10 })).toThrow();
    expect(() => calculateMaterialQuantities({ ...base, floors: 0 })).toThrow();
    expect(() => calculateMaterialQuantities({ ...base, wastagePercent: -1 })).toThrow();
  });
});
