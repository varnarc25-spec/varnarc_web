import { headers } from 'next/headers';
import { getAppBaseUrl, resolveAppBaseUrlFromHeaders } from '@varnarc/auth';
import { CANONICAL_WEB_ORIGIN } from '@/lib/www-canonical';

export const PRODUCTION_SITE_URL = CANONICAL_WEB_ORIGIN;

function isLocalSiteUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** Server-safe public origin. Never keep localhost in production. */
export function getPublicSiteUrlSync(): string {
  const fromEnv = getAppBaseUrl();
  if (!isLocalSiteUrl(fromEnv)) return stripSlash(fromEnv);
  if (process.env.NODE_ENV === 'production') return PRODUCTION_SITE_URL;
  return stripSlash(fromEnv);
}

/** Prefer env, then request Host, then production default. */
export async function getPublicSiteUrl(): Promise<string> {
  const fromEnv = getAppBaseUrl();
  if (!isLocalSiteUrl(fromEnv)) return stripSlash(fromEnv);
  try {
    const resolved = resolveAppBaseUrlFromHeaders(await headers());
    if (!isLocalSiteUrl(resolved)) return stripSlash(resolved);
  } catch {
    // Called outside a request (build, tests).
  }
  return getPublicSiteUrlSync();
}
