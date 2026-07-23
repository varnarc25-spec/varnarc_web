/**
 * Shared Auth0 env helpers for web/admin structure.
 * No secrets — server packages own Auth0Client instances.
 */

export function isAuth0Configured(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return Boolean(env.AUTH0_DOMAIN && env.AUTH0_CLIENT_ID && env.AUTH0_CLIENT_SECRET && env.AUTH0_SECRET);
}

export const AUTH0_CALLBACK_PATH = '/auth/callback';
export const AUTH0_LOGIN_PATH = '/auth/login';
export const AUTH0_LOGOUT_PATH = '/auth/logout';
