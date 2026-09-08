import { describe, expect, it } from 'vitest';
import { calculateInteriorCost } from '../src/interior-cost';

describe('interior cost calculator', () => {
  it('returns low expected high with fallback labels', () => {
    const result = calculateInteriorCost({
      location: 'Hyderabad',
      builtUpArea: 1200,
      quality: 'standard',
      rooms: 3,
      kitchenRunningFt: 14,
      wardrobeSqft: 50,
      includeFalseCeiling: true,
    });
    expect(result.total.low).toBeLessThan(result.total.expected);
    expect(result.total.high).toBeGreaterThan(result.total.expected);
    expect(result.lines.every((line) => line.publicLabel === 'Indicative planning rate')).toBe(
      true,
    );
  });
});
