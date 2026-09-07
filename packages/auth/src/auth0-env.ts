/**
 * Shared Auth0 env helpers for web/admin structure.
 * No secrets — server packages own Auth0Client instances.
 */

/** OAuth client id — runtime env or build-time public fallback. */
export function getAuth0ClientId(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string | undefined {
  return env.AUTH0_CLIENT_ID?.trim() || env.NEXT_PUBLIC_AUTH0_CLIENT_ID?.trim() || undefined;
}

export function isAuth0Configured(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return Boolean(
    env.AUTH0_DOMAIN && getAuth0ClientId(env) && env.AUTH0_CLIENT_SECRET && env.AUTH0_SECRET,
  );
}

/** Show login/signup in the header when Auth0 is configured or explicitly enabled on Cloud Run. */
export function isAuthUiEnabled(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  if (isAuth0Configured(env)) return true;
  if (env.NEXT_PUBLIC_AUTH0_CONFIGURED === 'true') return true;
  if (env.AUTH0_CLIENT_ID?.trim() && env.AUTH0_DOMAIN?.trim()) return true;
  // Build-time public client id (safe to expose) when runtime secrets are mounted but CLIENT_ID env is missing.
  if (env.NEXT_PUBLIC_AUTH0_CLIENT_ID?.trim() && env.AUTH0_DOMAIN?.trim()) return true;
  return false;
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

/**
 * Options for Auth0Client. Only pass appBaseUrl when APP_BASE_URL is set explicitly.
 * Otherwise the SDK infers the callback URL from the request host (Cloud Run / custom domain).
 */
export function getAuth0ClientOptions(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): { appBaseUrl?: string } {
  const appBaseUrl = env.APP_BASE_URL?.trim();
  return appBaseUrl ? { appBaseUrl } : {};
}

export function appBaseUrlMatchesHost(
  host: string,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  const normalizedHost = host.trim().toLowerCase().replace(/:\d+$/, '');
  if (!normalizedHost) return false;
  if (normalizedHost === '0.0.0.0' || normalizedHost === '127.0.0.1') {
    return false;
  }

  const fromEnv = getAppBaseUrl(env);
  if (isLocalAppBase(fromEnv)) {
    // APP_BASE_URL unset on Cloud Run — accept the request host (custom domain or *.run.app).
    return true;
  }

  try {
    return new URL(fromEnv).hostname.toLowerCase() === normalizedHost;
  } catch {
    return false;
  }
}

/** Whether middleware should invoke Auth0 (login/callback must not fall through to 404). */
export function shouldRunAuth0Middleware(input: {
  pathname: string;
  forwardedHost?: string | null;
  nextUrlHost?: string | null;
  env?: Record<string, string | undefined>;
}): boolean {
  const env = input.env ?? (process.env as Record<string, string | undefined>);
  const pathname = input.pathname;
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/');
  const authReady =
    isAuth0Configured(env) ||
    (isAuthRoute && isAuthUiEnabled(env) && Boolean(env.AUTH0_DOMAIN?.trim()));

  if (!authReady) return false;
  if (isAuthRoute) return true;

  const publicHost = input.forwardedHost?.split(',')[0]?.trim() || input.nextUrlHost || '';
  return appBaseUrlMatchesHost(publicHost, env);
}

export function isAuth0Identifier(value: string | null | undefined): boolean {
  const v = value?.trim() ?? '';
  if (!v) return true;
  return /^(auth0|google-oauth2|github|windowslive|oauth2)[|_]/i.test(v) || v.includes('|');
}

export function isPlaceholderAuthEmail(email: string | null | undefined): boolean {
  return (email ?? '').toLowerCase().endsWith('@users.auth0.local');
}

export function publicAuthDisplayName(input: {
  name?: string | null;
  givenName?: string | null;
  nickname?: string | null;
  email?: string | null;
  fallback?: string;
}): string {
  const email = input.email?.trim() || '';
  const emailLabel =
    email && email.includes('@') && !isPlaceholderAuthEmail(email) ? email.split('@')[0] : '';
  const candidates = [input.name, input.givenName, input.nickname, emailLabel, email];
  const picked = candidates.find((value) => value && !isAuth0Identifier(value));
  return picked?.trim() || input.fallback || 'Account';
}

export function isUsableAvatarUrl(url: string | null | undefined): boolean {
  const value = url?.trim() ?? '';
  if (!value) return false;
  if (value.startsWith('data:')) return false;
  return /^https?:\/\//i.test(value);
}

export const AUTH0_CALLBACK_PATH = '/auth/callback';
export const AUTH0_LOGIN_PATH = '/auth/login';
export const AUTH0_LOGOUT_PATH = '/auth/logout';

/** Auth0 Allowed Logout URLs must include this exact value (no /auth/login path). */
export function getAuth0LogoutReturnTo(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}
