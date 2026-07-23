import { proxySeo } from '@/lib/seo-proxy';

export async function GET(req: Request) {
  return proxySeo('/sitemaps/status', 'GET', undefined, req);
}

export async function POST() {
  return proxySeo('/sitemaps/rebuild', 'POST');
}
