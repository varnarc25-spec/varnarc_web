import { describe, expect, it } from 'vitest';

import {
  VCCI_COMPONENTS,
  VCCI_METHODOLOGY_VERSION,
  assessVcciSnapshotQuality,
  canPublishVcciPublicly,
  computeVcciCompositeIndex,
  defaultVcciWeights,
  sumVcciWeights,
} from '../src/vcci';

describe('VCCI weights', () => {
  it('default weights sum to 1', () => {
    expect(sumVcciWeights(defaultVcciWeights())).toBeCloseTo(1, 5);
    expect(VCCI_COMPONENTS).toHaveLength(8);
  });
});

describe('computeVcciCompositeIndex', () => {
  it('excludes missing components instead of inventing 100', () => {
    const { indexValue, coverageRatio, contributions } = computeVcciCompositeIndex({
      weights: defaultVcciWeights(),
      componentIndexes: {
        cement: 110,
        steel: 105,
        // others missing
      },
    });
    expect(indexValue).not.toBeNull();
    expect(coverageRatio).toBeLessThan(0.75);
    expect(contributions.filter((c) => c.available)).toHaveLength(2);
  });

  it('computes coverage-adjusted weighted average', () => {
    const weights = { cement: 0.5, steel: 0.5 } as const;
    const { indexValue } = computeVcciCompositeIndex({
      weights: { ...defaultVcciWeights(), ...weights },
      componentIndexes: {
        cement: 100,
        steel: 120,
        aggregates: 100,
        masonry: 100,
        labour: 100,
        finishing: 100,
        electrical: 100,
        plumbing: 100,
      },
    });
    expect(indexValue).toBeGreaterThan(100);
  });
});

describe('publication gate', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');
  const fullIndexes = Object.fromEntries(
    VCCI_COMPONENTS.map((c) => [c.key, 102 + c.defaultWeight]),
  );

  it('blocks arbitrary incomplete snapshots', () => {
    const quality = assessVcciSnapshotQuality({
      methodologyVersion: VCCI_METHODOLOGY_VERSION,
      weights: defaultVcciWeights(),
      componentIndexes: { cement: 110 },
      sourceDatasets: [{ name: 'cement survey' }],
      calculationDate: '2026-08-10',
      explicitlyPublished: true,
      now,
    });
    expect(quality.passed).toBe(false);
    expect(canPublishVcciPublicly({ hasActiveMethodology: true, quality })).toBe(false);
  });

  it('allows a complete quality-gated snapshot', () => {
    const quality = assessVcciSnapshotQuality({
      methodologyVersion: VCCI_METHODOLOGY_VERSION,
      weights: defaultVcciWeights(),
      componentIndexes: fullIndexes,
      sourceDatasets: VCCI_COMPONENTS.map((c) => ({
        component: c.key,
        name: c.sourceHint,
      })),
      calculationDate: '2026-08-10',
      explicitlyPublished: true,
      now,
    });
    expect(quality.passed).toBe(true);
    expect(canPublishVcciPublicly({ hasActiveMethodology: true, quality })).toBe(true);
  });

  it('never publishes without active methodology', () => {
    const quality = assessVcciSnapshotQuality({
      methodologyVersion: VCCI_METHODOLOGY_VERSION,
      weights: defaultVcciWeights(),
      componentIndexes: fullIndexes,
      sourceDatasets: VCCI_COMPONENTS.map((c) => ({
        component: c.key,
        name: c.sourceHint,
      })),
      calculationDate: '2026-08-10',
      explicitlyPublished: true,
      now,
    });
    expect(canPublishVcciPublicly({ hasActiveMethodology: false, quality })).toBe(false);
  });
});
