import { proxyConstruction } from '@/lib/construction-proxy';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyConstruction(`/construction/materials/${id}`, 'GET');
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyConstruction(`/construction/materials/${id}`, 'PUT', body);
}
