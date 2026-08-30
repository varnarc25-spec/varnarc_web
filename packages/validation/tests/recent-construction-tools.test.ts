import { describe, expect, it } from 'vitest';
import {
  buildConstructionToolResultSummary,
  constructionToolLabel,
  RECENT_CONSTRUCTION_TOOLS_LIMIT,
} from '../src/recent-construction-tools';

describe('recent-construction-tools', () => {
  it('labels known calculators', () => {
    expect(constructionToolLabel('cement-calculator')).toBe('Cement Calculator');
    expect(constructionToolLabel('cost-calculator')).toBe('Construction Cost Calculator');
    expect(constructionToolLabel('tile-calculator')).toBe('Tile Calculator');
  });

  it('builds brief non-sensitive summaries', () => {
    expect(buildConstructionToolResultSummary({ unitSummary: { bags: 42 } })).toBe('≈ 42 bags');
    expect(buildConstructionToolResultSummary({ outputs: { totalCostInr: 450000 } })).toBe(
      '≈ ₹4.5L',
    );
    expect(buildConstructionToolResultSummary({ outputs: {} })).toBeNull();
  });

  it('caps list length constant', () => {
    expect(RECENT_CONSTRUCTION_TOOLS_LIMIT).toBe(8);
  });
});
