export type RateFreshnessStatus = 'fresh' | 'review_soon' | 'review_required' | 'unknown';

/** Public freshness window (days). Internal labels map to these thresholds. */
export const RATE_FRESHNESS_DAYS = {
  fresh: 30,
  reviewSoon: 90,
} as const;

export type RateFreshnessResult = {
  status: RateFreshnessStatus;
  verifiedLabel: string | null;
  publicNotice: string | null;
  ageDays: number | null;
};

function formatVerifiedDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getRateFreshness(
  rateLastVerifiedAt?: string | null,
  now: Date = new Date(),
): RateFreshnessResult {
  if (!rateLastVerifiedAt) {
    return {
      status: 'unknown',
      verifiedLabel: null,
      publicNotice: null,
      ageDays: null,
    };
  }

  const verified = new Date(rateLastVerifiedAt);
  if (Number.isNaN(verified.getTime())) {
    return {
      status: 'unknown',
      verifiedLabel: null,
      publicNotice: null,
      ageDays: null,
    };
  }

  const ageMs = now.getTime() - verified.getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
  const verifiedLabel = formatVerifiedDate(rateLastVerifiedAt);

  if (ageDays <= RATE_FRESHNESS_DAYS.fresh) {
    return { status: 'fresh', verifiedLabel, publicNotice: null, ageDays };
  }
  if (ageDays <= RATE_FRESHNESS_DAYS.reviewSoon) {
    return {
      status: 'review_soon',
      verifiedLabel,
      publicNotice: null,
      ageDays,
    };
  }
  return {
    status: 'review_required',
    verifiedLabel,
    publicNotice: 'Rate information may require re-verification.',
    ageDays,
  };
}
