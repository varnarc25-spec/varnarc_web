import { proxyConstructionSeoAudit } from '@/lib/construction-seo-audit-proxy';

export async function GET() {
  return proxyConstructionSeoAudit('/dashboard', 'GET');
}
