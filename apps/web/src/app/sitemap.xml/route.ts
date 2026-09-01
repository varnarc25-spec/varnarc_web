import { headers as nextHeaders } from 'next/headers';
import { SITEMAP_TYPES } from '@varnarc/validation';

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

function ensureProductionUrls(xml: string, publicUrl: string) {
  return xml.replace(/https?:\/\/localhost:\d+/g, publicUrl);
}

function buildSitemapIndex(publicUrl: string) {
  const now = new Date().toISOString();
  const entries = SITEMAP_TYPES.map(
    (type) =>
      `  <sitemap>\n    <loc>${publicUrl}/sitemap/${type}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

export async function GET() {
  const reqHeaders = await nextHeaders();
  const publicUrl = resolvePublicUrl(reqHeaders);
  const respHeaders = { 'Content-Type': 'application/xml; charset=utf-8' };
  try {
    const res = await fetch(`${apiUrl}/seo/sitemap`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return new Response(buildSitemapIndex(publicUrl), { headers: respHeaders });
    }
    const xml = await res.text();
    if (!xml || xml.trim().length < 100) {
      return new Response(buildSitemapIndex(publicUrl), { headers: respHeaders });
    }
    return new Response(ensureProductionUrls(xml, publicUrl), { headers: respHeaders });
  } catch {
    return new Response(buildSitemapIndex(publicUrl), { headers: respHeaders });
  }
}
