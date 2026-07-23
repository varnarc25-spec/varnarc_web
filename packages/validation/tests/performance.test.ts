import { describe, expect, it } from 'vitest';
import { recordWebVitalsSchema } from '../src/performance';

describe('recordWebVitalsSchema', () => {
  it('accepts core web vitals payload', () => {
    const parsed = recordWebVitalsSchema.parse({
      path: '/',
      metrics: [
        { name: 'LCP', value: 2100, rating: 'good' },
        { name: 'CLS', value: 0.04, rating: 'good' },
      ],
    });
    expect(parsed.metrics).toHaveLength(2);
  });

  it('rejects unknown metric names', () => {
    expect(() =>
      recordWebVitalsSchema.parse({
        path: '/',
        metrics: [{ name: 'FID', value: 10 }],
      }),
    ).toThrow();
  });
});
