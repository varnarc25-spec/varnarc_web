export type RateFreshnessStatus = 'FRESH' | 'AGING' | 'STALE' | 'CRITICAL';

export const DEFAULT_FRESHNESS_DAYS = {
  aging: 90,
  stale: 180,
  critical: 365,
} as const;

export function classifyRateFreshness(
  lastVerifiedAt: Date | string | null | undefined,
  asOf = new Date(),
  days = DEFAULT_FRESHNESS_DAYS,
): RateFreshnessStatus {
  if (!lastVerifiedAt) return 'CRITICAL';
  const at = typeof lastVerifiedAt === 'string' ? new Date(lastVerifiedAt) : lastVerifiedAt;
  if (Number.isNaN(at.getTime())) return 'CRITICAL';
  const ageDays = (asOf.getTime() - at.getTime()) / 86_400_000;
  if (ageDays < days.aging) return 'FRESH';
  if (ageDays < days.stale) return 'AGING';
  if (ageDays < days.critical) return 'STALE';
  return 'CRITICAL';
}
