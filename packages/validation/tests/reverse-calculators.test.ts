import { describe, expect, it } from 'vitest';
import { calculateCementQuantity } from '../src/cement-calculator';
import { calculateConstructionCost } from '../src/construction-cost';

describe('cement calculator reverse mode', () => {
  it('estimates coverable wet volume from bags (concrete)', () => {
    const r = calculateCementQuantity({
      mode: 'reverse',
      useCase: 'concrete',
      availableBags: 100,
      bagSizeKg: 50,
      mixPreset: 'M20',
      wastagePercent: 5,
    });
    expect(r.mode).toBe('reverse');
    expect(r.bags).toBe(100);
    expect(r.coverableWetVolumeM3).toBeGreaterThan(1);
    expect(r.reverseDisplay).not.toBeNull();
    expect(r.reverseDisplay?.selectedUnit).toContain('m³');
    expect(r.reverseDisplay?.wastagePercent).toBe(5);
    expect(r.reverseDisplay?.formula.length).toBeGreaterThan(10);
    expect(r.reverseDisplay?.assumptions.length).toBeGreaterThan(0);
    expect(r.reverseDisplay?.limitations.length).toBeGreaterThan(0);
  });

  it('estimates coverable area from bags (plaster)', () => {
    const r = calculateCementQuantity({
      mode: 'reverse',
      useCase: 'plastering',
      availableBags: 100,
      bagSizeKg: 50,
      mixPreset: 'mortar_1_4',
      thickness: 12,
      thicknessUnit: 'mm',
      wastagePercent: 5,
    });
    expect(r.coverableAreaM2).toBeGreaterThan(50);
    expect(r.selectedUnit).toContain('m²');
  });
});

describe('construction cost reverse mode', () => {
  it('estimates approximate house size from budget', () => {
    const r = calculateConstructionCost({
      mode: 'reverse',
      location: 'Hyderabad',
      propertyType: 'independent_house',
      budgetInr: 3_000_000,
      floors: 1,
      quality: 'standard',
      contingencyPercent: 10,
      areaUnit: 'sqft',
    });
    expect(r.mode).toBe('reverse');
    expect(r.budgetInr).toBe(3_000_000);
    expect(r.areaSqft).toBeGreaterThan(200);
    expect(r.reverseDisplay).not.toBeNull();
    expect(r.reverseDisplay?.wastageLabel).toMatch(/Contingency/i);
    expect(r.reverseDisplay?.selectedUnit).toBe('sqft');
    expect(r.formula).toContain('budget');
    expect(r.limitations.length).toBeGreaterThan(0);
  });
});
