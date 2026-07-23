import { proxySeo } from '@/lib/seo-proxy';

export async function GET(req: Request) {
  return proxySeo('/dashboard', 'GET', undefined, req);
}
