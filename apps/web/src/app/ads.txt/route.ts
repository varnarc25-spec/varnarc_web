import { fetchAdsensePublicConfig, getAdsensePublisherIdFromConfig } from '@/lib/adsense-config';

export async function GET() {
  const config = await fetchAdsensePublicConfig();
  const publisherId = getAdsensePublisherIdFromConfig(config);
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : '# Configure Google AdSense publisher ID in Admin → Settings → Google AdSense\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
