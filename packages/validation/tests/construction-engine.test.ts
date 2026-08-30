import { describe, expect, it } from 'vitest';
import {
  applyWastage,
  convertUnit,
  listSupportedUnits,
  multiplyQuantityPrice,
  roundMoney,
  runConstructionCalculation,
  toBaseUnit,
} from '../src/construction-engine';

describe('construction unit conversion', () => {
  it('converts length mm/cm/m/inch/ft', () => {
    expect(convertUnit(1000, 'mm', 'm')).toEqual(expect.objectContaining({ ok: true, value: 1 }));
    expect(convertUnit(100, 'cm', 'm')).toEqual(expect.objectContaining({ ok: true, value: 1 }));
    expect(convertUnit(12, 'inch', 'ft').ok).toBe(true);
    if (convertUnit(12, 'inch', 'ft').ok) {
      expect(convertUnit(12, 'inch', 'ft').value).toBeCloseTo(1, 10);
    }
    expect(convertUnit(1, 'ft', 'm').ok).toBe(true);
    if (convertUnit(1, 'ft', 'm').ok) {
      expect(convertUnit(1, 'ft', 'm').value).toBeCloseTo(0.3048, 10);
    }
  });

  it('converts area sq ft / sq m / sq yard', () => {
    const r = convertUnit(1, 'sq m', 'sq ft');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeCloseTo(10.7639104167, 6);

    const yard = convertUnit(1, 'sq yard', 'm2');
    expect(yard.ok).toBe(true);
    if (yard.ok) expect(yard.value).toBeCloseTo(0.83612736, 8);
  });

  it('converts volume cu ft / cu m', () => {
    const r = convertUnit(1, 'cu m', 'cu ft');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeCloseTo(35.3146667215, 6);
  });

  it('converts mass kg / tonne', () => {
    expect(convertUnit(1000, 'kg', 'tonne')).toEqual(
      expect.objectContaining({ ok: true, value: 1 }),
    );
  });

  it('converts litre aliases', () => {
    expect(convertUnit(1000, 'ml', 'liter')).toEqual(
      expect.objectContaining({ ok: true, value: 1 }),
    );
    expect(convertUnit(1, 'litre', 'l')).toEqual(expect.objectContaining({ ok: true, value: 1 }));
  });

  it('treats bag/piece as count units', () => {
    expect(convertUnit(10, 'bag', 'bags')).toEqual(
      expect.objectContaining({ ok: true, value: 10 }),
    );
    expect(convertUnit(5, 'nos', 'piece')).toEqual(expect.objectContaining({ ok: true, value: 5 }));
  });

  it('rejects incompatible unit combinations', () => {
    const r = convertUnit(1, 'm', 'kg');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Cannot convert/i);
  });

  it('rejects unknown units', () => {
    expect(convertUnit(1, 'furlong', 'm').ok).toBe(false);
  });

  it('lists supported canonical units including required set', () => {
    const units = listSupportedUnits();
    for (const u of [
      'mm',
      'cm',
      'm',
      'inch',
      'ft',
      'ft2',
      'm2',
      'yard2',
      'ft3',
      'm3',
      'kg',
      'tonne',
      'liter',
      'bag',
      'piece',
    ]) {
      expect(units).toContain(u);
    }
  });

  it('toBaseUnit normalizes to SI base', () => {
    const r = toBaseUnit(100, 'cm');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.to).toBe('m');
      expect(r.value).toBe(1);
    }
  });
});

describe('wastage and money', () => {
  it('applies wastage deterministically', () => {
    expect(applyWastage(100, 5)).toEqual({ ok: true, value: 105 });
  });

  it('rejects negative wastage', () => {
    expect(applyWastage(10, -1).ok).toBe(false);
  });

  it('rounds money to 2dp deterministically', () => {
    expect(roundMoney(10.126)).toBe(10.13);
    expect(multiplyQuantityPrice(3, 33.33)).toBe(99.99);
  });
});

describe('runConstructionCalculation', () => {
  it('returns structured result with methodology version', () => {
    const result = runConstructionCalculation({
      inputs: { length: 10, width: 10, height: 0.15, unit: 'ft' },
      formula: 'volume = L × W × H; bags = volume_m3 × bagsPerM3',
      methodologyVersion: 1,
      dimensions: { length: 10, width: 10, height: 0.15, unit: 'ft', outputUnit: 'm3' },
      assumptions: { wastagePercent: 5, rangeSpread: 0.1, bagsPerM3: 6.5 },
      unitPrice: { amount: 380, perUnit: 'm3', currency: 'INR' },
    });

    expect(result.ok).toBe(true);
    expect(result.methodologyVersion).toBe('1');
    expect(result.formula).toContain('volume');
    expect(result.quantities.volume).toBeDefined();
    expect(result.quantities.withWastage).toBeDefined();
    expect(result.totals.materialCost).toBeTypeOf('number');
    expect(result.range).not.toBeNull();
    expect(result.confidence.level).toMatch(/high|medium|low/);
    expect(result.assumptions.wastagePercent).toBe(5);
  });

  it('rejects negative quantity', () => {
    const result = runConstructionCalculation({
      inputs: {},
      formula: 'q',
      methodologyVersion: '1',
      quantity: { value: -1, unit: 'm3' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'invalid_quantity')).toBe(true);
  });

  it('rejects zero quantity where invalid', () => {
    const result = runConstructionCalculation({
      inputs: {},
      formula: 'q',
      methodologyVersion: 1,
      quantity: { value: 0, unit: 'bag' },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects unit mismatch between quantity and price', () => {
    const result = runConstructionCalculation({
      inputs: {},
      formula: 'q',
      methodologyVersion: 1,
      quantity: { value: 10, unit: 'm3' },
      unitPrice: { amount: 100, perUnit: 'kg' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'unit_mismatch')).toBe(true);
  });

  it('guards against unrealistically large calculations', () => {
    const result = runConstructionCalculation({
      inputs: {},
      formula: 'q',
      methodologyVersion: 1,
      quantity: { value: 1e15, unit: 'm3' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'quantity_overflow')).toBe(true);
  });

  it('is deterministic across repeated runs', () => {
    const req = {
      inputs: { area: 120 },
      formula: 'paint_liters = area_sqm / coverage',
      methodologyVersion: 2,
      quantity: { value: 1200, unit: 'sq ft', outputUnit: 'm2' },
      assumptions: { wastagePercent: 10, rangeSpread: 0.08 },
      unitPrice: { amount: 220, perUnit: 'm2' },
    } as const;

    const a = runConstructionCalculation(req);
    const b = runConstructionCalculation(req);
    expect(a).toEqual(b);
  });

  it('supports extra material lines', () => {
    const result = runConstructionCalculation({
      inputs: {},
      formula: 'multi-line',
      methodologyVersion: 1,
      lines: [
        {
          key: 'cement',
          label: 'Cement',
          value: 50,
          unit: 'bag',
          unitPrice: 380,
          wastagePercent: 2,
        },
        { key: 'sand', label: 'Sand', value: 2, unit: 'm3', unitPrice: 2500 },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.costs).toHaveLength(2);
    expect(result.totals.materialCost).toBeGreaterThan(0);
  });
});
