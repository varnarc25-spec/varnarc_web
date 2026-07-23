import { describe, expect, it } from 'vitest';
import { resolveSearchEngine } from '@varnarc/config';

describe('resolveSearchEngine', () => {
  it('defaults to postgres-fts in development', () => {
    expect(resolveSearchEngine({ NODE_ENV: 'development' })).toBe('postgres-fts');
  });

  it('defaults to opensearch in production', () => {
    expect(resolveSearchEngine({ NODE_ENV: 'production' })).toBe('opensearch');
  });

  it('respects explicit SEARCH_ENGINE', () => {
    expect(
      resolveSearchEngine({ NODE_ENV: 'production', SEARCH_ENGINE: 'postgres-fts' }),
    ).toBe('postgres-fts');
    expect(
      resolveSearchEngine({ NODE_ENV: 'development', SEARCH_ENGINE: 'opensearch' }),
    ).toBe('opensearch');
  });
});
