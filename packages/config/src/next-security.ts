/** Shared Next.js security headers (no `next` import). */
export const nextSecurityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
] as const;

export function getSecurityHeaders(): Array<{ key: string; value: string }> {
  const headers: Array<{ key: string; value: string }> = nextSecurityHeaders.map((header) => ({
    key: header.key,
    value: header.value,
  }));

  if (process.env.NODE_ENV === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}

export function withSecurityHeaders<T extends Record<string, unknown>>(config: T): T {
  const existingHeaders = typeof config.headers === 'function' ? config.headers : undefined;

  return {
    ...config,
    async headers() {
      const prior = existingHeaders ? await existingHeaders() : [];
      const security = getSecurityHeaders().map((header) => ({
        source: '/:path*',
        headers: [header],
      }));
      return [...prior, ...security];
    },
  };
}
