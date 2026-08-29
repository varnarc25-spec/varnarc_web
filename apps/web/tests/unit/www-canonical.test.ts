import { describe, expect, it } from 'vitest';
import { resolveHostCanonicalRedirect } from '@/lib/www-canonical';

describe('resolveHostCanonicalRedirect', () => {
  it('redirects www to https apex and keeps path and query', () => {
    expect(
      resolveHostCanonicalRedirect({
        host: 'www.varnarc.com',
        proto: 'https',
        pathname: '/articles/emi',
        search: '?utm=1',
      }),
    ).toBe('https://varnarc.com/articles/emi?utm=1');
  });

  it('redirects http apex to https', () => {
    expect(
      resolveHostCanonicalRedirect({
        host: 'varnarc.com',
        proto: 'http',
        pathname: '/',
      }),
    ).toBe('https://varnarc.com/');
  });

  it('leaves https apex unchanged', () => {
    expect(
      resolveHostCanonicalRedirect({
        host: 'varnarc.com',
        proto: 'https',
        pathname: '/',
      }),
    ).toBeNull();
  });

  it('ignores localhost and other hosts', () => {
    expect(
      resolveHostCanonicalRedirect({
        host: 'localhost:3000',
        proto: 'http',
        pathname: '/',
      }),
    ).toBeNull();
    expect(
      resolveHostCanonicalRedirect({
        host: 'admin.varnarc.com',
        proto: 'https',
        pathname: '/',
      }),
    ).toBeNull();
  });
});
