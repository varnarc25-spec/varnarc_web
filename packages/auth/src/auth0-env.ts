/**
 * Shared Auth0 env helpers for web/admin structure.
 * No secrets — server packages own Auth0Client instances.
 */

export function isAuth0Configured(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return Boolean(
    env.AUTH0_DOMAIN && env.AUTH0_CLIENT_ID && env.AUTH0_CLIENT_SECRET && env.AUTH0_SECRET,
  );
}

/** Public app URL — prefer APP_BASE_URL on Cloud Run (request.origin may be 0.0.0.0:8080). */
export function getAppBaseUrl(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  const url =
    env.APP_BASE_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    env.NEXT_PUBLIC_ADMIN_URL?.trim() ||
    'http://localhost:3000';
  return url.replace(/\/$/, '');
}

/** True when the incoming Host matches APP_BASE_URL (Auth0 cookies/URLs are host-bound). */
export function appBaseUrlMatchesHost(
  host: string,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  const normalizedHost = host.trim().toLowerCase();
  if (!normalizedHost) return false;
  try {
    return new URL(getAppBaseUrl(env)).host.toLowerCase() === normalizedHost;
  } catch {
    return false;
  }
}

export const AUTH0_CALLBACK_PATH = '/auth/callback';
export const AUTH0_LOGIN_PATH = '/auth/login';
export const AUTH0_LOGOUT_PATH = '/auth/logout';
