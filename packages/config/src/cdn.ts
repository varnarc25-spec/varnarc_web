/** CDN cache-control helpers for public responses. */
export const CDN_CACHE = {
  staticImmutable: 'public, max-age=31536000, immutable',
  publicShort: 'public, s-maxage=300, stale-while-revalidate=600',
  publicHour: 'public, s-maxage=3600, stale-while-revalidate=86400',
  noStore: 'private, no-store',
} as const;

export const CDN_HEADER_RULES = [
  {
    source: '/_next/static/:path*',
    headers: [{ key: 'Cache-Control', value: CDN_CACHE.staticImmutable }],
  },
  {
    source: '/fonts/:path*',
    headers: [{ key: 'Cache-Control', value: CDN_CACHE.staticImmutable }],
  },
] as const;

/** Mutable copy for Next.js `headers()` config. */
export function getCdnHeaderRules(): Array<{
  source: string;
  headers: Array<{ key: string; value: string }>;
}> {
  return CDN_HEADER_RULES.map((rule) => ({
    source: rule.source,
    headers: rule.headers.map((header) => ({ key: header.key, value: header.value })),
  }));
}
