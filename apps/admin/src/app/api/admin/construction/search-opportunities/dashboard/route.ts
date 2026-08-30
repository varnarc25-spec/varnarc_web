import { proxyConstructionSearchOpportunities } from '@/lib/construction-search-opportunity-proxy';

export async function GET(req: Request) {
  return proxyConstructionSearchOpportunities('/dashboard', 'GET', undefined, req);
}
