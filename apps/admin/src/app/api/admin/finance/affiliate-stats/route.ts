import { proxyFinance } from '@/lib/finance-proxy';

export async function GET() {
  return proxyFinance('/finance/admin/affiliate-stats', 'GET');
}
