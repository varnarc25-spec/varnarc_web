import { proxySeo } from '@/lib/seo-proxy';

export async function GET(req: Request) {
  return proxySeo('/redirects', 'GET', undefined, req);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySeo('/redirects', 'POST', body);
}
