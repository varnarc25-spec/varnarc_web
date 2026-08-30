import { proxyConstructionSeoAudit } from '@/lib/construction-seo-audit-proxy';

export async function GET(req: Request) {
  return proxyConstructionSeoAudit('/issues', 'GET', undefined, req);
}
