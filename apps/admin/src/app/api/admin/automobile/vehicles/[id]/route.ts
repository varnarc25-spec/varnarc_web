import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAutomobile(`/automobile/vehicles/${id}`, 'GET');
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyAutomobile(`/automobile/vehicles/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAutomobile(`/automobile/vehicles/${id}`, 'DELETE');
}
