import { describe, expect, it } from 'vitest';
import { FLOORING_DEFAULT_WASTAGE, calculateFlooringQuantity } from '../src/flooring-calculator';

describe('calculateFlooringQuantity', () => {
  it('sums multiple room rows with wastage and cost', () => {
    const r = calculateFlooringQuantity({
      flooringType: 'tiles',
      rooms: [
        { name: 'Living', length: 5, width: 4, lengthUnit: 'm', widthUnit: 'm' },
        { name: 'Bedroom', length: 3, width: 3, lengthUnit: 'm', widthUnit: 'm' },
      ],
      wastagePercent: 10,
      materialUnit: 'm2',
      rateInr: 800,
    });
    expect(r.netFloorAreaM2).toBeCloseTo(20 + 9, 4);
    expect(r.purchaseAreaM2).toBeCloseTo(29 * 1.1, 3);
    expect(r.materialQuantity).toBeCloseTo(29 * 1.1, 3);
    expect(r.estimatedCostInr).toBeGreaterThan(0);
    expect(r.rooms).toHaveLength(2);
    expect(r.assumptions.some((a) => /not a product recommendation/i.test(a))).toBe(true);
  });

  it('applies category default wastage when omitted', () => {
    const r = calculateFlooringQuantity({
      flooringType: 'marble',
      length: 4,
      width: 3,
      materialUnit: 'm2',
    });
    expect(r.wastagePercent).toBe(FLOORING_DEFAULT_WASTAGE.marble);
    expect(r.purchaseAreaM2).toBeCloseTo(12 * 1.15, 3);
  });

  it('supports wood/laminate in boxes', () => {
    const r = calculateFlooringQuantity({
      flooringType: 'wood_laminate',
      length: 10,
      width: 4,
      wastagePercent: 8,
      materialUnit: 'box',
      coveragePerBox: 2,
      coveragePerBoxUnit: 'm2',
      rateInr: 1500,
    });
    // net 40; buy 43.2; boxes ceil(43.2/2)=22
    expect(r.materialQuantity).toBe(22);
    expect(r.estimatedCostInr).toBe(22 * 1500);
  });

  it('multiplies single room by numberOfRooms', () => {
    const r = calculateFlooringQuantity({
      flooringType: 'vinyl',
      length: 3,
      width: 3,
      numberOfRooms: 4,
      wastagePercent: 0,
      materialUnit: 'ft2',
    });
    expect(r.netFloorAreaM2).toBeCloseTo(36, 4);
    expect(r.materialQuantity).toBeCloseTo(36 * 10.76391041671, 1);
  });

  it('labels custom other type without endorsement language', () => {
    const r = calculateFlooringQuantity({
      flooringType: 'other',
      customTypeLabel: 'Cork',
      length: 2,
      width: 2,
      wastagePercent: 5,
      materialUnit: 'm2',
    });
    expect(r.flooringTypeLabel).toBe('Cork');
    expect(r.disclaimer).not.toMatch(/best|recommend brand|buy this/i);
    expect(JSON.stringify(r)).not.toMatch(/asian|berger|Kajaria|Somany/i);
  });
});
