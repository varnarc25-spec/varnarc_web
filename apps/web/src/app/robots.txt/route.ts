const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

function fixLocalhostUrls(text: string) {
  return text.replace(/https?:\/\/localhost:\d+/g, siteUrl);
}

export async function GET() {
  if (process.env.NODE_ENV !== 'production') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const res = await fetch(`${apiUrl}/seo/robots.txt`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    const text = await res.text();
    return new Response(fixLocalhostUrls(text), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /profile\nSitemap: ${siteUrl}/sitemap.xml\n`,
      {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    );
  }
}
