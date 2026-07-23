import { proxySeo } from '@/lib/seo-proxy';

export async function GET(req: Request) {
  return proxySeo('/analytics', 'GET', undefined, req);
}
