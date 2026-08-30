import { describe, expect, it } from 'vitest';

import {
  buildPriceLandingSeoContent,
  canIndexPriceLanding,
  computePricePeriodChanges,
  filterObservationsByInterval,
  matchMaterialToHubKey,
  resolveDisplayFreshness,
  shouldShowPriceHistoryChart,
} from '../src/prices-hub';

describe('resolveDisplayFreshness', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');

  it('keeps LIVE within 30 days as current', () => {
    const d = resolveDisplayFreshness({
      claimed: 'LIVE',
      verifiedAt: '2026-08-10T00:00:00.000Z',
      now,
    });
    expect(d.isCurrent).toBe(true);
    expect(d.isOlderData).toBe(false);
    expect(d.resolved).toBe('LIVE');
    expect(d.label).toBe('Live');
  });

  it('downgrades aged LIVE to older data (never current)', () => {
    const d = resolveDisplayFreshness({
      claimed: 'LIVE',
      verifiedAt: '2026-06-01T00:00:00.000Z',
      now,
    });
    expect(d.isCurrent).toBe(false);
    expect(d.isOlderData).toBe(true);
    expect(d.resolved).toBe('STALE');
    expect(d.label).toBe('Older data');
  });

  it('labels ESTIMATED as not current', () => {
    const d = resolveDisplayFreshness({
      claimed: 'ESTIMATED',
      effectiveFrom: '2026-08-15T00:00:00.000Z',
      now,
    });
    expect(d.isCurrent).toBe(false);
    expect(d.isOlderData).toBe(true);
    expect(d.label).toContain('not current');
  });

  it('treats claimed STALE as older data', () => {
    const d = resolveDisplayFreshness({
      claimed: 'STALE',
      verifiedAt: '2026-08-20T00:00:00.000Z',
      now,
    });
    expect(d.isCurrent).toBe(false);
    expect(d.resolved).toBe('STALE');
  });
});

describe('canIndexPriceLanding', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');
  const threeReliable = [
    { claimed: 'VERIFIED' as const, verifiedAt: '2026-08-10T00:00:00.000Z' },
    { claimed: 'VERIFIED' as const, verifiedAt: '2026-08-05T00:00:00.000Z' },
    { claimed: 'LIVE' as const, verifiedAt: '2026-08-15T00:00:00.000Z' },
  ];

  it('indexes only allowlisted pairs with enough reliable + total observations', () => {
    expect(
      canIndexPriceLanding({
        materialKey: 'cement',
        citySlug: 'hyderabad',
        observations: threeReliable,
        now,
      }),
    ).toBe(true);
  });

  it('rejects thin pairs without enough total observations', () => {
    expect(
      canIndexPriceLanding({
        materialKey: 'cement',
        citySlug: 'hyderabad',
        observations: [{ claimed: 'VERIFIED', verifiedAt: '2026-08-10T00:00:00.000Z' }],
        now,
      }),
    ).toBe(false);
  });

  it('rejects thin pairs without reliable observations', () => {
    expect(
      canIndexPriceLanding({
        materialKey: 'cement',
        citySlug: 'hyderabad',
        observations: [
          { claimed: 'ESTIMATED', effectiveFrom: '2026-08-10T00:00:00.000Z' },
          { claimed: 'ESTIMATED', effectiveFrom: '2026-08-11T00:00:00.000Z' },
          { claimed: 'ESTIMATED', effectiveFrom: '2026-08-12T00:00:00.000Z' },
        ],
        now,
      }),
    ).toBe(false);

    expect(
      canIndexPriceLanding({
        materialKey: 'cement',
        citySlug: 'hyderabad',
        observations: [],
        now,
      }),
    ).toBe(false);

    expect(
      canIndexPriceLanding({
        materialKey: 'cement',
        citySlug: 'not-a-city',
        observations: threeReliable,
        now,
      }),
    ).toBe(false);
  });
});

describe('shouldShowPriceHistoryChart', () => {
  it('requires at least three points', () => {
    expect(shouldShowPriceHistoryChart(2)).toBe(false);
    expect(shouldShowPriceHistoryChart(3)).toBe(true);
  });
});

