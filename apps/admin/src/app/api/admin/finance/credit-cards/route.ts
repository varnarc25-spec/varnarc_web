import { proxyFinance } from '@/lib/finance-proxy';

export async function GET(request: Request) {
  return proxyFinance('/finance/admin/credit-cards', 'GET', undefined, request);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyFinance('/finance/credit-cards', 'POST', body);
}
