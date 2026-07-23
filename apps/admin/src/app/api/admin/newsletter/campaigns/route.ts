import { proxyNewsletter } from '@/lib/newsletter-proxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyNewsletter(`/campaigns?${url.searchParams.toString()}`, 'GET');
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyNewsletter('/campaigns', 'POST', body);
}
