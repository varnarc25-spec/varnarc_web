import { getAdsensePublisherId } from '@/lib/adsense-config';

export function GET() {
  const publisherId = getAdsensePublisherId();
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : '# Set NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxx to enable Google AdSense ads.txt\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
