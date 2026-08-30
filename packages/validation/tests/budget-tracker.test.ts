import { describe, expect, it } from 'vitest';
import { calculateBudgetTracker, fromMinor, toMinor, addMinor } from '../src/budget-tracker';

describe('budget money minor units', () => {
  it('parses and sums without float drift', () => {
    const a = toMinor('0.10');
    const b = toMinor('0.20');
    expect(fromMinor(addMinor(a, b))).toBe(0.3);
    expect(toMinor(10.5)).toBe(1050);
  });
});

describe('calculateBudgetTracker', () => {
  it('computes metrics, category breakdown and cumulative series', () => {
    const r = calculateBudgetTracker({
      currency: 'INR',
      estimatedProjectCost: 1_200_000,
      budgetLines: [
        { id: '1', category: 'RCC', name: 'Concrete', plannedAmount: '500000.00' },
        { id: '2', category: 'Masonry', name: 'Brickwork', plannedAmount: 300000 },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-01-10',
          category: 'RCC',
          description: 'Ready mix',
          amount: '100000.50',
          paymentStatus: 'paid',
        },
        {
          id: 'e2',
          date: '2026-01-15',
          category: 'RCC',
          description: 'Steel PO',
          amount: '50000',
          paymentStatus: 'committed',
        },
        {
          id: 'e3',
          date: '2026-01-20',
          category: 'Masonry',
          description: 'Bricks',
          amount: '25000',
          paymentStatus: 'pending',
        },
      ],
    });

    expect(r.metrics.totalBudget).toBe(800000);
    expect(r.metrics.spent).toBe(100000.5);
    expect(r.metrics.committed).toBe(75000);
    expect(r.metrics.remaining).toBe(624999.5);
    expect(r.metrics.projectedFinalCost).toBe(800000);
    expect(r.metrics.variance).toBe(0);
    expect(r.metrics.estimatedProjectCost).toBe(1_200_000);

    const rcc = r.byCategory.find((c) => c.category === 'RCC');
    expect(rcc?.budget).toBe(500000);
    expect(rcc?.spent).toBe(100000.5);
    expect(rcc?.committed).toBe(50000);

    expect(r.cumulativeSpending.length).toBe(3);
    expect(r.cumulativeSpending.at(-1)!.cumulativeOutflow).toBe(175000.5);
    expect(r.qualification).toMatch(/not audited/i);
  });
});
