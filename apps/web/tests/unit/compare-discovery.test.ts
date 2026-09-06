import { describe, expect, it } from 'vitest';
import {
  builderCompareHref,
  canonicalPairOrder,
  comparableOptions,
  compareHubIsIndexable,
  comparisonPreview,
  featuredPairFromCatalog,
  matchComparisonCards,
  type BuilderCategory,
  type BuilderOption,
} from '@/lib/compare-hub';
import {
  addRecentComparison,
  parseRecentComparisons,
  RECENT_COMPARISONS_LIMIT,
} from '@/lib/recent-comparisons';

const options: BuilderOption[] = [
  {
    id: 'a',
    label: 'Car A',
    group: 'suv',
    sortValue: 10,
    preview: [{ label: 'Price', value: '₹10 lakh' }],
  },
  {
    id: 'b',
    label: 'Car B',
    group: 'suv',
    sortValue: 11,
    preview: [{ label: 'Price', value: '₹11 lakh' }],
  },
  { id: 'c', label: 'Car C', group: 'sedan', sortValue: 10.5 },
  { id: 'd', label: 'Car D', group: 'suv', sortValue: 15 },
];

describe('compare discovery helpers', () => {
  it('suggests only like-for-like options ordered by numeric proximity', () => {
    expect(comparableOptions(options, 'a').map((option) => option.id)).toEqual(['b', 'd']);
  });

  it('builds a preview only from attributes present on both options', () => {
    expect(comparisonPreview(options[0], options[1])).toEqual([
      { label: 'Price', optionA: '₹10 lakh', optionB: '₹11 lakh' },
    ]);
    expect(comparisonPreview(options[0], options[3])).toEqual([]);
  });

  it('preserves existing category comparison URLs', () => {
    expect(builderCompareHref('cars', 'a', 'b', 'suv')).toBe('/automobile/compare?ids=a%2Cb');
    expect(builderCompareHref('finance', 'a', 'b', 'card:credit')).toBe(
      '/finance/compare?type=credit-cards&ids=a%2Cb',
    );
  });

  it('parses, deduplicates and limits recent comparisons', () => {
    let recent = parseRecentComparisons(null);
    for (let index = 0; index < RECENT_COMPARISONS_LIMIT + 2; index += 1) {
      recent = addRecentComparison(recent, {
        href: `/compare/${index}`,
        optionA: `A ${index}`,
        optionB: `B ${index}`,
        category: 'cars',
        viewedAt: new Date(index).toISOString(),
      });
    }
    expect(recent).toHaveLength(RECENT_COMPARISONS_LIMIT);
    expect(recent[0]?.href).toBe(`/compare/${RECENT_COMPARISONS_LIMIT + 1}`);

    const updated = addRecentComparison(recent, { ...recent[2]!, viewedAt: 'new' });
    expect(updated[0]?.href).toBe(recent[2]?.href);
    expect(new Set(updated.map((item) => item.href)).size).toBe(updated.length);
  });

  it('matches Swift vs Baleno searches in either order', () => {
    const cards = [
      {
        id: '1',
        href: '/compare/swift-vs-baleno',
        title: 'Swift vs Baleno',
        category: 'cars' as const,
        optionA: 'Maruti Swift',
        optionB: 'Maruti Baleno',
        dimensions: ['Price'],
      },
    ];
    expect(matchComparisonCards(cards, 'Swift vs Baleno')[0]?.id).toBe('1');
    expect(matchComparisonCards(cards, 'baleno versus swift')[0]?.id).toBe('1');
  });

  it('orders comparison pairs canonically without inventing a second URL', () => {
    expect(canonicalPairOrder('Baleno', 'Swift')).toEqual(['Baleno', 'Swift']);
    expect(canonicalPairOrder('Swift', 'Baleno')).toEqual(['Baleno', 'Swift']);
  });

  it('builds a featured catalog pair from like-for-like options', () => {
    const catalog: BuilderCategory = {
      key: 'cars',
      label: 'Cars',
      hint: '',
      options,
    };
    const featured = featuredPairFromCatalog(catalog);
    expect(featured?.optionA).toBe('Car A');
    expect(featured?.optionB).toBe('Car B');
    expect(featured?.href).toContain('/automobile/compare?ids=');
  });

  it('indexes the compare hub only without query-parameter state', () => {
    expect(compareHubIsIndexable({})).toBe(true);
    expect(compareHubIsIndexable({ q: 'swift vs baleno' })).toBe(false);
    expect(compareHubIsIndexable({ category: 'cars' })).toBe(false);
  });

  it('rejects malformed recent comparison storage', () => {
    expect(parseRecentComparisons('{broken')).toEqual([]);
    expect(parseRecentComparisons(JSON.stringify([{ href: 'https://example.com' }]))).toEqual([]);
  });
});
