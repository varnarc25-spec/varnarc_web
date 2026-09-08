import { describe, expect, it } from 'vitest';
import {
  buildConstructionCostCalculatorSlug,
  constructionCostCalculatorHref,
  parseConstructionCostCalculatorSlug,
} from '../src/construction-calculator-slug';

describe('construction cost calculator slug', () => {
  it('encodes built-up area as builtUpArea_1500_sft', () => {
    expect(
      buildConstructionCostCalculatorSlug({
        builtUpArea: 1500,
        areaUnit: 'sqft',
      }),
    ).toBe('builtUpArea_1500_sft');
    expect(constructionCostCalculatorHref({ builtUpArea: 1500, areaUnit: 'sqft' })).toBe(
      '/construction/cost-calculator/builtUpArea_1500_sft',
    );
  });

  it('parses the preferred slug and extra tokens', () => {
    const parsed = parseConstructionCostCalculatorSlug(
      'builtUpArea_1500_sft__location_Hyderabad__floors_2',
    );
    expect(parsed.builtUpArea).toBe('1500');
    expect(parsed.areaUnit).toBe('sqft');
    expect(parsed.location).toBe('Hyderabad');
    expect(parsed.floors).toBe('2');
  });

  it('accepts compact 1500_sft and sqm tokens', () => {
    expect(parseConstructionCostCalculatorSlug('1500_sft').builtUpArea).toBe('1500');
    expect(parseConstructionCostCalculatorSlug('builtUpArea_120_sqm').areaUnit).toBe('sqm');
  });
});
