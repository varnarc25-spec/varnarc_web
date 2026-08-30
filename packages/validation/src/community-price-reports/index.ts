/** Community Material Price Reporting — moderated UGC, never primary hub auto-promote. */

import { z } from 'zod';

export const COMMUNITY_PRICE_VERSION = '2026.08.1';

export const COMMUNITY_PRICE_QUALIFICATION =
  'Community reports are contributor-submitted observations. Unverified reports are never promoted into Varnarc’s primary market prices. Public aggregates use only eligible verified reports. Contributor identity and invoice proofs stay private.';

export const COMMUNITY_PRICE_METHODOLOGY =
  'Eligible observations are VERIFIED community reports that pass trust and outlier gates within the lookback window, matching material, location and unit. Observed range uses min/max of eligible prices. Source composition counts invoice-backed vs text-only verified reports. Pending, rejected and flagged reports are excluded from public aggregates.';

export const COMMUNITY_PRICE_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED'] as const;

export type CommunityPriceStatus = (typeof COMMUNITY_PRICE_STATUSES)[number];

export const COMMUNITY_PRICE_STATUS_LABELS: Record<CommunityPriceStatus, string> = {
  PENDING: 'Pending moderation',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  FLAGGED: 'Flagged for review',
};

/** Data-source label for community observations (never editorial hub LIVE). */
export const COMMUNITY_PRICE_SOURCE = 'community_report' as const;
export const COMMUNITY_PRICE_SOURCE_LABEL = 'Community report';

export const COMMUNITY_PRICE_SOURCE_COMPOSITION = [
  { key: 'invoice_backed', label: 'Invoice-backed' },
  { key: 'text_only', label: 'Text-only' },
] as const;

export type CommunityPriceSourceCompositionKey =
  (typeof COMMUNITY_PRICE_SOURCE_COMPOSITION)[number]['key'];

/** Min verified reports for a public aggregate range. */
export const COMMUNITY_PRICE_MIN_ELIGIBLE = 3;
/** Lookback for public aggregates (days). */
export const COMMUNITY_PRICE_LOOKBACK_DAYS = 90;
/** Max submissions per user per rolling day. */
export const COMMUNITY_PRICE_MAX_PER_DAY = 5;
/** Max open PENDING reports per user. */
export const COMMUNITY_PRICE_MAX_PENDING = 10;
/** Duplicate: same user/material/location/unit/price within this many days. */
export const COMMUNITY_PRICE_DUPLICATE_DAYS = 14;
/** Absolute price tolerance for duplicate detection (₹). */
export const COMMUNITY_PRICE_DUPLICATE_PRICE_TOLERANCE = 1;
/** Outlier if |price − reference mid| / mid exceeds this ratio. */
export const COMMUNITY_PRICE_OUTLIER_RATIO = 0.35;
/** Min trust score to include in public aggregate after VERIFIED. */
export const COMMUNITY_PRICE_MIN_TRUST_FOR_AGGREGATE = 50;
/** Base trust on submit. */
export const COMMUNITY_PRICE_TRUST_BASE = 40;
export const COMMUNITY_PRICE_TRUST_INVOICE_BONUS = 15;
export const COMMUNITY_PRICE_TRUST_BRAND_BONUS = 5;
export const COMMUNITY_PRICE_TRUST_SUPPLIER_BONUS = 5;
export const COMMUNITY_PRICE_TRUST_HISTORY_BONUS_PER = 2;
export const COMMUNITY_PRICE_TRUST_HISTORY_CAP = 20;
export const COMMUNITY_PRICE_TRUST_OUTLIER_PENALTY = 25;
export const COMMUNITY_PRICE_TRUST_MAX = 100;

