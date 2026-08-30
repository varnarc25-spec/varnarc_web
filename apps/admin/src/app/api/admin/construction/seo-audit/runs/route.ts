import { proxyConstructionSeoAudit } from '@/lib/construction-seo-audit-proxy';

export async function GET(req: Request) {
  return proxyConstructionSeoAudit('/runs', 'GET', undefined, req);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyConstructionSeoAudit('/runs', 'POST', body);
}
