import type { CompareCategoryKey } from '@/lib/compare-hub';

export const RECENT_COMPARISONS_KEY = 'varnarc_recent_comparisons';
export const RECENT_COMPARISONS_LIMIT = 6;

export type RecentComparison = {
  href: string;
  optionA: string;
  optionB: string;
  category: CompareCategoryKey;
  viewedAt: string;
};

export function parseRecentComparisons(value: string | null): RecentComparison[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentComparison =>
        Boolean(
          item &&
          typeof item === 'object' &&
          typeof (item as RecentComparison).href === 'string' &&
          (item as RecentComparison).href.startsWith('/') &&
          typeof (item as RecentComparison).optionA === 'string' &&
          typeof (item as RecentComparison).optionB === 'string' &&
          typeof (item as RecentComparison).category === 'string' &&
          typeof (item as RecentComparison).viewedAt === 'string',
        ),
      )
      .slice(0, RECENT_COMPARISONS_LIMIT);
  } catch {
    return [];
  }
}

export function addRecentComparison(
  current: RecentComparison[],
  next: RecentComparison,
): RecentComparison[] {
  return [next, ...current.filter((item) => item.href !== next.href)].slice(
    0,
    RECENT_COMPARISONS_LIMIT,
  );
}
