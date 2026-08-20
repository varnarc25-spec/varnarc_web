const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

const SITEMAP_TYPES = [
  'articles',
  'pages',
  'reviews',
  'calculators',
  'ai-tools',
  'directory',
  'comparisons',
  'finance',
  'construction',
  'automobile',
] as const;

function buildFallbackSitemapIndex() {
  const now = new Date().toISOString();
  const entries = SITEMAP_TYPES.map(
    (type) =>
      `  <sitemap>\n    <loc>${siteUrl}/sitemap/${type}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

export async function GET() {
  const headers = { 'Content-Type': 'application/xml; charset=utf-8' };
  try {
    const res = await fetch(`${apiUrl}/seo/sitemap`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return new Response(buildFallbackSitemapIndex(), { headers });
    }
    const xml = await res.text();
    if (!xml || xml.trim().length < 100) {
      return new Response(buildFallbackSitemapIndex(), { headers });
    }
    return new Response(xml, { headers });
  } catch {
    return new Response(buildFallbackSitemapIndex(), { headers });
  }
}
