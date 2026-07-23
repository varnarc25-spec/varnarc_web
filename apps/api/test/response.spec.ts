import { describe, expect, it } from 'vitest';
import { ok, okCursor } from '../src/common/utils/response';

describe('response helpers', () => {
  it('ok wraps data', () => {
    expect(ok({ id: '1' })).toEqual({ success: true, data: { id: '1' } });
  });

  it('okCursor maps page shape', () => {
    const result = okCursor({
      items: [{ id: 'a' }],
      nextCursor: 'c1',
      prevCursor: null,
      hasMore: false,
      limit: 20,
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta?.nextCursor).toBe('c1');
  });
});
