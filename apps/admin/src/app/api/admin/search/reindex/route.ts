import { proxySearch } from '@/lib/search-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxySearch('/search/reindex', 'POST', body);
}
