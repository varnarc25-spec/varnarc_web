import { describe, expect, it } from 'vitest';
import {
  analyzeContractorQuotes,
  normalizeMatchKey,
  parseQuoteCsv,
  suggestQuoteCategory,
} from '../src/contractor-quote-analyzer';

describe('suggestQuoteCategory', () => {
  it('maps common descriptions', () => {
    expect(suggestQuoteCategory('RCC M20 slab').key).toBe('rcc');
    expect(suggestQuoteCategory('Internal plaster 12mm').key).toBe('plaster');
    expect(suggestQuoteCategory('Electrical wiring').key).toBe('electrical');
  });
});

describe('parseQuoteCsv', () => {
  it('parses headered CSV rows', () => {
    const csv = `description,category,unit,quantity,unitRate,amount
RCC slab,RCC,m3,10,6200,62000
Brick masonry,masonry,m3,5,850,4250`;
    const { rows, warnings } = parseQuoteCsv(csv);
    expect(warnings).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.description).toBe('RCC slab');
    expect(rows[0]?.amount).toBe(62000);
  });
});

describe('analyzeContractorQuotes', () => {
  it('flags missing items without assuming inclusion', () => {
    const result = analyzeContractorQuotes({
      quotes: [
        {
          id: 'q1',
          label: 'Quote A',
          items: [
            {
              id: 'a1',
              description: 'RCC M20',
              category: 'rcc',
              unit: 'm3',
              quantity: 10,
              unitRate: 6000,
              amount: 60000,
            },
            {
              id: 'a2',
              description: 'Waterproofing terrace',
              category: 'waterproofing',
              unit: 'm2',
              quantity: 100,
              unitRate: 180,
              amount: 18000,
            },
          ],
        },
        {
          id: 'q2',
          label: 'Quote B',
          items: [
            {
              id: 'b1',
              description: 'RCC M20',
              category: 'rcc',
              unit: 'm3',
              quantity: 10,
              unitRate: 6500,
              amount: 65000,
            },
          ],
        },
      ],
      mappings: [],
    });

    expect(result.includesMarketBenchmarks).toBe(false);
    expect(result.quoteTotals).toHaveLength(2);
    expect(result.missingItems.some((f) => f.message === 'Item missing from Quote B')).toBe(true);
    expect(result.unitRateDifferences.length).toBeGreaterThan(0);
    expect(normalizeMatchKey('RCC M20', 'm3')).toBe(normalizeMatchKey('rcc m20', 'm3'));
  });

  it('applies manual mappings to link unmatched items', () => {
    const result = analyzeContractorQuotes({
      quotes: [
        {
          id: 'q1',
          label: 'Quote A',
          items: [
            {
              id: 'a1',
              description: 'Terrace treatment',
              category: 'waterproofing',
              amount: 20000,
            },
          ],
        },
        {
          id: 'q2',
          label: 'Quote B',
          items: [
            {
              id: 'b1',
              description: 'WP membrane',
              category: 'waterproofing',
              amount: 22000,
            },
          ],
        },
      ],
      mappings: [{ fromQuoteId: 'q1', fromItemId: 'a1', toQuoteId: 'q2', toItemId: 'b1' }],
    });
    expect(result.missingItems).toHaveLength(0);
    expect(result.quotes[0]?.items[0]?.matchKey).toBe(result.quotes[1]?.items[0]?.matchKey);
  });
});
