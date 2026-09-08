import { describe, expect, it } from 'vitest';
import {
  buildPlannerHandoffQuery,
  parsePlannerHandoffQuery,
  plannerToolHref,
} from '../src/construction-planner-handoff';

describe('construction planner handoff', () => {
  it('round-trips non-sensitive planning fields', () => {
    const q = buildPlannerHandoffQuery({
      location: 'Bengaluru',
      builtUpArea: 1500,
      areaUnit: 'sqft',
      floors: 2,
      propertyType: 'independent_house',
      quality: 'standard',
      structureType: 'rcc_framed',
      foundationType: 'isolated',
      lift: true,
      budgetInr: 3088800,
    });
    const parsed = parsePlannerHandoffQuery(new URLSearchParams(q));
    expect(parsed.location).toBe('Bengaluru');
    expect(parsed.builtUpArea).toBe(1500);
    expect(parsed.floors).toBe(2);
    expect(parsed.lift).toBe(true);
    expect(parsed.budgetInr).toBe(3088800);
    expect(plannerToolHref('/construction/material-calculator', parsed)).toContain(
      '/construction/material-calculator?',
    );
  });

  it('omits empty and sensitive-looking blanks from the query', () => {
    expect(buildPlannerHandoffQuery({})).toBe('');
    expect(parsePlannerHandoffQuery({ builtUpArea: '0' }).builtUpArea).toBeUndefined();
  });
});
