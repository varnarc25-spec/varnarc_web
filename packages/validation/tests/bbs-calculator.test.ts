import { describe, expect, it } from 'vitest';
import { calculateBbsSchedule } from '../src/bbs-calculator';
import { calculateRebarWeightPerMetre } from '../src/steel-calculator';

describe('calculateBbsSchedule', () => {
  it('computes row length, unit weight and weight using shared steel utility', () => {
    const r = calculateBbsSchedule({
      projectName: 'Demo BBS',
      rows: [
        {
          id: '1',
          barMark: 'B1',
          member: 'Beam B1',
          diameterMm: 12,
          shape: 'straight',
          quantity: 10,
          cuttingLength: 4.2,
          cuttingLengthUnit: 'm',
          notes: 'main bars',
        },
        {
          id: '2',
          barMark: 'S1',
          member: 'Beam B1',
          diameterMm: 8,
          shape: 'stirrup',
          quantity: 40,
          cuttingLength: 1.1,
          cuttingLengthUnit: 'm',
        },
        {
          id: '3',
          barMark: 'C1',
          member: 'Column C1',
          diameterMm: 16,
          shape: 'straight',
          quantity: 4,
          cuttingLength: 3200,
          cuttingLengthUnit: 'mm',
        },
      ],
      ratePerKgInr: 70,
    });

    expect(r.rows[0]!.unitWeightKgPerM).toBeCloseTo(calculateRebarWeightPerMetre(12), 4);
    expect(r.rows[0]!.totalLengthM).toBeCloseTo(42, 4);
    expect(r.rows[0]!.totalWeightKg).toBeCloseTo((42 * (12 * 12)) / 162, 2);

    expect(r.rows[2]!.cuttingLengthM).toBeCloseTo(3.2, 4);

    const beam = r.totalsByMember.find((g) => g.label === 'Beam B1');
    expect(beam).toBeTruthy();
    expect(beam!.rowCount).toBe(2);
    expect(beam!.barCount).toBe(50);

    const d12 = r.totalsByDiameter.find((g) => g.key === 'd12');
    expect(d12?.totalLengthM).toBeCloseTo(42, 4);

    expect(r.overall.rowCount).toBe(3);
    expect(r.overall.totalBars).toBe(54);
    expect(r.estimatedCostInr).toBeGreaterThan(0);
    expect(r.disclaimer).toMatch(/does not invent|user-entered/i);
  });

  it('does not invent reinforcement — requires user cutting length', () => {
    expect(() =>
      calculateBbsSchedule({
        rows: [
          {
            id: 'x',
            barMark: 'A1',
            member: 'Slab',
            diameterMm: 10,
            shape: 'straight',
            quantity: 1,
            cuttingLength: 0,
            cuttingLengthUnit: 'm',
          },
        ],
      }),
    ).toThrow();
  });
});
