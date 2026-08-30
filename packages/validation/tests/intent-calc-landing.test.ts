import { describe, expect, it } from 'vitest';

import {
  INTENT_CALC_MAX_PUBLISHED_PAGES,
  INTENT_CALC_PUBLISH_PAIRS,
  buildIntentCalcLanding,
  canIndexIntentCalcLanding,
  computeIntentCalcResult,
  estimateHouseCementBags,
  estimateHouseSteelKg,
  listIndexableIntentCalcLandings,
} from '../src/intent-calc-landing';

describe('intent-calc-landing gate', () => {
  it('indexes only curated publish-matrix pairs', () => {
    expect(
      canIndexIntentCalcLanding({ topic: 'cement-required', area: '1000-sq-ft' }).indexable,
    ).toBe(true);
    expect(
      canIndexIntentCalcLanding({ topic: 'cement-required', area: '1200-sq-ft' }).indexable,
    ).toBe(false);
    expect(
      canIndexIntentCalcLanding({ topic: 'steel-required', area: '1200-sq-ft' }).indexable,
    ).toBe(false);
    expect(
      canIndexIntentCalcLanding({ topic: 'construction-cost', area: '1200-sq-ft' }).indexable,
    ).toBe(true);
  });

  it('rejects unknown topics/areas (anti explosion)', () => {
    expect(
      canIndexIntentCalcLanding({ topic: 'paint-required', area: '1000-sq-ft' }).indexable,
    ).toBe(false);
    expect(
      canIndexIntentCalcLanding({ topic: 'cement-required', area: '999-sq-ft' }).indexable,
    ).toBe(false);
  });

  it('stays under the hard publish cap', () => {
    expect(INTENT_CALC_PUBLISH_PAIRS.length).toBeLessThanOrEqual(INTENT_CALC_MAX_PUBLISHED_PAGES);
    expect(listIndexableIntentCalcLandings().length).toBe(INTENT_CALC_PUBLISH_PAIRS.length);
  });
});

describe('intent-calc computation', () => {
  it('estimates cement and steel from planning factors', () => {
    expect(estimateHouseCementBags(1000, 'standard')).toBe(400);
    expect(estimateHouseSteelKg(1000, 'standard')).toBe(4500);
    expect(estimateHouseCementBags(1500, 'standard')).toBe(600);
  });

  it('builds cement landing with assumptions and related links', () => {
    const landing = buildIntentCalcLanding({
      topic: 'cement-required',
      area: '1000-sq-ft',
    });
    expect(landing).not.toBeNull();
    expect(landing!.result.primaryNumeric).toBe(400);
    expect(landing!.assumptions.length).toBeGreaterThanOrEqual(5);
    expect(landing!.workedExample).toMatch(/1000/);
    expect(landing!.faqs.length).toBeGreaterThanOrEqual(3);
    expect(landing!.canonicalPath).toBe('/construction/calc/cement-required/1000-sq-ft');
    expect(landing!.pairNote.length).toBeGreaterThanOrEqual(80);
  });

  it('builds construction-cost landing via cost engine', () => {
    const landing = buildIntentCalcLanding({
      topic: 'construction-cost',
      area: '1200-sq-ft',
    });
    expect(landing).not.toBeNull();
    expect(landing!.result.primaryNumeric).toBeGreaterThan(0);
    expect(landing!.qualityScenarios).toHaveLength(3);
  });

  it('returns null for unpublished combinations', () => {
    expect(buildIntentCalcLanding({ topic: 'cement-required', area: '1200-sq-ft' })).toBeNull();
  });

  it('recomputes when quality changes', () => {
    const basic = computeIntentCalcResult({
      topic: 'cement-required',
      areaSqft: 1000,
      quality: 'basic',
    });
    const premium = computeIntentCalcResult({
      topic: 'cement-required',
      areaSqft: 1000,
      quality: 'premium',
    });
    expect(premium.primaryNumeric).toBeGreaterThan(basic.primaryNumeric);
  });
});
