import { proxyAutomobile } from '@/lib/automobile-proxy';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyAutomobile(`/automobile/maintenance/${id}`, 'PUT', body);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyAutomobile(`/automobile/maintenance/${id}`, 'DELETE');
}
