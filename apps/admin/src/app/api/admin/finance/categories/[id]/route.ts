import { proxyFinance } from '@/lib/finance-proxy';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyFinance(`/finance/admin/categories/${id}`, 'GET');
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyFinance(`/finance/categories/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyFinance(`/finance/categories/${id}`, 'DELETE');
}
