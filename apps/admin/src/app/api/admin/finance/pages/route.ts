import { proxyFinance } from '@/lib/finance-proxy';

export async function GET(request: Request) {
  return proxyFinance('/finance/admin/pages', 'GET', undefined, request);
}
