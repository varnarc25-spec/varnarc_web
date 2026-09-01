import { headers as nextHeaders } from 'next/headers';
import { mergeSeoDisallowPaths, SEO_DEFAULT_ALLOW_PATHS, SITEMAP_TYPES } from '@varnarc/validation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const PROD_SITE_URL = 'https://varnarc.com';

function resolvePublicUrl(requestHeaders: Headers): string {
  const host = requestHeaders.get('host');
  if (host && !host.includes('localhost')) {
    const proto = requestHeaders.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return PROD_SITE_URL;
}

function ensureProductionUrls(text: string, publicUrl: string) {
  return text.replace(/https?:\/\/localhost:\d+/g, publicUrl);
}

function buildFallbackRobots(publicUrl: string) {
  const lines = ['User-agent: *'];
  for (const path of SEO_DEFAULT_ALLOW_PATHS) {
    lines.push(`Allow: ${path}`);
  }
  for (const path of mergeSeoDisallowPaths()) {
    lines.push(`Disallow: ${path}`);
  }
  lines.push(`Sitemap: ${publicUrl}/sitemap.xml`);
  for (const type of SITEMAP_TYPES) {
    lines.push(`Sitemap: ${publicUrl}/sitemap/${type}.xml`);
  }
  return `${lines.join('\n')}\n`;
}

export async function GET() {
  if (process.env.NODE_ENV !== 'production') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const reqHeaders = await nextHeaders();
  const publicUrl = resolvePublicUrl(reqHeaders);

  try {
    const res = await fetch(`${apiUrl}/seo/robots.txt`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return new Response(buildFallbackRobots(publicUrl), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    const text = await res.text();
    if (!text || text.trim().length < 20) {
      return new Response(buildFallbackRobots(publicUrl), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return new Response(ensureProductionUrls(text, publicUrl), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response(buildFallbackRobots(publicUrl), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
