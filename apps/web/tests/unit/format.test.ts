import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/format';
import { absoluteUrl, cn } from '@/utils';

describe('formatDate', () => {
  it('formats ISO dates', () => {
    expect(formatDate('2026-03-12T00:00:00.000Z')).toContain('2026');
  });

  it('returns null for invalid input', () => {
    expect(formatDate('not-a-date')).toBeNull();
  });
});

describe('utils', () => {
  it('joins class names', () => {
    expect(cn('a', false, 'b', null, undefined)).toBe('a b');
  });

  it('builds absolute urls', () => {
    expect(absoluteUrl('/articles')).toMatch(/\/articles$/);
  });
});