export const createCommunityPriceReportSchema = z.object({
  materialId: z.string().uuid(),
  locationId: z.string().uuid(),
  brandId: z.string().uuid().optional().nullable(),
  brandName: z.string().trim().max(120).optional().nullable(),
  price: z.coerce.number().positive().max(10_000_000),
  unit: z.string().trim().min(1).max(40),
  currency: z.string().length(3).default('INR'),
  purchaseDate: z.string().min(4), // ISO date
  supplierName: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateCommunityPriceReportInput = z.infer<typeof createCommunityPriceReportSchema>;

export const moderateCommunityPriceReportSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'FLAGGED', 'PENDING']),
  moderationNotes: z.string().trim().max(1000).optional().nullable(),
  trustScore: z.coerce.number().min(0).max(100).optional().nullable(),
});

export type ModerateCommunityPriceReportInput = z.infer<typeof moderateCommunityPriceReportSchema>;

export type CommunityPriceObservation = {
  price: number;
  purchaseDate: Date | string;
  hasInvoice: boolean;
  trustScore: number;
  status: CommunityPriceStatus;
  isOutlier?: boolean;
  unit: string;
};

export function computeCommunityTrustScore(input: {
  hasInvoice: boolean;
  hasBrand: boolean;
  hasSupplier: boolean;
  verifiedHistoryCount: number;
  isOutlier: boolean;
}): number {
  let score = COMMUNITY_PRICE_TRUST_BASE;
  if (input.hasInvoice) score += COMMUNITY_PRICE_TRUST_INVOICE_BONUS;
  if (input.hasBrand) score += COMMUNITY_PRICE_TRUST_BRAND_BONUS;
  if (input.hasSupplier) score += COMMUNITY_PRICE_TRUST_SUPPLIER_BONUS;
  score += Math.min(
    COMMUNITY_PRICE_TRUST_HISTORY_CAP,
    Math.max(0, input.verifiedHistoryCount) * COMMUNITY_PRICE_TRUST_HISTORY_BONUS_PER,
  );
  if (input.isOutlier) score -= COMMUNITY_PRICE_TRUST_OUTLIER_PENALTY;
  return Math.max(0, Math.min(COMMUNITY_PRICE_TRUST_MAX, Math.round(score)));
}

export function isCommunityPriceOutlier(
  price: number,
  referenceMid: number | null | undefined,
  ratio = COMMUNITY_PRICE_OUTLIER_RATIO,
): boolean {
  if (referenceMid == null || !(referenceMid > 0) || !(price > 0)) return false;
  return Math.abs(price - referenceMid) / referenceMid > ratio;
}

export function pricesNearDuplicate(
  a: number,
  b: number,
  tolerance = COMMUNITY_PRICE_DUPLICATE_PRICE_TOLERANCE,
): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function isEligibleCommunityObservation(
  o: Pick<CommunityPriceObservation, 'status' | 'trustScore' | 'isOutlier'>,
): boolean {
  if (o.status !== 'VERIFIED') return false;
  if (o.isOutlier) return false;
  if (o.trustScore < COMMUNITY_PRICE_MIN_TRUST_FOR_AGGREGATE) return false;
  return true;
}

export type CommunityPriceAggregate =
  | {
      ok: true;
      materialId: string;
      locationId: string;
      unit: string;
      currency: string;
      observedRange: { low: number; high: number; mid: number };
      sampleSize: number;
      freshness: {
        newestAgeDays: number | null;
        oldestAgeDays: number | null;
        label: string;
      };
      sourceComposition: Array<{
        key: CommunityPriceSourceCompositionKey;
        label: string;
        count: number;
        percent: number;
      }>;
      sourceLabel: string;
      methodology: string;
      version: string;
      disclaimer: string;
      /** Explicit: community data is not the primary market price hub. */
      isPrimaryMarketPrice: false;
    }
  | {
      ok: false;
      reason: string;
      code: 'INSUFFICIENT_DATA' | 'INVALID_FILTER';
      sampleSize: number;
      methodology: string;
      version: string;
      disclaimer: string;
      isPrimaryMarketPrice: false;
    };

