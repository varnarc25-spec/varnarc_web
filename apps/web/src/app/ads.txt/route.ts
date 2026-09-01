import { DEFAULT_ADSENSE_CLIENT, fetchAdsensePublicConfig } from '@/lib/adsense-config';

function adsTxtLine(client: string) {
  const publisherId = client.replace(/^ca-pub-/i, 'pub-');
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
}

export async function GET() {
  let client = DEFAULT_ADSENSE_CLIENT;
  try {
    const config = await fetchAdsensePublicConfig({ signal: AbortSignal.timeout(2_000) });
    if (config.client?.trim()) client = config.client.trim();
  } catch {
    // Always serve a valid ads.txt even if the API is slow or down.
  }

  return new Response(adsTxtLine(client), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
