import { proxyFinance } from '@/lib/finance-proxy';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyFinance(`/finance/credit-cards/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyFinance(`/finance/credit-cards/${id}`, 'DELETE');
}
