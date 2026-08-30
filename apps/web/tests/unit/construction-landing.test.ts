import { describe, expect, it } from 'vitest';
import { resolveConstructionLandingSearch } from '@/lib/construction/landing';

describe('resolveConstructionLandingSearch', () => {
  it('routes cost and area queries to the estimator', () => {
    expect(resolveConstructionLandingSearch('Cost to build 1500 sqft house')).toBe(
      '/construction/cost-calculator?builtUpArea=1500',
    );
  });

  it('routes material keywords to calculators', () => {
    expect(resolveConstructionLandingSearch('Cement required for 1200 sqft')).toContain(
      '/construction/cement-calculator',
    );
    expect(resolveConstructionLandingSearch('Paint required for 3 bedrooms')).toContain(
      '/construction/paint-calculator',
    );
  });

  it('routes compare queries to compare', () => {
    expect(resolveConstructionLandingSearch('Compare AAC blocks vs bricks')).toContain(
      '/construction/compare',
    );
  });
});

describe('construction intent navigator data', () => {
  it('defines next actions for build_home and calculate_materials', async () => {
    const { getConstructionIntent, isConstructionIntentKey } =
      await import('@/lib/construction/landing');
    expect(isConstructionIntentKey('build_home')).toBe(true);
    const build = getConstructionIntent('build_home');
    expect(build?.nextActions.map((a) => a.label)).toEqual([
      'Estimate cost',
      'Start a construction project',
      'Calculate materials',
      'Generate BOQ',
    ]);
    const materials = getConstructionIntent('calculate_materials');
    expect(materials?.nextActions.map((a) => a.label)).toEqual([
      'Cement',
      'Concrete',
      'RCC',
      'Steel',
      'Bricks',
      'AAC blocks',
      'Sand',
      'Aggregate',
      'Plaster',
      'Tiles',
      'Flooring',
      'Paint',
    ]);
  });
});
