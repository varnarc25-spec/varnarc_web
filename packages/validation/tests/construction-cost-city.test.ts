import { describe, expect, it } from 'vitest';
import {
  buildConstructionCostCityLanding,
  canIndexConstructionCostCity,
  getConstructionCostCityProfile,
} from '../src/construction-cost-city';

const now = new Date('2026-08-21T12:00:00.000Z');

function obs(
  materialKey: string,
  price: number,
  daysAgo: number,
  claimed: 'LIVE' | 'VERIFIED' = 'VERIFIED',
) {
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    materialKey,
    price,
    unit: materialKey === 'cement' ? 'bag' : 'kg',
    currency: 'INR',
    claimed,
    verifiedAt: d.toISOString(),
    effectiveFrom: d.toISOString(),
  };
}

function richObservations() {
  return [
    obs('cement', 380, 5),
    obs('cement', 370, 20),
    obs('cement', 360, 40),
    obs('steel', 55, 4),
    obs('steel', 54, 18),
    obs('sand', 2200, 6),
    obs('brick', 8, 7),
  ];
}

describe('canIndexConstructionCostCity', () => {
  it('blocks cities without editorial profile', () => {
    const r = canIndexConstructionCostCity({
      citySlug: 'unknown-city',
      observations: richObservations(),
      now,
    });
    expect(r.indexable).toBe(false);
    expect(r.reason).toBe('missing_editorial_profile');
  });

  it('blocks when too few current materials', () => {
    const r = canIndexConstructionCostCity({
      citySlug: 'hyderabad',
      observations: [obs('cement', 380, 3), obs('steel', 55, 3)],
      now,
    });
    expect(r.indexable).toBe(false);
    expect(r.reason).toMatch(/insufficient/);
  });

  it('allows hyderabad with enough local data', () => {
    const r = canIndexConstructionCostCity({
      citySlug: 'hyderabad',
      observations: richObservations(),
      now,
    });
    expect(r.indexable).toBe(true);
  });
});

describe('buildConstructionCostCityLanding', () => {
  it('builds location-specific payload with scenarios and unique intro', () => {
    const landing = buildConstructionCostCityLanding({
      citySlug: 'hyderabad',
      observations: richObservations(),
      relatedIndexableCitySlugs: ['bengaluru', 'pune'],
      now,
    });
    expect(landing).not.toBeNull();
    if (!landing) return;
    expect(landing.indexable).toBe(true);
    expect(landing.city.name).toBe('Hyderabad');
    expect(landing.editorialIntro).toMatch(/Hyderabad/);
    expect(landing.editorialIntro).not.toMatch(/Bengaluru house construction/);
    expect(landing.costPerSqft).toBeGreaterThan(1000);
    expect(landing.indicativeRange.mid).toBeGreaterThan(landing.indicativeRange.low);
    expect(landing.qualityScenarios).toHaveLength(3);
    expect(landing.calculatorHref).toContain('location=Hyderabad');
    expect(landing.relatedCityHrefs.some((l) => l.href.includes('bengaluru'))).toBe(true);
    expect(landing.faqs.length).toBeGreaterThan(3);
    expect(landing.methodology).toMatch(/thin template/i);
  });

  it('marks non-indexable when data thin but still returns null only without profile', () => {
    expect(getConstructionCostCityProfile('hyderabad')).not.toBeNull();
    const landing = buildConstructionCostCityLanding({
      citySlug: 'hyderabad',
      observations: [obs('cement', 380, 2)],
      now,
    });
    expect(landing?.indexable).toBe(false);
    expect(landing?.indexBlockReason).toBeTruthy();
  });
});
