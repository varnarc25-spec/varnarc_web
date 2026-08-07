import { proxyFinance } from '@/lib/finance-proxy';

export async function GET(_request: Request, context: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await context.params;
  return proxyFinance(`/finance/admin/pages/${pageKey}`, 'GET');
}

export async function PUT(request: Request, context: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await context.params;
  const body = await request.json();
  return proxyFinance(`/finance/admin/pages/${pageKey}`, 'PUT', body);
}
