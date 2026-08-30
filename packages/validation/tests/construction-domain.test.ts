import { describe, expect, it } from 'vitest';
import {
  CONSTRUCTION_DEFAULT_CURRENCY,
  CONSTRUCTION_UNITS,
  computeBoqLineAmount,
  createConstructionBoqItemSchema,
  createConstructionCalculationSchema,
  createConstructionMaterialPriceSchema,
  createConstructionProjectPhaseSchema,
  moneyAmountSchema,
  resolvePriceFreshness,
} from '../src/construction-domain';
import { createConstructionProjectSchema } from '../src/construction';

describe('construction domain money helpers', () => {
  it('defaults currency to INR', () => {
    expect(CONSTRUCTION_DEFAULT_CURRENCY).toBe('INR');
  });

  it('rejects floating-point unsafe money precision beyond 2dp', () => {
    expect(moneyAmountSchema.safeParse(10.125).success).toBe(false);
    expect(moneyAmountSchema.safeParse(10.12).success).toBe(true);
  });

  it('computes BOQ line amount with wastage using 2dp rounding', () => {
    expect(computeBoqLineAmount({ quantity: 10, unitRate: 100, wastagePercent: 5 })).toBe(1050);
    expect(computeBoqLineAmount({ quantity: 3, unitRate: 33.33, wastagePercent: 0 })).toBe(99.99);
  });
});

describe('construction domain schemas', () => {
  it('accepts material price with freshness and source metadata', () => {
    const parsed = createConstructionMaterialPriceSchema.safeParse({
      materialId: '11111111-1111-4111-8111-111111111111',
      unit: 'bag',
      price: 380.5,
      freshness: 'VERIFIED',
      source: 'Local dealer survey',
      effectiveFrom: '2026-08-01T00:00:00.000Z',
      verifiedAt: '2026-08-15T00:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe('INR');
      expect(parsed.data.unit).toBe('bag');
    }
  });

  it('requires methodology versioning fields on calculations', () => {
    const parsed = createConstructionCalculationSchema.safeParse({
      calculatorSlug: 'cement',
      methodologyKey: 'cement-bags-v1',
      methodologyVersion: 1,
      inputs: { volumeM3: 1 },
      assumptions: { bagsPerM3: 6.5, wastagePercent: 5 },
      status: 'SUCCESS',
    });
    expect(parsed.success).toBe(true);
  });

  it('validates project status extension fields', () => {
    const parsed = createConstructionProjectSchema.safeParse({
      name: 'My house',
      projectType: 'new_build',
      status: 'ACTIVE',
      currency: 'INR',
      quality: 'standard',
      items: [{ name: 'Cement', unit: 'bag', quantity: 100, unitCost: 380 }],
    });
    expect(parsed.success).toBe(true);
  });

  it('validates BOQ item amounts', () => {
    const parsed = createConstructionBoqItemSchema.safeParse({
      boqId: '11111111-1111-4111-8111-111111111111',
      name: 'M20 concrete',
      unit: 'm3',
      quantity: 12.5,
      unitRate: 5200,
      amount: 65000,
      wastagePercent: 2,
    });
    expect(parsed.success).toBe(true);
  });

  it('validates project phases', () => {
    const parsed = createConstructionProjectPhaseSchema.safeParse({
      projectId: '11111111-1111-4111-8111-111111111111',
      name: 'Foundation',
      sortOrder: 1,
      status: 'PLANNED',
    });
    expect(parsed.success).toBe(true);
  });

  it('includes common construction units', () => {
    expect(CONSTRUCTION_UNITS).toContain('bag');
    expect(CONSTRUCTION_UNITS).toContain('m3');
    expect(CONSTRUCTION_UNITS).toContain('sqft');
  });
});

describe('resolvePriceFreshness', () => {
  it('marks old verified prices as STALE', () => {
    const verifiedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-08-20T00:00:00.000Z');
    expect(resolvePriceFreshness({ claimed: 'VERIFIED', verifiedAt, now })).toBe('STALE');
  });

  it('keeps LIVE claim', () => {
    expect(
      resolvePriceFreshness({
        claimed: 'LIVE',
        verifiedAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    ).toBe('LIVE');
  });

  it('downgrades VERIFIED without verifiedAt to ESTIMATED', () => {
    expect(resolvePriceFreshness({ claimed: 'VERIFIED', verifiedAt: null })).toBe('ESTIMATED');
  });
});
