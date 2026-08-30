import { describe, expect, it } from 'vitest';
import {
  detectConstructionSearchIntent,
  detectConstructionSearchOpportunities,
  normalizeConstructionSearchQuery,
} from '../src/construction-search-opportunity';

describe('construction-search-opportunity', () => {
  it('scrubs email and phone from display queries', () => {
    const n = normalizeConstructionSearchQuery(
      'Waterproofing cost calculator user@example.com +91 98765 43210',
    );
    expect(n).toContain('waterproofing cost calculator');
    expect(n).not.toContain('@');
    expect(n).not.toMatch(/98765/);
  });

  it('detects calculator intent', () => {
    expect(detectConstructionSearchIntent('waterproofing cost calculator')).toBe('calculator');
  });

  it('flags high search with no results as an opportunity', () => {
    const rows = detectConstructionSearchOpportunities(
      [
        {
          queryHash: 'abc',
          displayQuery: 'waterproofing cost calculator',
          intent: 'calculator',
          searchCount: 1842,
          zeroResultCount: 1800,
          clickCount: 12,
          avgResultCount: 0.1,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        },
      ],
      30,
    );
    expect(rows[0]?.opportunityType).toBe('high_search_no_result');
    expect(String(rows[0]?.evidence.summary)).toMatch(/No dedicated result/i);
  });
});
