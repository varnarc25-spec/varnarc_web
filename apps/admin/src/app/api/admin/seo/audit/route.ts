import { proxySeo } from '@/lib/seo-proxy';

export async function GET(req: Request) {
  return proxySeo('/audit', 'GET', undefined, req);
}

export async function POST() {
  return proxySeo('/audit/run', 'POST');
}
