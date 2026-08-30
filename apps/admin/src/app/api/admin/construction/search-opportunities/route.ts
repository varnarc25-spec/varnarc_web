import { proxyConstructionSearchOpportunities } from '@/lib/construction-search-opportunity-proxy';

export async function GET(req: Request) {
  return proxyConstructionSearchOpportunities('', 'GET', undefined, req);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // POST without id → aggregate
  const url = new URL(req.url);
  if (url.searchParams.get('action') === 'aggregate' || body?.action === 'aggregate') {
    return proxyConstructionSearchOpportunities('/aggregate', 'POST', {});
  }
  return proxyConstructionSearchOpportunities('/aggregate', 'POST', {});
}
