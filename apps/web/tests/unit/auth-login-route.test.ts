import { describe, expect, it } from 'vitest';
import { appBaseUrlMatchesHost, shouldRunAuth0Middleware } from '@varnarc/auth';

describe('Auth0 login routing', () => {
  const configured = {
    AUTH0_DOMAIN: 'varnarc.auth0.com',
    AUTH0_CLIENT_ID: 'client',
    AUTH0_CLIENT_SECRET: 'secret',
    AUTH0_SECRET: 'session-secret',
    APP_BASE_URL: 'https://varnarc.com',
  };

  it('does not treat Cloud Run 0.0.0.0 as the public host', () => {
    expect(appBaseUrlMatchesHost('0.0.0.0:8080', configured)).toBe(false);
    expect(appBaseUrlMatchesHost('varnarc.com', configured)).toBe(true);
  });

  it('still runs Auth0 for /auth/login when nextUrl host is 0.0.0.0', () => {
    expect(
      shouldRunAuth0Middleware({
        pathname: '/auth/login',
        forwardedHost: 'varnarc.com',
        nextUrlHost: '0.0.0.0:8080',
        env: configured,
      }),
    ).toBe(true);
  });

  it('runs Auth0 for login even if forwarded host is missing', () => {
    expect(
      shouldRunAuth0Middleware({
        pathname: '/auth/login',
        forwardedHost: null,
        nextUrlHost: '0.0.0.0:8080',
        env: configured,
      }),
    ).toBe(true);
  });
});
