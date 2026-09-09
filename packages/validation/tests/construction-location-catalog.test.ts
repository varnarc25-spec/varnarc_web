import { describe, expect, it } from 'vitest';
import {
  CITY_RATE_UNAVAILABLE_NOTE,
  DEFAULT_CONSTRUCTION_LOCATION_NAME,
  LOCATION_MULTIPLIERS,
  LOCAL_VERIFICATION_WARNING,
  assertNotLiveLabel,
  catalogNationalPriceAsResolvable,
  listQuickEstimatorLocations,
  normalizeLocationKey,
  resolveConstructionCostRateDisplay,
  resolveConstructionLocationRate,
  resolveMaterialPrice,
} from '../src/construction-location-catalog';

describe('construction location / rate catalog', () => {
  it('uses one default city name for calculators', () => {
    expect(DEFAULT_CONSTRUCTION_LOCATION_NAME).toBe('Hyderabad');
    expect(LOCATION_MULTIPLIERS.hyderabad?.multiplier).toBe(1);
    expect(LOCATION_MULTIPLIERS.bengaluru?.multiplier).toBe(1.12);
    expect(LOCATION_MULTIPLIERS.bangalore?.multiplier).toBe(1.12);
  });

  it('falls back to national when the city is unknown', () => {
    const resolved = resolveConstructionLocationRate('Unknownville');
    expect(resolved.usedFallback).toBe(true);
    expect(resolved.location.slug).toBe('india');
    const display = resolveConstructionCostRateDisplay('Unknownville');
    expect(display.usedFallback).toBe(true);
    expect(display.fallbackNote).toBe(CITY_RATE_UNAVAILABLE_NOTE);
    expect(display.localVerificationWarning).toBe(LOCAL_VERIFICATION_WARNING);
    expect(assertNotLiveLabel(display.publicLabel)).toBe(true);
  });

  it('matches a known city without claiming live prices', () => {
    const display = resolveConstructionCostRateDisplay('Bengaluru');
    expect(display.usedFallback).toBe(false);
    expect(display.locationLevel).toBe('CITY');
    expect(display.locationLabel).toBe('Bengaluru');
    expect(display.isIndicative).toBe(true);
    expect(display.publicLabel.toLowerCase()).toContain('indicative');
    expect(assertNotLiveLabel(display.publicLabel)).toBe(true);
  });

  it('uses national material prices when city observations are missing', () => {
    const { display, resolved } = resolveMaterialPrice({
      materialId: 'cement',
      locationQuery: 'Hyderabad',
    });
    expect(resolved?.locationLevel).toBe('NATIONAL');
    expect(display.usedFallback).toBe(true);
    expect(display.fallbackNote).toBe(CITY_RATE_UNAVAILABLE_NOTE);
    expect(display.typicalPrice).toBe(380);
    expect(assertNotLiveLabel(display.publicLabel)).toBe(true);
  });

  it('prefers ingested city observations over the national catalog', () => {
    const city = catalogNationalPriceAsResolvable('cement')!;
    const ingested = {
      ...city,
      id: 'city-obs',
      locationId: 'loc-hyderabad',
      locationType: 'CITY' as const,
      averageRate: 410,
      minRate: 400,
      maxRate: 420,
      sourceType: 'MARKET_SURVEY' as const,
      isDerived: false,
      lastVerifiedAt: '2026-08-15',
    };
    const { display, resolved } = resolveMaterialPrice({
      materialId: 'cement',
      locationQuery: 'Hyderabad',
      ingested: [ingested],
      ancestry: [
        { id: 'loc-hyderabad', type: 'CITY' },
        { id: 'loc-india', type: 'NATIONAL' },
      ],
    });
    expect(resolved?.rate).toBe(410);
    expect(resolved?.locationLevel).toBe('CITY');
    expect(display.usedFallback).toBe(false);
    expect(display.lastVerifiedAt).toBe('2026-08-15');
    expect(assertNotLiveLabel(display.publicLabel)).toBe(true);
  });

  it('keeps location key aliases used by calculators', () => {
    expect(normalizeLocationKey('Bengaluru')).toBe('bengaluru');
    expect(normalizeLocationKey('Bangalore NCR')).toBe('bangalore');
    expect(normalizeLocationKey('Unknownville')).toBe('default');
  });

  it('exposes a shared quick-estimator city list', () => {
    expect(listQuickEstimatorLocations()[0]).toBe('Hyderabad');
    expect(listQuickEstimatorLocations().at(-1)).toBe('Other / India average');
  });
});
