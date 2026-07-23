import { proxySeo } from '@/lib/seo-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySeo('/redirects/import', 'POST', body);
}
