import { describe, expect, it } from 'vitest';
import { validateStartupEnv } from '../src/config/startup-env';

describe('validateStartupEnv', () => {
  it('does not throw in production when DATABASE_URL missing (degraded start)', () => {
    expect(() =>
      validateStartupEnv({ NODE_ENV: 'production', AUTH0_DOMAIN: 'x', AUTH0_AUDIENCE: 'y' }),
    ).not.toThrow();
  });

  it('does not throw in development when vars missing', () => {
    expect(() => validateStartupEnv({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('passes in production with required vars', () => {
    expect(() =>
      validateStartupEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/db',
        AUTH0_DOMAIN: 'tenant.auth0.com',
        AUTH0_AUDIENCE: 'https://api',
        SEARCH_ENGINE: 'postgres-fts',
      }),
    ).not.toThrow();
  });
});
