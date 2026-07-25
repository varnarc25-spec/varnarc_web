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
    env.NEXT_PUBLIC_ADMIN_URL?.trim() ||
    env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3001';
  return url.replace(/\/$/, '');
}

type HeaderLike = { get(name: string): string | null };

function isLocalAppBase(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }
}

/** Prefer APP_BASE_URL; when unset/localhost, derive from Cloud Run / proxy request headers. */
export function resolveAppBaseUrl(
  request?: { headers: HeaderLike; nextUrl: { protocol: string; host: string } },
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  const fromEnv = getAppBaseUrl(env);
  if (!request || !isLocalAppBase(fromEnv)) {
    return fromEnv;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || request.nextUrl.host;
  if (!host || host.startsWith('0.0.0.0')) {
    return fromEnv;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const proto =
    forwardedProto?.split(',')[0]?.trim() || request.nextUrl.protocol.replace(':', '') || 'https';
  return `${proto}://${host}`;
}

/** Server-component variant using next/headers(). */
export function resolveAppBaseUrlFromHeaders(
  headers: HeaderLike,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  const fromEnv = getAppBaseUrl(env);
  if (!isLocalAppBase(fromEnv)) {
    return fromEnv;
  }

  const forwardedHost = headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || headers.get('host');
  if (!host || host.startsWith('0.0.0.0')) {
    return fromEnv;
  }

  const proto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  return `${proto}://${host}`;
}

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
