import { describe, expect, it } from 'vitest';
import { automobileRefreshPricesSchema } from '../src/automobile';

describe('automobileRefreshPricesSchema', () => {
  it('defaults missingOnly and limit', () => {
    const parsed = automobileRefreshPricesSchema.parse({});
    expect(parsed.missingOnly).toBe(true);
    expect(parsed.limit).toBe(10);
  });

  it('rejects oversized batches', () => {
    expect(() =>
      automobileRefreshPricesSchema.parse({
        ids: Array.from({ length: 26 }, () => '11111111-1111-4111-8111-111111111111'),
      }),
    ).toThrow();
  });
});