function ageDays(from: Date | string, now: Date): number | null {
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Aggregate only eligible VERIFIED community observations. Never invents a range.
 * Does not read or write primary market price tables.
 */
export function aggregateCommunityPrices(input: {
  materialId: string;
  locationId: string;
  unit: string;
  currency?: string;
  observations: CommunityPriceObservation[];
  now?: Date;
}): CommunityPriceAggregate {
  const disclaimer = COMMUNITY_PRICE_QUALIFICATION;
  const methodology = COMMUNITY_PRICE_METHODOLOGY;
  const version = COMMUNITY_PRICE_VERSION;
  const now = input.now ?? new Date();
  const lookback = new Date(now.getTime() - COMMUNITY_PRICE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const eligible = input.observations.filter((o) => {
    if (!isEligibleCommunityObservation(o)) return false;
    if (o.unit.trim().toLowerCase() !== input.unit.trim().toLowerCase()) return false;
    const d = new Date(o.purchaseDate);
    if (Number.isNaN(d.getTime()) || d < lookback) return false;
    return true;
  });

  if (eligible.length < COMMUNITY_PRICE_MIN_ELIGIBLE) {
    return {
      ok: false,
      code: 'INSUFFICIENT_DATA',
      reason: `Need at least ${COMMUNITY_PRICE_MIN_ELIGIBLE} eligible verified community reports in the last ${COMMUNITY_PRICE_LOOKBACK_DAYS} days. Currently ${eligible.length}. Unverified reports are never shown as market prices.`,
      sampleSize: eligible.length,
      methodology,
      version,
      disclaimer,
      isPrimaryMarketPrice: false,
    };
  }

  const prices = eligible.map((o) => o.price).filter((p) => p > 0);
  const low = Math.round(Math.min(...prices) * 100) / 100;
  const high = Math.round(Math.max(...prices) * 100) / 100;
  const mid = Math.round(((low + high) / 2) * 100) / 100;

  const ages = eligible
    .map((o) => ageDays(o.purchaseDate, now))
    .filter((a): a is number => a != null);
  const newestAgeDays = ages.length ? Math.min(...ages) : null;
  const oldestAgeDays = ages.length ? Math.max(...ages) : null;

  const invoiceBacked = eligible.filter((o) => o.hasInvoice).length;
  const textOnly = eligible.length - invoiceBacked;
  const composition = [
    {
      key: 'invoice_backed' as const,
      label: 'Invoice-backed',
      count: invoiceBacked,
      percent: Math.round((invoiceBacked / eligible.length) * 1000) / 10,
    },
    {
      key: 'text_only' as const,
      label: 'Text-only',
      count: textOnly,
      percent: Math.round((textOnly / eligible.length) * 1000) / 10,
    },
  ];

  return {
    ok: true,
    materialId: input.materialId,
    locationId: input.locationId,
    unit: input.unit,
    currency: input.currency ?? 'INR',
    observedRange: { low, high, mid },
    sampleSize: eligible.length,
    freshness: {
      newestAgeDays,
      oldestAgeDays,
      label:
        newestAgeDays == null
          ? 'Freshness unknown'
          : newestAgeDays <= 14
            ? 'Recent (within 14 days)'
            : newestAgeDays <= 45
              ? 'Within 45 days'
              : `Up to ${newestAgeDays} days old`,
    },
    sourceComposition: composition,
    sourceLabel: COMMUNITY_PRICE_SOURCE_LABEL,
    methodology,
    version,
    disclaimer,
    isPrimaryMarketPrice: false,
  };
}

export function suggestInitialModerationStatus(input: {
  isDuplicate: boolean;
  isOutlier: boolean;
}): CommunityPriceStatus {
  if (input.isDuplicate) return 'FLAGGED';
  if (input.isOutlier) return 'FLAGGED';
  return 'PENDING';
}