describe('matchMaterialToHubKey', () => {
  it('maps common aliases', () => {
    expect(matchMaterialToHubKey('opc-cement')).toBe('cement');
    expect(matchMaterialToHubKey('tmt-steel')).toBe('steel');
    expect(matchMaterialToHubKey('aac-blocks')).toBe('brick');
    expect(matchMaterialToHubKey('vitrified-tiles')).toBe('tiles');
  });
});

describe('computePricePeriodChanges', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');

  it('computes changes from nearest prior observations without inventing points', () => {
    const changes = computePricePeriodChanges({
      currentPrice: 400,
      now,
      observations: [
        { id: 'a', price: 350, effectiveFrom: '2026-08-10T00:00:00.000Z' },
        { id: 'b', price: 300, effectiveFrom: '2026-07-15T00:00:00.000Z' },
        { id: 'c', price: 280, effectiveFrom: '2026-05-01T00:00:00.000Z' },
        { id: 'd', price: 250, effectiveFrom: '2025-08-01T00:00:00.000Z' },
      ],
    });

    const byKey = Object.fromEntries(changes.map((c) => [c.key, c]));
    expect(byKey['7d']?.available).toBe(true);
    expect(byKey['7d']?.baselinePrice).toBe(350);
    expect(byKey['7d']?.absolute).toBe(50);
    expect(byKey['7d']?.usedNearestPrior).toBe(true);

    expect(byKey['30d']?.baselinePrice).toBe(300);
    expect(byKey['3m']?.baselinePrice).toBe(280);
    expect(byKey['1y']?.baselinePrice).toBe(250);
  });

  it('marks periods unavailable when no prior observation exists', () => {
    const changes = computePricePeriodChanges({
      currentPrice: 400,
      now,
      observations: [{ id: 'only', price: 400, effectiveFrom: '2026-08-20T00:00:00.000Z' }],
    });
    expect(changes.every((c) => !c.available)).toBe(true);
  });
});

describe('filterObservationsByInterval', () => {
  it('returns only real points inside the window', () => {
    const now = new Date('2026-08-21T00:00:00.000Z');
    const filtered = filterObservationsByInterval(
      [
        { price: 1, effectiveFrom: '2026-08-01T00:00:00.000Z' },
        { price: 2, effectiveFrom: '2026-06-01T00:00:00.000Z' },
        { price: 3, effectiveFrom: '2025-01-01T00:00:00.000Z' },
      ],
      '1M',
      now,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.price).toBe(1);
  });
});

describe('buildPriceLandingSeoContent', () => {
  it('combines material editorial with city-specific notes (not city-name-only)', () => {
    const seo = buildPriceLandingSeoContent({
      materialKey: 'cement',
      materialLabel: 'Cement',
      citySlug: 'hyderabad',
      cityName: 'Hyderabad',
      calculatorHref: '/construction/cement-calculator',
      currentPrice: 380,
      unit: 'bag',
      currency: 'INR',
      historyPrices: [360, 380, 400],
      lastUpdatedIso: '2026-08-15T00:00:00.000Z',
      relatedMaterials: [{ key: 'steel', label: 'Steel (TMT)' }],
      relatedCities: [{ slug: 'bengaluru', name: 'Bengaluru' }],
    });
    expect(seo).not.toBeNull();
    expect(seo!.editorialIntro).toMatch(/Cement reference/);
    expect(seo!.editorialIntro).toMatch(/Hyderabad/);
    expect(seo!.localMarketNote).toMatch(/ORR/);
    expect(seo!.priceRange).toEqual({ low: 360, high: 400 });
    expect(seo!.calculationExample).toMatch(/100/);
    expect(seo!.calculationExample).toMatch(/380/);
    expect(seo!.relatedMaterialHrefs[0]?.href).toBe('/construction/prices/steel/hyderabad');
    expect(seo!.relatedCityHrefs[0]?.href).toBe('/construction/prices/cement/bengaluru');
    expect(seo!.faqs.length).toBeGreaterThanOrEqual(3);
  });

  it('returns null without a city local note (anti-boilerplate)', () => {
    const seo = buildPriceLandingSeoContent({
      materialKey: 'cement',
      materialLabel: 'Cement',
      citySlug: 'unknown-city',
      cityName: 'Unknown',
      calculatorHref: '/construction/cement-calculator',
      currentPrice: 380,
      unit: 'bag',
      historyPrices: [380],
      lastUpdatedIso: null,
      relatedMaterials: [],
      relatedCities: [],
    });
    expect(seo).toBeNull();
  });
});
