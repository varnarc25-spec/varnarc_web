export const CANONICAL_WEB_HOST = 'varnarc.com';
export const CANONICAL_WEB_ORIGIN = `https://${CANONICAL_WEB_HOST}`;

function normalizeHost(host: string | null | undefined): string {
  return (host ?? '').split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? '';
}

function normalizeProto(proto: string | null | undefined): string {
  return (proto ?? '').split(',')[0]?.trim().toLowerCase() || 'https';
}

/**
 * 301 www → apex and http → https for the public site.
 * Returns a full destination URL, or null when already canonical.
 */
export function resolveHostCanonicalRedirect(input: {
  host: string | null | undefined;
  proto: string | null | undefined;
  pathname: string;
  search?: string;
}): string | null {
  const host = normalizeHost(input.host);
  if (!host || host === 'localhost' || host.startsWith('127.') || host.startsWith('0.0.0.0')) {
    return null;
  }

  const isWww = host === `www.${CANONICAL_WEB_HOST}`;
  const isApex = host === CANONICAL_WEB_HOST;
  if (!isWww && !isApex) return null;

  const proto = normalizeProto(input.proto);
  if (!isWww && proto === 'https') return null;

  const path = input.pathname.startsWith('/') ? input.pathname : `/${input.pathname}`;
  const search = input.search ?? '';
  return `${CANONICAL_WEB_ORIGIN}${path}${search}`;
}
