/** Location-aware rate resolution. Never invent official city prices. */

export const RATE_LOCATION_LEVELS = [
  'LOCALITY',
  'CITY',
  'DISTRICT',
  'STATE',
  'REGION',
  'NATIONAL',
  'FALLBACK',
] as const;

export type RateLocationLevel = (typeof RATE_LOCATION_LEVELS)[number];

export type RateSourceType =
  | 'OFFICIAL_SOR'
  | 'OFFICIAL_MARKET_SURVEY'
  | 'OFFICIAL_STATISTICS'
  | 'MANUFACTURER'
  | 'AUTHORIZED_DEALER'
  | 'MARKET_SURVEY'
  | 'VARNARC_VERIFIED'
  | 'DERIVED'
  | 'ESTIMATED_FALLBACK'
  | 'USER_OVERRIDE';

export type RateConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ResolvableRate = {
  id: string;
  locationId: string | null;
  locationType: RateLocationLevel | null;
  minRate: number;
  averageRate: number;
  maxRate: number;
  unit: string;
  sourceType: RateSourceType;
  confidence: RateConfidence;
  isDerived: boolean;
  derivationMethod?: string | null;
  lastVerifiedAt?: string | null;
  effectiveFrom: string;
  sourceName?: string | null;
};

export type LocationAncestor = {
  id: string;
  type: RateLocationLevel;
};

export type ResolvedRate = {
  rate: number;
  minRate: number;
  maxRate: number;
  unit: string;
  locationLevel: RateLocationLevel;
  sourceType: RateSourceType;
  sourceName: string | null;
  confidence: RateConfidence;
  lastVerifiedAt: string | null;
  isDerived: boolean;
  derivationMethod: string | null;
  effectiveFrom: string;
  publicLabel: string;
};

export function publicRateLabel(rate: Pick<ResolvableRate, 'sourceType' | 'isDerived'>): string {
  if (rate.sourceType === 'USER_OVERRIDE') return 'Your rate';
  if (
    rate.sourceType === 'OFFICIAL_SOR' ||
    rate.sourceType === 'OFFICIAL_MARKET_SURVEY' ||
    rate.sourceType === 'OFFICIAL_STATISTICS'
  ) {
    return 'Official schedule / survey rate';
  }
  if (rate.sourceType === 'VARNARC_VERIFIED' || rate.sourceType === 'MARKET_SURVEY') {
    return 'Verified market observation';
  }
  if (rate.sourceType === 'ESTIMATED_FALLBACK') {
    return 'Indicative planning rate';
  }
  if (rate.isDerived || rate.sourceType === 'DERIVED') {
    return 'Derived from state/regional benchmark';
  }
  return 'Indicative planning rate';
}

export function validateRateBand(minRate: number, averageRate: number, maxRate: number): string[] {
  const errors: string[] = [];
  if (minRate < 0 || averageRate < 0 || maxRate < 0) errors.push('Rates cannot be negative.');
  if (minRate > averageRate) errors.push('minRate cannot exceed averageRate.');
  if (averageRate > maxRate) errors.push('averageRate cannot exceed maxRate.');
  return errors;
}

function levelRank(level: RateLocationLevel | null): number {
  if (!level) return 99;
  return RATE_LOCATION_LEVELS.indexOf(level);
}

/**
 * Pick the best active rate for a location ancestry (locality → city → … → national).
 */
export function resolveRate(input: {
  candidates: ResolvableRate[];
  ancestry: LocationAncestor[];
  asOf?: Date;
}): ResolvedRate | null {
  const asOf = input.asOf ?? new Date();
  const order = new Map(input.ancestry.map((node, i) => [node.id, i]));
  const eligible = input.candidates.filter((row) => {
    const from = new Date(row.effectiveFrom);
    if (Number.isNaN(from.getTime()) || from > asOf) return false;
    if (row.minRate > row.averageRate || row.averageRate > row.maxRate) return false;
    return true;
  });
  if (!eligible.length) return null;

  eligible.sort((a, b) => {
    const aExact = a.locationId ? (order.get(a.locationId) ?? 50) : 40;
    const bExact = b.locationId ? (order.get(b.locationId) ?? 50) : 40;
    if (aExact !== bExact) return aExact - bExact;
    const aRank = levelRank(a.locationType);
    const bRank = levelRank(b.locationType);
    if (aRank !== bRank) return aRank - bRank;
    return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
  });

  const picked = eligible[0]!;
  const locationLevel: RateLocationLevel = picked.locationId
    ? (input.ancestry.find((n) => n.id === picked.locationId)?.type ??
      picked.locationType ??
      'FALLBACK')
    : 'NATIONAL';

  return {
    rate: picked.averageRate,
    minRate: picked.minRate,
    maxRate: picked.maxRate,
    unit: picked.unit,
    locationLevel,
    sourceType: picked.sourceType,
    sourceName: picked.sourceName ?? null,
    confidence: picked.confidence,
    lastVerifiedAt: picked.lastVerifiedAt ?? null,
    isDerived:
      picked.isDerived ||
      picked.sourceType === 'DERIVED' ||
      picked.sourceType === 'ESTIMATED_FALLBACK',
    derivationMethod: picked.derivationMethod ?? null,
    effectiveFrom: picked.effectiveFrom,
    publicLabel: publicRateLabel(picked),
  };
}

export function applyUserOverride(
  resolved: ResolvedRate,
  overrideRate: number,
  unit: string,
): ResolvedRate {
  return {
    ...resolved,
    rate: overrideRate,
    minRate: overrideRate,
    maxRate: overrideRate,
    unit,
    sourceType: 'USER_OVERRIDE',
    confidence: 'HIGH',
    isDerived: false,
    publicLabel: publicRateLabel({ sourceType: 'USER_OVERRIDE', isDerived: false }),
  };
}

export function rangeFromExpected(
  expected: number,
  spread = 0.12,
): {
  low: number;
  expected: number;
  high: number;
} {
  return {
    low: Math.round(expected * (1 - spread)),
    expected: Math.round(expected),
    high: Math.round(expected * (1 + spread)),
  };
}

export * from './freshness';
