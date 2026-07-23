import { describe, expect, it } from 'vitest';
import { parseAdsenseReportTotals } from '../src/modules/analytics/adsense-api.service';

describe('parseAdsenseReportTotals', () => {
  it('parses earnings and impressions from report totals', () => {
    const result = parseAdsenseReportTotals(
      {
        totals: {
          cells: [{ value: '1234.56' }, { value: '98765' }],
        },
      },
      'INR',
    );

    expect(result).toEqual({
      revenue: 1234.56,
      impressions: 98765,
      currency: 'INR',
    });
  });

  it('defaults missing cells to zero', () => {
    expect(parseAdsenseReportTotals({}, 'USD')).toEqual({
      revenue: 0,
      impressions: 0,
      currency: 'USD',
    });
  });
});
