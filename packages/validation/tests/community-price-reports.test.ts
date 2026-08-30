import { describe, expect, it } from 'vitest';
import {
  aggregateCommunityPrices,
  computeCommunityTrustScore,
  isCommunityPriceOutlier,
  isEligibleCommunityObservation,
  pricesNearDuplicate,
  suggestInitialModerationStatus,
} from '../src/community-price-reports';

const now = new Date('2026-08-21T12:00:00Z');

describe('computeCommunityTrustScore', () => {
  it('rewards invoice and history, penalises outliers', () => {
    const base = computeCommunityTrustScore({
      hasInvoice: false,
      hasBrand: false,
      hasSupplier: false,
      verifiedHistoryCount: 0,
      isOutlier: false,
    });
    const strong = computeCommunityTrustScore({
      hasInvoice: true,
      hasBrand: true,
      hasSupplier: true,
      verifiedHistoryCount: 10,
      isOutlier: false,
    });
    const outlier = computeCommunityTrustScore({
      hasInvoice: true,
      hasBrand: false,
      hasSupplier: false,
      verifiedHistoryCount: 0,
      isOutlier: true,
    });
    expect(strong).toBeGreaterThan(base);
    expect(outlier).toBeLessThan(base + 15);
  });
});

describe('outlier / duplicate helpers', () => {
  it('detects outliers vs reference mid', () => {
    expect(isCommunityPriceOutlier(800, 400)).toBe(true);
    expect(isCommunityPriceOutlier(420, 400)).toBe(false);
  });

  it('detects near-duplicate prices', () => {
    expect(pricesNearDuplicate(400, 400.5)).toBe(true);
    expect(pricesNearDuplicate(400, 410)).toBe(false);
  });
});

describe('eligibility + aggregate', () => {
  it('excludes pending and outliers from eligibility', () => {
    expect(
      isEligibleCommunityObservation({ status: 'PENDING', trustScore: 80, isOutlier: false }),
    ).toBe(false);
    expect(
      isEligibleCommunityObservation({ status: 'VERIFIED', trustScore: 80, isOutlier: true }),
    ).toBe(false);
    expect(
      isEligibleCommunityObservation({ status: 'VERIFIED', trustScore: 80, isOutlier: false }),
    ).toBe(true);
  });

  it('does not invent a public range with insufficient data', () => {
    const result = aggregateCommunityPrices({
      materialId: 'm1',
      locationId: 'l1',
      unit: 'bag',
      observations: [
        {
          price: 400,
          purchaseDate: '2026-08-10',
          hasInvoice: true,
          trustScore: 70,
          status: 'VERIFIED',
          unit: 'bag',
        },
        {
          price: 410,
          purchaseDate: '2026-08-11',
          hasInvoice: false,
          trustScore: 60,
          status: 'PENDING',
          unit: 'bag',
        },
      ],
      now,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.isPrimaryMarketPrice).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_DATA');
    }
  });

  it('aggregates eligible verified reports with source composition', () => {
    const result = aggregateCommunityPrices({
      materialId: 'm1',
      locationId: 'l1',
      unit: 'bag',
      observations: [
        {
          price: 390,
          purchaseDate: '2026-08-01',
          hasInvoice: true,
          trustScore: 70,
          status: 'VERIFIED',
          unit: 'bag',
        },
        {
          price: 400,
          purchaseDate: '2026-08-05',
          hasInvoice: true,
          trustScore: 65,
          status: 'VERIFIED',
          unit: 'bag',
        },
        {
          price: 420,
          purchaseDate: '2026-08-10',
          hasInvoice: false,
          trustScore: 55,
          status: 'VERIFIED',
          unit: 'bag',
        },
        {
          price: 900,
          purchaseDate: '2026-08-12',
          hasInvoice: false,
          trustScore: 80,
          status: 'VERIFIED',
          isOutlier: true,
          unit: 'bag',
        },
      ],
      now,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sampleSize).toBe(3);
      expect(result.observedRange).toEqual({ low: 390, high: 420, mid: 405 });
      expect(result.isPrimaryMarketPrice).toBe(false);
      expect(result.sourceComposition.find((c) => c.key === 'invoice_backed')?.count).toBe(2);
      expect(result.sourceLabel).toMatch(/Community/i);
    }
  });

  it('suggests FLAGGED for duplicates/outliers, else PENDING', () => {
    expect(suggestInitialModerationStatus({ isDuplicate: true, isOutlier: false })).toBe('FLAGGED');
    expect(suggestInitialModerationStatus({ isDuplicate: false, isOutlier: true })).toBe('FLAGGED');
    expect(suggestInitialModerationStatus({ isDuplicate: false, isOutlier: false })).toBe(
      'PENDING',
    );
  });
});
